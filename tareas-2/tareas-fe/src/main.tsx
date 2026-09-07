import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { inicializarSesion } from './auth/oauth'

inicializarSesion().then(() =>
  createRoot(
    document.getElementById('root') ??
      (() => {
        throw new Error('Falta root')
      })(),
  ).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
