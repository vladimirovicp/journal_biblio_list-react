import styles from './AboutPage.module.css'

const AboutPage = () => {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>About</h1>
      <p className={styles.text}>
        This page demonstrates client-side routing with react-router and a reusable layout.
      </p>
    </section>
  )
}

export default AboutPage
