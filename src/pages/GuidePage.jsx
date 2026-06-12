import { useState, useEffect, useMemo, useRef } from 'react'
import { getAllCities } from '../utils/storage'
import { useApp } from '../store/AppContext'
import { generateGuide } from '../engine/guideEngine'
import styles from './GuidePage.module.css'

export default function GuidePage() {
  const { state, dispatch } = useApp()
  const [allCities, setAllCities] = useState([])
  const [query, setQuery] = useState('')
  const [dropdown, setDropdown] = useState(false)
  const [guideHtml, setGuideHtml] = useState('')
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [downloadMsg, setDownloadMsg] = useState('')
  const searchRef = useRef(null)
  const editAreaRef = useRef(null)
  const msgTimerRef = useRef(null)

  useEffect(() => {
    getAllCities().then(all => setAllCities(all))
  }, [])

  useEffect(() => {
    if (!dropdown) return
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdown])

  useEffect(() => {
    return () => { if (msgTimerRef.current) clearTimeout(msgTimerRef.current) }
  }, [])

  const tripCities = state.tripCities || []

  const searchResults = useMemo(() => {
    const list = query.trim()
      ? allCities.filter(c => c.name.includes(query) || c.province.includes(query))
      : allCities.slice(0, 12)
    return list.filter(c => !tripCities.some(t => t.id === c.id)).slice(0, 8)
  }, [query, allCities, tripCities])

  const addCity = (city) => {
    dispatch({ type: 'ADD_TRIP_CITY', payload: city })
    setQuery('')
    setDropdown(false)
  }

  const removeCity = (cityId) => {
    dispatch({ type: 'REMOVE_TRIP_CITY', payload: cityId })
  }

  const getEditedContent = () => {
    if (editing && editAreaRef.current) {
      return editAreaRef.current.innerHTML
    }
    return guideHtml
  }

  const doGenerate = () => {
    if (tripCities.length === 0) { alert('请先在搜索框中添加至少一个城市'); return }
    const result = generateGuide(tripCities, state.tripRoutes || [])
    setGuideHtml(result.html)
    setEditText(result.text)
    setEditing(false)
  }

  const toggleEdit = () => {
    if (!editing) {
      setEditText(guideHtml)
    } else {
      const edited = editAreaRef.current ? editAreaRef.current.innerHTML : editText
      setGuideHtml(edited)
    }
    setEditing(!editing)
  }

  const showMsg = (text) => {
    setDownloadMsg(text)
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    msgTimerRef.current = setTimeout(() => setDownloadMsg(''), 3000)
  }

  const doDownload = () => {
    const content = getEditedContent()
    if (!content) return
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '旅行攻略_' + new Date().toISOString().slice(0, 10) + (editing ? '.txt' : '.html')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showMsg('✅ 已下载到浏览器默认下载目录（通常是"下载"文件夹）')
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>📖 旅行攻略<span>📝</span></h1>
        <p className={styles.subtitle}>选择城市，一键生成专属攻略</p>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchWrap} ref={searchRef}>
          <span className={styles.searchIcon}>🔍</span>
          <input className={styles.searchInput} placeholder="搜索城市添加到攻略..."
            value={query}
            onChange={e => { setQuery(e.target.value); setDropdown(true) }}
            onFocus={() => setDropdown(true)} />
          {dropdown && searchResults.length > 0 && (
            <div className={styles.dropdown}>
              {searchResults.map(c => (
                <div key={c.id} className={styles.dropItem} onMouseDown={() => addCity(c)}>
                  <span className={styles.dropName}>{c.name}</span>
                  <span className={styles.dropProvince}>{c.province}</span>
                  <span className={styles.dropAdd}>＋ 添加</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {tripCities.length > 0 && (
        <div className={styles.cityRow}>
          {tripCities.map(c => (
            <span key={c.id} className={styles.cityChip}>
              {c.name}
              <button className={styles.chipDel} onClick={() => removeCity(c.id)}>✕</button>
            </span>
          ))}
          <button className={styles.clearBtn} onClick={() => {
            if (window.confirm('确定清空所有城市和路线吗？')) {
              dispatch({ type: 'CLEAR_TRIP' })
              setGuideHtml('')
              setEditText('')
            }
          }}>清空</button>
        </div>
      )}

      {tripCities.length > 0 && (
        <button className={styles.genBtn} onClick={doGenerate}>✨ 一键生成攻略</button>
      )}

      {guideHtml && (
        <div className={styles.guideSection}>
          <div className={styles.guideHeader}>
            <h3>📑 你的旅行攻略</h3>
            <div className={styles.guideActions}>
              <button className={styles.editBtn} onClick={toggleEdit}>
                {editing ? '👁 预览' : '✏️ 编辑'}
              </button>
              <button className={styles.dlBtn} onClick={doDownload}>💾 下载</button>
            </div>
          </div>
          {editing ? (
            <div className={styles.editArea} ref={editAreaRef} contentEditable={true}
              suppressContentEditableWarning={true}
              dangerouslySetInnerHTML={{ __html: editText }} />
          ) : (
            <div className={styles.preview} dangerouslySetInnerHTML={{ __html: guideHtml }} />
          )}
          {downloadMsg && <div className={styles.dlMsg}>{downloadMsg}</div>}
        </div>
      )}

      {tripCities.length === 0 && !guideHtml && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📖</div>
          <p>在上方搜索并添加城市</p>
          <p className={styles.emptyHint}>支持多个城市，自动生成完整行程攻略</p>
        </div>
      )}
    </div>
  )
}
