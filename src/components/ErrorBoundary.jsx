import { createElement as h } from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return h('div', { style: { padding: '40px 20px', textAlign: 'center', color: '#666' } },
        h('h2', null, '\u62B1\u6B49\uFF0C\u9875\u9762\u51FA\u73B0\u4E86\u4E00\u4E9B\u95EE\u9898'),
        h('p', { style: { fontSize: '13px', margin: '10px 0 20px' } }, '\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5'),
        h('button', { onClick: function() { window.location.reload(); }, style: { padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#4fc3f7', color: '#fff', fontSize: '14px', cursor: 'pointer' } },
          '\u91CD\u65B0\u52A0\u8F7D')
      );
    }
    return this.props.children;
  }
}