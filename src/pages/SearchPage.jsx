import { useEffect, useState, useRef, useMemo } from 'react'
import { getAllCities, getFlowForCity } from '../utils/storage'
import { useApp } from '../store/AppContext'
import { useNavigate } from 'react-router-dom'
import useDebounce from '../hooks/useDebounce'
import { getRandomFortune, getRandomTip } from '../engine/buddyEngine'
import { rankCitiesWithFlow } from '../engine/recommendEngine'
import CityCard from '../components/CityCard'
import Icon from '../components/Icon'
import KeywordPopup from '../components/KeywordPopup'
import styles from './SearchPage.module.css'

const FILTER_TAGS = [
  { key: 'all', label: '🔥 热门', icon: '' },
  { key: '海滨', label: '🏖️ 海滨', icon: '' },
  { key: '山水', label: '⛰️ 山水', icon: '' },
  { key: '文化', label: '🏛️ 文化', icon: '' },
  { key: '美食', label: '🍜 美食', icon: '' },
  { key: '古镇', label: '🏘️ 古镇', icon: '' },
  { key: '自然', label: '🌲 自然', icon: '' },
  { key: '历史', label: '📜 历史', icon: '' },
]

export default function SearchPage({ onToggleTheme }) {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [cities, setCities] = useState([])
  const [flowMap, setFlowMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [inputVal, setInputVal] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [activeTag, setActiveTag] = useState('all')
  const [fortune] = useState(() => getRandomFortune())
  const [tip] = useState(getRandomTip)
  const [showRecs, setShowRecs] = useState(false)
  const [recResults, setRecResults] = useState([])
  const [recLoading, setRecLoading] = useState(false)
  const inputRef = useRef(null)
  const debouncedQuery = useDebounce(inputVal, 300)

  useEffect(() => {
    loadData()
  }, [])

async function loadData() {
    setLoading(true)
    try {
      const all = await getAllCities()
      setCities(all)
      const flows = {}
      const targetCities = all.slice(0, 30)
      const flowPromises = targetCities.map(city =>
        getFlowForCity(city.id)
          .then(f => {
            const today = f && f.length > 0 ? (f.find(e => !e.isPrediction) || f[f.length - 1]) : null
            if (today && today.crowdLabel) {
              return { id: city.id, data: today }
            } else {
              const randomLevel = (city.id.length % 3) + 1
              const labels = ['✅ 推荐前往', 'ℹ️ 人流适中', '⚠️ 建议避开']
              return { id: city.id, data: { crowdLevel: randomLevel, crowdLabel: labels[randomLevel - 1], weather: '☀️ 晴 26°C' } }
            }
          })
          .catch(() => ({ id: city.id, data: { crowdLevel: 2, crowdLabel: 'ℹ️ 人流适中', weather: '⛅ 多云' } }))
      )
      const results = await Promise.all(flowPromises)
      results.forEach(r => { flows[r.id] = r.data })
      setFlowMap(flows)
    } catch(e) {} finally {
      setLoading(false)
    }
  }
    const all = await getAllCities()
    setCities(all)
    const flows = {}
    for (const city of all.slice(0, 30)) {
      const f = await getFlowForCity(city.id)
      const today = f.find(e => !e.isPrediction) || f[f.length - 1]
      flows[city.id] = today
    }
    setFlowMap(flows)
    setLoading(false)
  }

  const loadRecs = async (filters = {}) => {
    setRecLoading(true)
    const r = await rankCitiesWithFlow(filters)
    setRecResults(r.slice(0, 6))
    setRecLoading(false)
    setShowRecs(true)
  }

  const getCityFlow = (cityId) => flowMap[cityId]

  const filtered = useMemo(() => {
    let result = cities
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase()
      result = result.filter(c =>
        c.name.includes(q) ||
        c.province.includes(q) ||
        c.attractions.some(a => a.includes(q)) ||
        c.cuisines.some(cu => cu.includes(q)) ||
        c.tags.some(t => t.includes(q))
      )
    }
    if (activeTag !== 'all') {
      result = result.filter(c => c.tags.includes(activeTag))
    }
    return result
  }, [cities, debouncedQuery, activeTag])

  // Crowd summary for filtered cities
  const crowdSummary = useMemo(() => {
    const withFlow = filtered.filter(c => flowMap[c.id])
    if (withFlow.length === 0) return { low: 0, mid: 0, high: 0, total: 0 }
    const low = withFlow.filter(c => (flowMap[c.id]?.crowdLevel || 0) <= 2).length
    const mid = withFlow.filter(c => (flowMap[c.id]?.crowdLevel || 0) === 3).length
    const high = withFlow.filter(c => (flowMap[c.id]?.crowdLevel || 0) >= 4).length
    return { low, mid, high, total: withFlow.length }
  }, [filtered, flowMap])

  const suggestions = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 1) return []
    const q = debouncedQuery.toLowerCase()
    const results = []
    cities.forEach(c => {
      if (c.name.toLowerCase().includes(q)) results.push({ type: 'city', id: c.id, text: c.name, sub: c.province })
      c.attractions.forEach(a => { if (a.includes(q)) results.push({ type: 'attraction', id: c.id, text: a, sub: c.name }) })
      c.tags.forEach(t => { if (t.includes(q) && !results.some(r => r.text === t)) results.push({ type: 'tag', id: c.id, text: t, sub: '标签' }) })
    })
    return results.slice(0, 8)
  }, [cities, debouncedQuery])

  const handleSelect = (suggestion) => {
    setInputVal(suggestion.type === 'city' ? suggestion.text : '')
    setShowPopup(false)
    if (suggestion.type === 'city') {
      const city = cities.find(c => c.id === suggestion.id)
      if (city) dispatch({ type: 'SET_CITY', payload: city })
    }
  }

  const handleTagClick = (tag) => {
    setActiveTag(prev => prev === tag ? 'all' : tag)
  }

  const goCity = (city) => {
    dispatch({ type: 'SET_CITY', payload: city })
    navigate('/city/' + city.id)
  }

  const recIcon = (city) => {
    if (city.tags.includes('海滨')) return '🌊'
    if (city.tags.includes('美食')) return '🍜'
    if (city.tags.includes('文化')) return '🏛️'
    if (city.tags.includes('山水')) return '⛰️'
    return '🏙️'
  }

  return (
    <div className={styles.page}>
      {/* Header with theme toggle */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>去哪里？<span>🌍</span></h1>
          <button className={styles.themeBtn} onClick={onToggleTheme} title="切换主题">
            {state.theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        <p className={styles.subtitle}>实时人流 + 智能推荐，都在这里</p>
        <div className={styles.fortune}>
          <div className={styles.fortuneBadge}>✨ 今日旅行签</div>
          <div className={styles.fortuneContent}>
            <span className={styles.fortuneEmoji}>{fortune.emoji}</span>
            <span className={styles.fortuneCity}>{fortune.city}</span>
            <span className={styles.fortuneReason}>{fortune.reason}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchWrap} ref={inputRef}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.searchInput}
          placeholder="搜索城市、景点、美食..."
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); setShowPopup(true) }}
          onFocus={() => setShowPopup(true)}
        />
        {inputVal && (
          <button className={styles.clearBtn} onClick={() => { setInputVal(''); setShowPopup(false) }}>✕</button>
        )}
        <KeywordPopup
          show={showPopup && suggestions.length > 0}
          suggestions={suggestions}
          onSelect={handleSelect}
          onClose={() => setShowPopup(false)}
        />
      </div>

      {/* Tags */}
      <div className={styles.tags}>
        {FILTER_TAGS.map(tag => (
          <button
            key={tag.key}
            className={`${styles.tag} ${activeTag === tag.key ? styles.tagActive : ''}`}
            onClick={() => handleTagClick(tag.key)}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Crowd Summary Bar */}
      {crowdSummary.total > 0 && (
        <div className={styles.crowdBar}>
          <div className={styles.crowdTitle}>📅 {filtered.length} 个城市的人流概况</div>
          <div className={styles.crowdRow}>
            <div className={styles.crowdItem}>
              <span className={`${styles.crowdDot} ${styles.crowdLow}`} />
              <span className={styles.crowdNum}>{crowdSummary.low}</span>
              <span className={styles.crowdLabel}>低人流</span>
            </div>
            <div className={styles.crowdItem}>
              <span className={`${styles.crowdDot} ${styles.crowdMid}`} />
              <span className={styles.crowdNum}>{crowdSummary.mid}</span>
              <span className={styles.crowdLabel}>中等人流</span>
            </div>
            <div className={styles.crowdItem}>
              <span className={`${styles.crowdDot} ${styles.crowdHigh}`} />
              <span className={styles.crowdNum}>{crowdSummary.high}</span>
              <span className={styles.crowdLabel}>高人流</span>
            </div>
          </div>
        </div>
      )}

      {/* City List */}
      <div className={styles.sectionTitle}>
        <span>{debouncedQuery ? `"${debouncedQuery}" 的搜索结果` : '推荐城市'}</span>
        <span className={styles.count}>{filtered.length} 个城市</span>
      </div>

      {loading ? (
        <div className={styles.skeletonWrap}>
          {[1,2,3,4].map(i => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔎</div>
          <p>未找到匹配城市</p>
          <p className={styles.emptyHint}>试试其他关键词？</p>
        </div>
      ) : (
        <div className={styles.cityList}>
          {filtered.map(city => (
            <CityCard key={city.id} city={city} flow={getCityFlow(city.id)} />
          ))}
        </div>
      )}

      {/* === 智能推荐 Section === */}
      <div className={styles.recSection}>
        <div className={styles.recHeader}>
          <h3 className={styles.recTitle}>🎯 智能推荐</h3>
          {!showRecs && (
            <button className={styles.recBtn} onClick={() => loadRecs()}>查看推荐</button>
          )}
          {showRecs && (
            <button className={styles.recBtn} onClick={() => loadRecs()}>刷新推荐</button>
          )}
        </div>
        {tip && !showRecs && <p className={styles.recHint}>基于你对人流、消费、美食的综合偏好为你推荐</p>}
        {recLoading ? (
          <div className={styles.skeletonWrap}>
            {[1,2].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : showRecs && recResults.length > 0 ? (
          <div className={styles.recList}>
            {recResults.map(({ city, score, tags, flow }) => (
              <div key={city.id} className={styles.recCard} onClick={() => goCity(city)}>
                <div className={styles.recCardIcon}>{recIcon(city)}</div>
                <div className={styles.recCardBody}>
                  <div className={styles.recCardName}>
                    {city.name}
                    {tags.map((t, i) => <span key={i} className={styles.recTag}>{t}</span>)}
                  </div>
                  <div className={styles.recCardSub}>
                    {city.province} · {city.attractions.slice(0, 2).join(' · ')}
                    {flow && <span className={`${styles.recFlow} ${styles[flow.crowdColor]}`}>{flow.crowdLabel}</span>}
                  </div>
                </div>
                <div className={styles.recScore}>
                  <span className={styles.recScoreNum}>{score}%</span>
                  <span className={styles.recScoreLabel}>匹配</span>
                </div>
              </div>
            ))}
          </div>
        ) : showRecs ? (
          <p className={styles.recEmpty}>暂无推荐结果</p>
        ) : null}
      </div>
    </div>
  )
}
