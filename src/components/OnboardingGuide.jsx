import { useState, useRef } from 'react'
import styles from './OnboardingGuide.module.css'

const slides = [
  {
    emoji: '🔍', title: '搜索目的地',
    desc: '输入城市名或关键词\n实时弹出联想匹配\n城市人流信息一目了然',
    gradient: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', color: '#4fc3f7',
  },
  {
    emoji: '📊', title: '人流预测日历',
    desc: '提前两周预测城市人流\n绿色=少 🟢  橙色=中 🟡  红色=多 🔴\n选择最佳出行日期',
    gradient: 'linear-gradient(135deg, #fce4ec, #f8bbd0)', color: '#f06292',
  },
  {
    emoji: '🎯', title: '智能推荐',
    desc: '多条件叠加筛选\n人少 / 便宜 / 美食 / 类型 / 月份\n找到最适合你的旅行地',
    gradient: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', color: '#4caf50',
  },
  {
    emoji: '🤝', title: '找搭子一起出发',
    desc: '找到目的地相同的旅行伙伴\n匹配旅行风格和兴趣\n让旅途不再孤单',
    gradient: 'linear-gradient(135deg, #f3e5f5, #e1bee7)', color: '#ce93d8',
  },
]

export default function OnboardingGuide({ onFinish }) {
  const [current, setCurrent] = useState(0)
  const startX = useRef(0)

  const handleTouchStart = (e) => { startX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    const diff = startX.current - e.changedTouches[0].clientX
    if (diff > 60 && current < slides.length - 1) setCurrent(current + 1)
    if (diff < -60 && current > 0) setCurrent(current - 1)
  }

  const isLast = current === slides.length - 1
  const s = slides[current]

  return (
    <div className={styles.overlay}>
      <div className={styles.container} style={{ background: s.gradient }}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        
        <div className={styles.slide}>
          <div className={styles.emoji}>{s.emoji}</div>
          <h2 className={styles.title}>{s.title}</h2>
          <p className={styles.desc}>{s.desc}</p>

          {isLast && (
            <button className={styles.startBtn} onClick={onFinish}>
              ✨ 开始使用
            </button>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.skip} onClick={onFinish}>跳过</span>
          <div className={styles.dots}>
            {slides.map((_, i) => (
              <span key={i} className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                style={i === current ? { background: s.color } : {}} />
            ))}
          </div>
          {!isLast ? (
            <span className={styles.next} onClick={() => setCurrent(current + 1)}>
              下一步 →
            </span>
          ) : (
            <span style={{ width: 60 }} />
          )}
        </div>
      </div>
    </div>
  )
}
