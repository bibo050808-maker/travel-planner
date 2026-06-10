import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from './store/AppContext'
import SearchPage from './pages/SearchPage'
import CityDetailPage from './pages/CityDetailPage'
import RoutePage from './pages/RoutePage'
import FoodStayPage from './pages/FoodStayPage'
import BuddyPage from './pages/BuddyPage'
import GuidePage from './pages/GuidePage'
import ProfilePage from './pages/ProfilePage'
import SplashScreen from './components/SplashScreen'
import OnboardingGuide from './components/OnboardingGuide'
import { initStorage, loadFavorites } from './utils/storage'
import { refreshData } from './engine/dataEngine'
import Icon from './components/Icon'
import ErrorBoundary from './components/ErrorBoundary'
import styles from './App.module.css'

// PROFILE TAB ENABLED v2
const TABS = [
  { id: 'search', label: '探索', icon: 'search', path: '/' },
  { id: 'route', label: '路线', icon: 'map', path: '/route' },
  { id: 'food', label: '食宿', icon: 'food', path: '/food' },
  { id: 'buddy', label: '搭子', icon: 'buddy', path: '/buddy' },
  { id: 'guide', label: '攻略', icon: 'guide', path: '/guide' },
  { id: 'profile', label: '我的', icon: 'user', path: '/profile' },
];

export default function App() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const mainRef = useRef(null)
  const [animating, setAnimating] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const currentTab = TABS.find(t => t.path === location.pathname)?.id || 'search'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme)
  }, [state.theme])

 useEffect(() => {
   async function boot() {
      dispatch({ type: 'SET_LOADING', payload: true })
      await initStorage()
      await refreshData()
      const favs = await loadFavorites()
      if (favs) dispatch({ type: 'SET_FAVORITES', payload: favs })
      dispatch({ type: 'SET_LOADING', payload: false })
    }
    const seen = localStorage.getItem('onboardingDone')
    if (!seen) setShowOnboarding(true)
    boot()
  }, [])

  const switchTab = (tab) => {
    if (tab.id === currentTab) return
    setAnimating(true)
    setTimeout(() => setAnimating(false), 250)
    dispatch({ type: 'SET_TAB', payload: tab.id })
    navigate(tab.path)
    if (mainRef.current) mainRef.current.scrollTop = 0
  }

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' })
  }

  const handleSplashFinish = () => setShowSplash(false)
  const handleOnboardingFinish = () => {
    localStorage.setItem('onboardingDone', 'true')
    setShowOnboarding(false)
  }

  const showApp = !showSplash && !showOnboarding

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      {!showSplash && showOnboarding && <OnboardingGuide onFinish={handleOnboardingFinish} />}
      {showApp && (
        <div className={styles.shell}>
          <aside className={styles.sidebar}>
            {TABS.map(tab => (
              <button key={tab.id}
                className={`${styles.sideBtn} ${currentTab === tab.id ? styles.active : ''}`}
                onClick={() => switchTab(tab)} title={tab.label}>
                <Icon name={tab.icon} size={22} className={styles.sideIcon} />
                <span className={styles.sideLabel}>{tab.label}</span>
              </button>
            ))}
          <button
            className={`${styles.navItem} ${currentTab === 'profile' ? styles.active : ''}`}
            onClick={() => switchTab({ id: 'profile', label: '我的', icon: 'user', path: '/profile' })}>
            <Icon name="user" size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>我的</span>
          </button>
          
          <button className={`${styles.sideBtn} ${currentTab === 'profile' ? styles.active : ''}`}
            onClick={() => switchTab({ id: 'profile', label: '我的', icon: 'user', path: '/profile' })} title="我的">
            <Icon name="user" size={22} className={styles.sideIcon} />
            <span className={styles.sideLabel}>我的</span>
          </button>
          
            <button className={`${styles.sideBtn} ${styles.themeBtn}`} onClick={toggleTheme} title="切换主题">
              <Icon name={state.theme === 'light' ? 'moon' : 'sun'} size={22} className={styles.sideIcon} />
              <span className={styles.sideLabel}>{state.theme === 'light' ? '暗黑' : '亮色'}</span>
            </button>
          </aside>
          <main ref={mainRef} className={`${styles.main} ${animating ? styles.fadeOut : styles.fadeIn}`}>
            <ErrorBoundary><Routes>
              <Route path="/" element={<SearchPage onToggleTheme={toggleTheme} />} />
              <Route path="/city/:cityId" element={<CityDetailPage />} />
              <Route path="/route" element={<RoutePage />} />
              <Route path="/food" element={<FoodStayPage />} />
              <Route path="/buddy" element={<BuddyPage />} />
              <Route path="/guide" element={<GuidePage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes></ErrorBoundary>
          </main>
          <nav className={styles.bottomNav}>
            {TABS.map(tab => (
              <button key={tab.id}
                className={`${styles.navItem} ${currentTab === tab.id ? styles.active : ''}`}
                onClick={() => switchTab(tab)}>
                <Icon name={tab.icon} size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
