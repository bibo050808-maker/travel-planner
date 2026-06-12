import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import styles from './CityCard.module.css'

export default function CityCard({ city, flow }) {
  const navigate = useNavigate()
  const level = flow?.crowdLevel || 1
  const label = flow?.crowdLabel || '数据加载中'
  const color = flow?.crowdColor || 'low'

  const regionIcons = { '华北': '🏛️', '华东': '🌊', '华南': '🏖️', '西南': '⛰️', '西北': '🏜️', '华中': '🏘️', '东北': '❄️' }

  return (
    <div className={styles.card} onClick={() => navigate(`/city/${city.id}`)}>
      <div className={styles.icon}>{regionIcons[city.region] || '🏙️'}</div>
      <div className={styles.info}>
        <div className={styles.name}>{city.name}</div>
        <div className={styles.sub}>{city.province} · {city.attractions.slice(0, 2).join(' · ')}</div>
      </div>
      <span className={`${styles.badge} ${styles[color]}`}>{label}</span>
    </div>
  )
}
