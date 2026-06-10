import { useState, useEffect } from 'react'
import { getCityById, getAllCities } from '../utils/storage'
import { useApp } from '../store/AppContext'
import { generateFoodData, generateStayData } from '../engine/foodStayEngine'
import styles from './FoodStayPage.module.css'

export default function FoodStayPage() {
  const { state } = useApp()
  const [cities, setCities] = useState([])
  const [city, setCity] = useState(null)
  const [foodData, setFoodData] = useState([])
  const [stayData, setStayData] = useState([])
  const [foodSort, setFoodSort] = useState('default')
  const [staySort, setStaySort] = useState('default')
  const [activeTab, setActiveTab] = useState('food')
  const [cityId, setCityId] = useState(state.selectedCity?.id || '')

  useEffect(() => {
    getAllCities().then(all => {
      setCities(all)
      if (!cityId && all.length > 0) setCityId(all[0].id)
    })
  }, [])

  useEffect(() => {
    if (!cityId) return
    getCityById(cityId).then(c => {
      setCity(c)
      if (c) {
        setFoodData(generateFoodData(c))
        setStayData(generateStayData(c))
      }
    })
  }, [cityId])

  const sortFood = (data, sort) => {
    const d = [...data]
    if (sort === 'price-asc') return d.sort((a, b) => a.avgPrice - b.avgPrice)
    if (sort === 'rating') return d.sort((a, b) => b.rating - a.rating)
    if (sort === 'distance') return d.sort((a, b) => a.distance - b.distance)
    return d
  }

  const sortStay = (data, sort) => {
    const d = [...data]
    if (sort === 'price-asc') return d.sort((a, b) => a.avgPrice - b.avgPrice)
    if (sort === 'rating') return d.sort((a, b) => b.rating - a.rating)
    if (sort === 'distance') return d.sort((a, b) => a.distance - b.distance)
    return d
  }

  const displayFood = sortFood(foodData, foodSort)
  const displayStay = sortStay(stayData, staySort)

  const stars = (n) => '⭐'.repeat(Math.round(n))

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>食宿推荐<span>🍜</span></h1>
        <p className={styles.subtitle}>基于大数据推荐</p>
      </div>

      <div className={styles.cityRow}>
        <select className={styles.citySelect} value={cityId} onChange={e => setCityId(e.target.value)}>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name} · {c.province}</option>)}
        </select>
      </div>

      <div className={styles.tabSwitch}>
        <button className={`${styles.tabBtn} ${activeTab === 'food' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('food')}>🍜 美食</button>
        <button className={`${styles.tabBtn} ${activeTab === 'stay' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('stay')}>🏨 住宿</button>
      </div>

      {!city && <div className={styles.empty}><p>请在上方选择一个城市查看食宿推荐</p></div>}

      {city && activeTab === 'food' && (
        <div>
          <div className={styles.sortRow}>
            {['default','price-asc','rating','distance'].map(s => (
              <button key={s} className={`${styles.sortBtn} ${foodSort === s ? styles.sortActive : ''}`}
                onClick={() => setFoodSort(s)}>
                {s === 'default' ? '🏆 综合' : s === 'price-asc' ? '💰 低价' : s === 'rating' ? '⭐ 评分' : '📍 距离'}
              </button>
            ))}
          </div>
          <div className={styles.cardList}>
            {displayFood.map(item => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardIcon}>{item.category.includes('海鲜') ? '🦐' : item.category.includes('火锅') ? '🫕' : item.category.includes('小吃') ? '🥟' : '🍜'}</div>
                <div className={styles.cardBody}>
                  <div className={styles.cardName}>{item.name}</div>
                  <div className={styles.cardCat}>{item.category}</div>
                  <div className={styles.cardRating}>{stars(item.rating)} {item.rating} · ¥{item.avgPrice}/人</div>
                  <div className={styles.cardTags}>
                    {item.tags.map((t, i) => <span key={i} className={styles.cardTag}>{t}</span>)}
                    <span className={styles.cardDist}>{item.distance}km</span>
                    <span className={styles.cardCrowd}>{item.crowdStatus === '火爆' ? '🔥 火爆' : item.crowdStatus === '正常' ? '🟢 正常' : '🟡 较空'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {city && activeTab === 'stay' && (
        <div>
          <div className={styles.sortRow}>
            {['default','price-asc','rating','distance'].map(s => (
              <button key={s} className={`${styles.sortBtn} ${staySort === s ? styles.sortActive : ''}`}
                onClick={() => setStaySort(s)}>
                {s === 'default' ? '🏆 综合' : s === 'price-asc' ? '💰 低价' : s === 'rating' ? '⭐ 评分' : '📍 距离'}
              </button>
            ))}
          </div>
          <div className={styles.cardList}>
            {displayStay.map(item => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardIcon}>{item.category === '豪华' ? '🏨' : item.category === '中端' ? '🏠' : item.category === '经济' ? '🏢' : '🛏️'}</div>
                <div className={styles.cardBody}>
                  <div className={styles.cardName}>{item.name}<span className={styles.stars}>{item.stars}</span></div>
                  <div className={styles.cardCat}>{item.category} · {item.distance}km</div>
                  <div className={styles.cardRating}>{stars(item.rating)} {item.rating} · ¥{item.avgPrice}/晚</div>
                  <div className={styles.cardTags}>
                    {item.tags.map((t, i) => <span key={i} className={styles.cardTag}>{t}</span>)}
                    <span className={styles.cardRec}>👍 {item.recommendRate}%推荐</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
