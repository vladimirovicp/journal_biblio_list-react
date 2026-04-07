import styles from './HomePage.module.css'

const HomePage = () => {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Home</h1>
      <p className={styles.text}>
        This is the main page of the React SPA scaffolded with Vite and TypeScript.
      </p>
    </section>
  )
}

export default HomePage
