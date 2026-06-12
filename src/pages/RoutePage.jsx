import { useState, useEffect, useMemo, useRef, createElement as h } from 'react'
import { getAllCities } from '../utils/storage'
import { searchRoutes } from '../engine/routeEngine'
import styles from './RoutePage.module.css'
import { useApp } from '../store/AppContext'
import { getRandomTip } from '../engine/buddyEngine'

function CitySearchInput({ cities, value, onChange, placeholder, excludeId }) {
  var _q = useState(''), query = _q[0], setQuery = _q[1];
  var _o = useState(false), open = _o[0], setOpen = _o[1];
  var ref = useRef(null);

  var selectedCity = cities.find((c) => { return c.id === value; });

  useEffect(() => {
    if (!open) return;
    var handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => { document.removeEventListener('mousedown', handleClick); };
  }, [open]);

  var results = useMemo(() => {
    if (!query.trim()) return cities.filter((c) => { return c.id !== excludeId; }).slice(0, 8);
    var q = query.toLowerCase();
    return cities.filter((c) => {
      return c.id !== excludeId && (c.name.includes(q) || c.province.includes(q) || c.tags.some(function(t) { return t.includes(q); }));
    }).slice(0, 8);
  }, [query, cities, excludeId]);

  var handleSelect = (city) => {
    onChange(city.id);
    setQuery(city.name);
    setOpen(false);
  };

  var handleClear = () => {
    onChange('');
    setQuery('');
  };

  return h('div', { className: styles.searchWrap, ref: ref },
    h('span', { className: styles.searchIcon }, '\uD83D\uDD0D'),
    h('input', {
      className: styles.searchInput,
      placeholder: placeholder,
      value: query,
      onChange: (e) => { setQuery(e.target.value); setOpen(true); },
      onFocus: () => { setOpen(true); }
    }),
    value && h('button', { className: styles.clearBtn2, onClick: handleClear }, '\u2715'),
    open && h('div', { className: styles.dropdown },
      results.map((c) => {
        return h('div', {
          key: c.id,
          className: styles.dropItem + ' ' + (c.id === value ? styles.dropActive : ''),
          onMouseDown: () => { handleSelect(c); }
        },
          h('span', { className: styles.dropName }, c.name),
          h('span', { className: styles.dropProvince }, c.province),
          h('span', { className: styles.dropTags }, (c.tags || []).slice(0, 2).join(' \u00B7 '))
        );
      }),
      results.length === 0 && h('div', { className: styles.dropEmpty }, '\u672A\u627E\u5230\u5339\u914D\u57CE\u5E02')
    )
  );
}

export default function RoutePage() {
  var _app = useApp(), dispatch = _app.dispatch;
  var _c = useState([]), cities = _c[0], setCities = _c[1];
  var _f = useState(''), fromId = _f[0], setFromId = _f[1];
  var _t = useState(''), toId = _t[0], setToId = _t[1];
  var _m = useState('comfort'), mode = _m[0], setMode = _m[1];
  var _tip = useState(getRandomTip), tip = _tip[0];
  var _r = useState(null), routes = _r[0], setRoutes = _r[1];
  var _l = useState(false), loading = _l[0], setLoading = _l[1];

  useEffect(() => {
    getAllCities().then(setCities);
  }, []);

  var swapCities = () => {
    setFromId(toId); setToId(fromId);
  };

  var doSearch = () => {
    if (!fromId || !toId) return;
    setLoading(true);
    setTimeout(() => {
      var result = searchRoutes(fromId, toId, mode);
      setRoutes(result);
      var fc = cities.find((c) => { return c.id === fromId; });
      var tc = cities.find((c) => { return c.id === toId; });
      if (fc && tc) {
        dispatch({ type: 'ADD_TRIP_ROUTE', payload: { fromId: fromId, toId: toId, fromName: fc.name, toName: tc.name, mode: mode } });
      dispatch({ type: 'ADD_TRIP_CITY', payload: fc });
      dispatch({ type: 'ADD_TRIP_CITY', payload: tc });
      }
      setLoading(false);
    }, 300);
  };

  var displayRoutes = routes ? (mode === 'comfort' ? routes.comfort : routes.budget) : [];

  var formatDur = function(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h > 0 ? h + 'h' + (m > 0 ? m + 'min' : '') : m + 'min';
  };

  var fromName = cities.find((c) => { return c.id === fromId; });
  var toName = cities.find((c) => { return c.id === toId; });
  var fromLabel = fromName ? fromName.name : '\u9009\u62E9';
  var toLabel = toName ? toName.name : '\u9009\u62E9';

  return h('div', { className: styles.page },
    h('div', { className: styles.header },
      h('h1', { className: styles.title }, '\u8DEF\u7EBF\u89C4\u5212',
        h('span', null, '\uD83D\uDDFA\uFE0F')
      ),
      h('p', { className: styles.subtitle }, '\u8212\u9002\u51FA\u884C\u8FD8\u662F\u7CBE\u6253\u7EC6\u7B97\uFF0C\u4EFB\u4F60\u9009\u62E9'),
      h('div', { className: styles.tipBox }, tip)
    ),

    h('div', { className: styles.inputRow },
      h(CitySearchInput, { cities: cities, value: fromId, onChange: setFromId, placeholder: '\u641C\u7D22\u51FA\u53D1\u57CE\u5E02...', excludeId: toId }),
      h('button', { className: styles.swapBtn, onClick: swapCities, title: '\u4EA4\u6362' }, '\uD83D\uDD04'),
      h(CitySearchInput, { cities: cities, value: toId, onChange: setToId, placeholder: '\u641C\u7D22\u5230\u8FBE\u57CE\u5E02...', excludeId: fromId })
    ),

    h('div', { className: styles.modeSwitch },
      h('button', { className: styles.modeBtn + ' ' + (mode === 'comfort' ? styles.modeActive : ''), onClick: () => { setMode('comfort'); } }, '\uD83D\uDECB\uFE0F \u8212\u9002\u6A21\u5F0F'),
      h('button', { className: styles.modeBtn + ' ' + (mode === 'budget' ? styles.modeActive : ''), onClick: () => { setMode('budget'); } }, '\uD83D\uDCB0 \u7701\u94B1\u6A21\u5F0F')
    ),

    h('button', { className: styles.searchBtn, onClick: doSearch, disabled: !fromId || !toId }, '\uD83D\uDD0D \u67E5\u8BE2\u8DEF\u7EBF'),

    routes && routes.tip && h('div', { className: styles.tip }, routes.tip),

    loading && h('div', { className: styles.loading }, '\u641C\u7D22\u4E2D...'),

    displayRoutes.length > 0 && h('div', { className: styles.routeList },
      displayRoutes.map(function(route, idx) {
        return h('div', { key: route.id, className: styles.routeCard },
          h('div', { className: styles.routeHeader },
            h('span', { className: styles.routeIcon }, route.icon),
            h('span', { className: styles.routeName }, route.type),
            idx === 0 && h('span', { className: styles.bestTag }, mode === 'comfort' ? '\u63A8\u8350\u8DEF\u7EBF' : '\u6700\u7701\u94B1'),
            route.savings > 0 && h('span', { className: styles.savings }, '\u7701 \u00A5' + route.savings)
          ),
          h('div', { className: styles.routePath },
            h('span', null, fromLabel),
            h('span', { className: styles.arrow }, '\u2192'),
            h('span', { className: styles.routeMid }, route.segments.map(function(s) { return s.seatClass; }).join('+')),
            h('span', { className: styles.arrow }, '\u2192'),
            h('span', null, toLabel)
          ),
          h('div', { className: styles.routeMeta },
            h('span', null, '\u23F1 ' + formatDur(route.totalDuration)),
            h('span', null, '\uD83D\uDCB0 \u00A5' + route.totalPrice + '/\u4EBA'),
            h('span', null, '\uD83D\uDCBA ' + route.bestSeatClass),
            h('span', null, '\u2B50 \u8212\u9002\u5EA6 ' + route.comfortScore + '/10')
          )
        );
      })
    )
  );
}