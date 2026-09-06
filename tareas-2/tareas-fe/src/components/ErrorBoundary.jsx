import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: false }

  static getDerivedStateFromError() {
    return { error: true }
  }

  render() {
    if (this.state.error) {
      return (
        <main role="alert" style={{ padding: 32 }}>
          <h1>No se pudo mostrar esta pantalla</h1>
          <p>Recargá la aplicación para volver a intentarlo.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
