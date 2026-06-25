import { Component } from 'react'

/**
 * Keeps a non-critical visual (the WebGL globe) from ever taking the page
 * down. On error we simply render nothing and let the CSS gradient stand in.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(err) {
    if (import.meta.env.DEV) console.warn('[GlobeCanvas] disabled:', err?.message)
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}
