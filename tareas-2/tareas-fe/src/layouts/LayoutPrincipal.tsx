// src/layouts/LayoutPrincipal.tsx
import { Outlet } from 'react-router-dom'
import Encabezado from '../components/Encabezado'
import styles from './LayoutPrincipal.module.css'

export default function LayoutPrincipal() {
  return (
    <div className={styles.shell}>
      <Encabezado />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
