import { useState, useEffect, useMemo, useRef } from 'react'
import { createElement as h } from 'react'
import { getAllCities } from '../utils/storage'
import { useApp } from '../store/AppContext'
import { generateGuide } from '../engine/guideEngine'
import styles from './GuidePage.module.css'

export default function GuidePage() {
  var _s = useApp(), state = _s.state, dispatch = _s.dispatch;
  var _c = useState([]), allCities = _c[0], setAllCities = _c[1];
  var _q = useState(''), query = _q[0], setQuery = _q[1];
  var _o = useState(false), dropdown = _o[0], setDropdown = _o[1];
  var _g = useState(''), guideHtml = _g[0], setGuideHtml = _g[1];
  var _e = useState(false), editing = _e[0], setEditing = _e[1];
  var _t = useState(''), editText = _t[0], setEditText = _t[1];
  var _d = useState(''), downloadMsg = _d[0], setDownloadMsg = _d[1];
  var ref = useRef(null);

  useEffect(function() {
    getAllCities().then(function(all) { setAllCities(all) });
  }, []);

  // Close dropdown on outside click
  useEffect(function() {
    if (!dropdown) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setDropdown(false); }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, [dropdown]);

  var tripCities = state.tripCities || [];

  var searchResults = useMemo(function() {
    if (!query.trim()) return allCities.slice(0, 8);
    var q = query.toLowerCase();
    return allCities.filter(function(c) {
      return (c.name.includes(q) || c.province.includes(q)) && !tripCities.find(function(t) { return t.id === c.id; });
    }).slice(0, 8);
  }, [query, allCities, tripCities]);

  var addCity = function(city) {
    dispatch({ type: 'ADD_TRIP_CITY', payload: city });
    setQuery(''); setDropdown(false);
  };

  var removeCity = function(cityId) {
    dispatch({ type: 'REMOVE_TRIP_CITY', payload: cityId });
  };

  var doGenerate = function() {
    if (tripCities.length === 0) return;
    var result = generateGuide(tripCities, state.tripRoutes || []);
    setGuideHtml(result.html);
    setEditText(result.text);
    setEditing(false);
  };

  var toggleEdit = function() {
    if (!editing) { setEditText(guideHtml); }
    setEditing(!editing);
  };

  var doDownload = function() {
    var content = guideHtml;
    if (!content) return;
    var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '旅行攻略_' + new Date().toISOString().slice(0,10) + (editing ? '.txt' : '.html');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadMsg('✅ 已下载到浏览器默认下载目录（通常是“下载”文件夹）');
  };

  // --- Render ---
  return h('div', { className: styles.page },
    h('div', { className: styles.header },
      h('h1', { className: styles.title }, '📖 旅行攻略', h('span', null, '🌍')),
      h('p', { className: styles.subtitle }, '选择城市，一键生成专属攻略')
    ),

    // City selector
    h('div', { className: styles.searchSection },
      h('div', { className: styles.searchWrap, ref: ref },
        h('span', { className: styles.searchIcon }, '🔍'),
        h('input', {
          className: styles.searchInput,
          placeholder: '搜索城市添加到攻略...',
          value: query,
          onChange: function(e) { setQuery(e.target.value); setDropdown(true); },
          onFocus: function() { setDropdown(true); }
        }),
        dropdown && searchResults.length > 0 && h('div', { className: styles.dropdown },
          searchResults.map(function(c) {
            return h('div', { key: c.id, className: styles.dropItem, onMouseDown: function() { addCity(c); } },
              h('span', { className: styles.dropName }, c.name),
              h('span', { className: styles.dropProvince }, c.province),
              h('span', { className: styles.dropAdd }, '➕ 添加')
            );
          })
        )
      )
    ),

    // Selected cities
    tripCities.length > 0 && h('div', { className: styles.cityRow },
      tripCities.map(function(c) {
        return h('span', { key: c.id, className: styles.cityChip },
          c.name,
          h('button', { className: styles.chipDel, onClick: function() { removeCity(c.id); } }, '✕')
        );
      }),
      h('button', { className: styles.clearBtn, onClick: function() { if (window.confirm('\u786E\u5B9A\u6E05\u7A7A\u6240\u6709\u57CE\u5E02\u548C\u8DEF\u7EBF\u5417\uFF1F')) { dispatch({ type: 'CLEAR_TRIP' }); setGuideHtml(''); setEditText(''); } } }, '清空')
    ),

    // Generate button
    tripCities.length > 0 && h('button', { className: styles.genBtn, onClick: doGenerate }, '✨ 一键生成攻略'),

    // Guide output area
    guideHtml && h('div', { className: styles.guideSection },
      h('div', { className: styles.guideHeader },
        h('h3', null, '📝 你的旅行攻略'),
        h('div', { className: styles.guideActions },
          h('button', { className: styles.editBtn, onClick: toggleEdit }, editing ? '👁 预览' : '✏️ 编辑'),
          h('button', { className: styles.dlBtn, onClick: doDownload }, '💾 下载')
        )
      ),
      editing ?
        h('div', { className: styles.editArea, contentEditable: true, suppressContentEditableWarning: true, onInput: function(e) { setEditText(e.currentTarget.innerHTML); }, dangerouslySetInnerHTML: { __html: editText } }) :
        h('div', { className: styles.preview, dangerouslySetInnerHTML: { __html: guideHtml } }),
      downloadMsg && h('div', { className: styles.dlMsg }, downloadMsg)
    ),

    // Empty state
    tripCities.length === 0 && !guideHtml && h('div', { className: styles.empty },
      h('div', { className: styles.emptyIcon }, '📖'),
      h('p', null, '在上方搜索并添加城市'),
      h('p', { className: styles.emptyHint }, '支持多个城市，自动生成完整行程攻略')
    )
  );
}