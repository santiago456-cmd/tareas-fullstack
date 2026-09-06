// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import LayoutPrincipal from './layouts/LayoutPrincipal'
import RequiereAuth from './components/RequiereAuth'
import AuthCallback from './pages/AuthCallback'
import Listas from './pages/Listas'
import ListaDetalle from './pages/ListaDetalle'
import ListaForm from './pages/ListaForm'
import Tareas from './pages/Tareas'
import TareaForm from './pages/TareaForm'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const protegido = (elemento) => <RequiereAuth>{elemento}</RequiereAuth>

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<LayoutPrincipal />}>
            <Route path="/" element={<Navigate to="/listas" />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/listas" element={protegido(<Listas />)} />
            <Route path="/listas/:id" element={protegido(<ListaDetalle />)} />
            <Route
              path="/listas/:id/editar"
              element={protegido(<ListaForm />)}
            />
            <Route
              path="/listas/:listaId/tareas/nueva"
              element={protegido(<TareaForm />)}
            />
            <Route path="/tareas" element={protegido(<Tareas />)} />
            <Route
              path="/tareas/:id/editar"
              element={protegido(<TareaForm />)}
            />
            <Route path="*" element={<Navigate to="/listas" />} />
          </Route>
        </Routes>

        <ToastContainer position="bottom-right" autoClose={2500} />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
