import React from 'react'
import styles from './ReviewCard.module.css'

export default function ReviewCard({ review }) {
  const d = new Date(review.timestamp)
  const date = d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate()
  return (
    React.createElement('div', { className: styles.card },
      React.createElement('div', { className: styles.header },
        React.createElement('span', { className: styles.rating }, '⭐ ' + review.rating + '/5'),
        React.createElement('span', { className: styles.date }, date)
      ),
      React.createElement('p', { className: styles.text }, review.text),
      React.createElement('div', { className: styles.tags },
        (review.tags || []).map(function(t, i) {
          return React.createElement('span', { key: i, className: styles.tag }, t)
        })
      )
    )
  )
}