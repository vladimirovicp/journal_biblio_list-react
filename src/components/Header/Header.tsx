import { NavLink } from 'react-router-dom'
import styles from './Header.module.css'

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand}>
          Journal Biblio List
        </NavLink>

        <nav className={styles.nav} aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.linkActive}` : styles.link
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.linkActive}` : styles.link
            }
          >
            About
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default Header
