import { useState, useEffect } from 'react'
import { getAllCities } from '../utils/storage'
import { useApp } from '../store/AppContext'
import { generateBuddies, matchBuddies, getRandomTip } from '../engine/buddyEngine'
import styles from './BuddyPage.module.css'

const TRAVEL_STYLES = ['all', '穷游模式', '舒适享受', '冒险探索', '文化深度', '美食之旅', '摄影打卡', '慢节奏休养']
const BUDGETS = ['all', 'low', 'mid', 'high']
const BUDGET_LABELS = { all: '不限制', low: '¥2000以下', mid: '¥2000-4000', high: '¥5000+' }

export default function BuddyPage() {
  const { state, dispatch } = useApp()
  const [cities, setCities] = useState([])
  const [selectedCityId, setSelectedCityId] = useState(state.selectedCity?.id || '')
  const [buddies, setBuddies] = useState([])
  const [filteredBuddies, setFilteredBuddies] = useState([])
  const [styleFilter, setStyleFilter] = useState('all')
  const [budgetFilter, setBudgetFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [tip] = useState(getRandomTip)
  const [expandedBuddy, setExpandedBuddy] = useState(null)

  useEffect(() => { getAllCities().then(setCities) }, [])

  useEffect(() => {
    if (!selectedCityId) return
    setLoading(true)
    setTimeout(() => {
      const data = generateBuddies(selectedCityId)
      setBuddies(data)
      setFilteredBuddies(matchBuddies(data, { style: styleFilter, budget: budgetFilter }))
      setLoading(false)
    }, 300)
  }, [selectedCityId])

  useEffect(() => {
    if (buddies.length === 0) return
    setFilteredBuddies(matchBuddies(buddies, { style: styleFilter, budget: budgetFilter }))
  }, [styleFilter, budgetFilter, buddies])

  const cityName = cities.find(c => c.id === selectedCityId)?.name || '选择城市'
  const activeCount = (styleFilter !== 'all' ? 1 : 0) + (budgetFilter !== 'all' ? 1 : 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>找搭子<span>🤝</span></h1>
        <p className={styles.subtitle}>找到志同道合的旅行伙伴，一起出发</p>
      </div>

      <div className={styles.tipBox}>{tip}</div>

      <div className={styles.selectRow}>
        <select className={styles.select} value={selectedCityId} onChange={e => setSelectedCityId(e.target.value)}>
          <option value="">选择目的地城市</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className={styles.count}>{filteredBuddies.length} 位旅伴</span>
      </div>

      {activeCount > 0 && (
        <div className={styles.filterRow}>
          <select className={styles.filterSelect} value={styleFilter} onChange={e => setStyleFilter(e.target.value)}>
            <option value="all">旅行风格: 不限</option>
            {TRAVEL_STYLES.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className={styles.filterSelect} value={budgetFilter} onChange={e => setBudgetFilter(e.target.value)}>
            {BUDGETS.map(b => <option key={b} value={b}>预算: {BUDGET_LABELS[b]}</option>)}
          </select>
        </div>
      )}

      {!selectedCityId ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyEmoji}>🤝</div>
          <p>选择一个目的地，看看谁也想一起去</p>
          <p className={styles.emptyHint}>热门目的地：成都、丽江、厦门、大理</p>
        </div>
      ) : loading ? (
        <div className={styles.skeletonWrap}>
          {[1,2,3].map(i => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : (
        <div className={styles.buddyList}>
          {filteredBuddies.map(buddy => (
            <div key={buddy.id} className={`${styles.buddyCard} ${expandedBuddy === buddy.id ? styles.expanded : ''}`}
              onClick={() => setExpandedBuddy(expandedBuddy === buddy.id ? null : buddy.id)}>
              <div className={styles.buddyTop}>
                <div className={styles.avatar}>{buddy.emoji}</div>
                <div className={styles.buddyInfo}>
                  <div className={styles.buddyName}>
                    {buddy.name}
                    <span className={styles.gender}>{buddy.gender}</span>
                    <span className={styles.age}>{buddy.age}岁</span>
                  </div>
                  <div className={styles.buddyStyle}>🎒 {buddy.travelStyle}</div>
                  <div className={styles.buddyDate}>📅 {buddy.departDate} - {buddy.returnDate}</div>
                </div>
                <div className={styles.matchCol}>
                  <div className={styles.matchCircle} style={{ '--pct': buddy.matchRate }}>
                    <span className={styles.matchNum}>{buddy.matchRate}%</span>
                  </div>
                  <span className={styles.matchLabel}>匹配</span>
                </div>
              </div>

              {expandedBuddy === buddy.id && (
                <div className={styles.buddyDetail}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>旅行风格</span>
                    <span>{buddy.travelStyle}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>预算</span>
                    <span>{buddy.budget}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>出行人数</span>
                    <span>{buddy.groupSize} 人</span>
                  </div>
                  <div className={styles.interestRow}>
                    <span className={styles.detailLabel}>兴趣爱好</span>
                    <div className={styles.interestTags}>
                      {buddy.interests.map((int, i) => (
                        <span key={i} className={styles.interestTag}>{int}</span>
                      ))}
                    </div>
                  </div>
                  <button className={styles.connectBtn} onClick={e => { e.stopPropagation(); alert(`已向 ${buddy.name} 发出搭子邀请！(模拟)`) }}>
                    💬 约他/她一起
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
