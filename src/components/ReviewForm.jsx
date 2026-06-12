import React from 'react'
import { useState } from 'react'
import styles from './ReviewForm.module.css'

var QUICK_TAGS = ['👍 推荐', '🎨 好看', '🍲 好吃', '💰 实惠', '🏘 风景好', '🚇 交通方便', '🏨 住宿舒适']

export default function ReviewForm({ cityId, onSubmit }) {
  var _r = useState(0), rating = _r[0], setRating = _r[1];
  var _t = useState(''), text = _t[0], setText = _t[1];
  var _g = useState([]), tags = _g[0], setTags = _g[1];
  var _s = useState(false), submitting = _s[0], setSubmitting = _s[1];

  var toggleTag = function(tag) {
    setTags(function(prev) { return prev.includes(tag) ? prev.filter(function(t) { return t !== tag }) : prev.concat([tag]) })
  }

  var handleSubmit = function() {
    if (!rating || !text.trim()) return
    setSubmitting(true)
    onSubmit({ cityId: cityId, rating: rating, text: text.trim(), tags: tags }).then(function() {
      setRating(0); setText(''); setTags([]); setSubmitting(false)
    })
  }

  return (
    React.createElement('div', { className: styles.form },
      React.createElement('div', { className: styles.formTitle }, '✍️ 写下你的评价'),
      React.createElement('div', { className: styles.stars },
        [1,2,3,4,5].map(function(n) {
          return React.createElement('button', {
            key: n,
            className: styles.starBtn + ' ' + (n <= rating ? styles.starActive : styles.starInactive),
            onClick: function() { setRating(n) }
          }, '⭐')
        })
      ),
      React.createElement('textarea', { className: styles.textarea, placeholder: '分享你的体验，帮助其他旅行者...', value: text, onChange: function(e) { setText(e.target.value) } }),
      React.createElement('div', { className: styles.tagRow },
        QUICK_TAGS.map(function(tag) {
          return React.createElement('button', {
            key: tag,
            className: styles.quickTag + ' ' + (tags.includes(tag) ? styles.quickTagActive : ''),
            onClick: function() { toggleTag(tag) }
          }, tag)
        })
      ),
      React.createElement('button', { className: styles.submitBtn, onClick: handleSubmit, disabled: !rating || !text.trim() || submitting }, submitting ? '提交中...' : '发布评价')
    )
  )
}