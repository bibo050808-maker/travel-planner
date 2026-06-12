import { useEffect, useRef } from 'react'
import styles from './KeywordPopup.module.css'

export default function KeywordPopup({ show, suggestions, onSelect, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!show) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [show, onClose])

  if (!show) return null

  const iconMap = { city: '🏙️', attraction: '🏛️', tag: '🏷️' }

  return (
    <div className={styles.popup} ref={ref}>
      {suggestions.map((s, i) => (
        <div key={i} className={styles.item} onMouseDown={() => onSelect(s)}>
          <span className={styles.icon}>{iconMap[s.type]}</span>
          <span className={styles.text}>{s.text}</span>
          <span className={styles.sub}>{s.sub}</span>
        </div>
      ))}
    </div>
  )
}
