import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCityById, getFlowForCity, saveFavorites, loadFavorites } from '../utils/storage'
import { useApp } from '../store/AppContext';
import ReviewForm from '../components/ReviewForm'
import ReviewCard from '../components/ReviewCard'
import { saveReview, getReviewsForCity } from '../utils/storage'
import styles from './CityDetailPage.module.css'

export default function CityDetailPage() {
  const { cityId } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const [city, setCity] = useState(null)
  const [flows, setFlows] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const isFav = state.favorites.includes(cityId)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const c = await getCityById(cityId)
      setCity(c)
      loadReviews()
      if (c) {
        const f = await getFlowForCity(cityId)
        setFlows(f)
      }
      setLoading(false)
    }
    load()
  }, [cityId])

  const loadReviews = async () => {
    if (cityId) {
      const r = await getReviewsForCity(cityId)
      setReviews(r)
    }
  }

  const toggleFavorite = async () => {
    const newFavs = isFav
      ? state.favorites.filter(id => id !== cityId)
      : [...state.favorites, cityId]
    dispatch({ type: 'SET_FAVORITES', payload: newFavs })
    await saveFavorites(newFavs)
  }

  var handleAddToGuide = function() { dispatch({ type: 'SET_CITY', payload: city }); dispatch({ type: 'ADD_TRIP_CITY', payload: city }); navigate('/guide') }

  const goToFood = () => {
    dispatch({ type: 'SET_CITY', payload: city })
    navigate('/food')
  }

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>
  if (!city) return <div className={styles.loading}>城市数据未找到</div>

  const costStr = '💰'.repeat(city.costLevel)
  const bestMonthsStr = city.bestMonths?.map(m => `${m}月`).join('、')

  const predFlows = flows.filter(f => f.isPrediction)
  const todayFlow = flows.find(f => !f.isPrediction) || flows[flows.length - 1]
  const crowdAdvice = todayFlow?.crowdLevel <= 2
    ? { label: '✅ 推荐前往', cls: styles.adviceGood }
    : todayFlow?.crowdLevel <= 3
    ? { label: 'ℹ️ 中等人流', cls: styles.adviceWarn }
    : { label: '⚠️ 建议避开', cls: styles.adviceHigh }

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>← 返回</button>

      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <h1 className={styles.cityName}>{city.name}</h1>
          <p className={styles.province}>{city.province}</p>
          <span className={crowdAdvice.cls}>{crowdAdvice.label}</span>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statVal2}>{costStr}</div>
          <div className={styles.statLabel2}>消费水平</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>⭐</div>
          <div className={styles.statVal2}>{city.foodScore}</div>
          <div className={styles.statLabel2}>美食评分</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>🌤️</div>
          <div className={styles.statVal2}>{todayFlow?.weather?.split(' ')[0] || '晴'}</div>
          <div className={styles.statLabel2}>天气</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>🛏️</div>
          <div className={styles.statVal2}>¥{city.avgHotelPrice}</div>
          <div className={styles.statLabel2}>住宿均价</div>
        </div>
      </div>

      {bestMonthsStr && (
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>📅 最佳旅行月份</span>
          <span className={styles.infoValue}>{bestMonthsStr}</span>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>📊 未来两周人流趋势</div>
        <div className={styles.predBars}>
          {predFlows.map(f => {
            var parts = f.date ? f.date.split('-') : []
            var shortDate = parts.length >= 3 ? parseInt(parts[1]) + '/' + parseInt(parts[2]) : '--'
            return (
              <div key={f.date} className={styles.predItem}>
                <div className={styles.predBar} style={{
                  height: `${(f.crowdLevel / 5) * 50}px`,
                  background: f.crowdLevel <= 2 ? 'var(--crowd-low)' : f.crowdLevel <= 3 ? 'var(--crowd-mid)' : 'var(--crowd-high)'
                }} />
                <span className={styles.predDate}>{shortDate}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>🏛️ 热门景点</div>
        <div className={styles.tagList}>
          {city.attractions.map(a => <span key={a} className={styles.attrTag}>{a}</span>)}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>🍜 特色美食</div>
        <div className={styles.tagList}>
          {city.cuisines.map(c => <span key={c} className={styles.foodTag}>{c}</span>)}
        </div>
      </div>

      <div className={styles.adviceBox}>
        <div className={styles.adviceTitle}>💡 智能出行建议</div>
        <div className={styles.adviceContent}>
          {todayFlow?.crowdLevel >= 4
            ? `${city.name}近期人流较多，建议避开周末和节假日出行。推荐${bestMonthsStr}期间前往，人流较低且天气舒适。`
            : `${city.name}当前人流适中，是出行的不错选择。最佳旅行月份为${bestMonthsStr}。建议提前预订住宿。`}
        </div>
      </div>

      {/* === 用户评价区 === */}
      <div className={styles.reviewSection}>
        <h3 className={styles.sectionTitle}>📝 用户评价</h3>

        <ReviewForm cityId={cityId} onSubmit={async (review) => {
          await saveReview(review)
          loadReviews()
        }} />

        {reviews.length > 0 ? (
          reviews.map(r => <ReviewCard key={r.id} review={r} />)
        ) : (
          <p className={styles.noReview}>暂无评价，来写下第一条吧！</p>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={handleAddToGuide}>添加到攻略</button>
        <button className={`${styles.actionBtn} ${isFav ? styles.favActive : ''}`} onClick={toggleFavorite}>
          {isFav ? '❤️ 已收藏' : '🤍 收藏'}
        </button>
        <button className={styles.actionBtn} onClick={goToFood}>
          🍜 查看食宿
        </button>
      </div>
    </div>
  )
}
