import { useEffect, useState } from 'react'
import styles from './SplashScreen.module.css'

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(onFinish, 400)
    }, 2500)
    return () => clearTimeout(timer)
  }, [onFinish])

  const handleTap = () => {
    if (!fadeOut) {
      setFadeOut(true)
      setTimeout(onFinish, 400)
    }
  }

  return (
    <div className={`${styles.overlay} ${fadeOut ? styles.hide : ''}`} onClick={handleTap}>
      <div className={styles.content}>
        <div className={styles.globe}>🌍</div>
        <h1 className={styles.title}>旅伴</h1>
        <p className={styles.tagline}>基于大数据</p>
        <p className={styles.tagline2}>避开人潮，聪明旅行</p>
        <div className={styles.spinner} />
        <p className={styles.hint}>点击任意处跳过</p>
      </div>
    </div>
  )
}
