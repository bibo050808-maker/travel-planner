import { useState, useEffect } from 'react'
import { createElement as h } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllCities } from '../utils/storage'
import { useApp } from '../store/AppContext'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  var _app = useApp(), state = _app.state, dispatch = _app.dispatch;
  var _c = useState([]), allCities = _c[0], setAllCities = _c[1];
  var _r = useState([]), reviews = _r[0], setReviews = _r[1];
  var navigate = useNavigate();

  useEffect(function() {
    getAllCities().then(function(all) { setAllCities(all); });
    var dbp = indexedDB.open('travel-planner', 4);
    dbp.onsuccess = function(e) {
      try {
        var tx = e.target.result.transaction('reviews', 'readonly');
        var req = tx.objectStore('reviews').getAll();
        req.onsuccess = function() { setReviews(req.result || []); };
      } catch(err) {}
    };
  }, []);

  var favs = state.favorites || [];
  var favCities = allCities.filter(function(c) { return favs.indexOf(c.id) > -1; });
  var tripCities = state.tripCities || [];
  var goToCity = function(id) { navigate('/city/' + id); };

  return h('div', { className: styles.page },
    h('div', { className: styles.header },
      h('div', { className: styles.avatar }, h('div', { className: styles.avatarIcon }, '\uD83D\uDC65')),
      h('div', { className: styles.headerInfo },
        h('h1', { className: styles.title }, '\u6211\u7684'),
        h('p', { className: styles.subtitle }, '\u6536\u85CF\u00B7\u8BC4\u4EF7\u00B7\u65C5\u884C\u7EAA\u5F55')
      )
    ),
    h('div', { className: styles.statsRow },
      h('div', { className: styles.statCard }, h('div', { className: styles.statNum }, favCities.length), h('div', { className: styles.statLabel }, '\u6536\u85CF\u57CE\u5E02')),
      h('div', { className: styles.statCard }, h('div', { className: styles.statNum }, reviews.length), h('div', { className: styles.statLabel }, '\u6211\u7684\u8BC4\u4EF7')),
      h('div', { className: styles.statCard }, h('div', { className: styles.statNum }, tripCities.length), h('div', { className: styles.statLabel }, '\u653B\u7565\u57CE\u5E02'))
    ),
    h('div', { className: styles.section },
      h('h3', { className: styles.sectionTitle }, '\u2B50 \u6536\u85CF\u57CE\u5E02'),
      favCities.length === 0 && h('p', { className: styles.empty }, '\u8FD8\u6CA1\u6709\u6536\u85CF\u57CE\u5E02\uFF0C\u53BB\u641C\u7D22\u9875\u767E\u5EA6\u4E00\u4E0B\u5427'),
      favCities.map(function(c) {
        return h('div', { key: c.id, className: styles.favItem, onClick: function() { goToCity(c.id); } },
          h('span', { className: styles.favIcon }, c.tags.indexOf('\u6D77\u6EE8') > -1 ? '\uD83C\uDF0A' : c.tags.indexOf('\u7F8E\u98DF') > -1 ? '\uD83C\uDF5C' : '\uD83C\uDFDB\uFE0F'),
          h('span', { className: styles.favName }, c.name),
          h('span', { className: styles.favProvince }, c.province),
          h('span', { className: styles.favArrow }, '\u276F')
        );
      })
    ),
    h('div', { className: styles.section },
      h('h3', { className: styles.sectionTitle }, '\uD83D\uDCDD \u6211\u7684\u8BC4\u4EF7'),
      reviews.length === 0 && h('p', { className: styles.empty }, '\u8FD8\u6CA1\u6709\u8BC4\u4EF7\u57CE\u5E02'),
      reviews.slice(0, 5).map(function(r) {
        var city = allCities.find(function(c) { return c.id === r.cityId; });
        var d = new Date(r.timestamp);
        var dateStr = d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate();
        var cityName = city ? city.name : '\u672A\u77E5';
        return h('div', { key: r.id, className: styles.reviewItem, onClick: function() { if (city) goToCity(city.id); } },
          h('div', { className: styles.reviewHeader }, cityName + ' \u00B7 ' + '\u2B50 '.repeat(r.rating), h('span', { className: styles.reviewDate }, dateStr)),
          h('div', { className: styles.reviewText }, (r.text || '').substring(0, 60) + ((r.text||'').length > 60 ? '...' : ''))
        );
      })
    )
  );
}