import { Outlet } from 'react-router-dom'
import Header from '../Header/Header'
import styles from './MainLayout.module.css'

const MainLayout = () => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
