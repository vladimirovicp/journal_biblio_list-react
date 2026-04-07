import EnvironmentSelector from '../../components/EnvironmentSelector/EnvironmentSelector'
import styles from './HomePage.module.css'

type HomePageProps = {
  environmentOptions: string[]
  selectedEnvironment: string
  selectedBaseUrl: string
  onEnvironmentChange: (environment: string) => void
}

const HomePage = ({
  environmentOptions,
  selectedEnvironment,
  selectedBaseUrl,
  onEnvironmentChange,
}: HomePageProps) => {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Home</h1>

      <p className={styles.selectorHint}>
        Выберите для какого сайта создаём библиографический список
      </p>

      <EnvironmentSelector
        options={environmentOptions}
        value={selectedEnvironment}
        onChange={onEnvironmentChange}
        label="Выбери"
      />

      <p className={styles.baseUrl}>
        Base URL: <span className={styles.baseUrlValue}>{selectedBaseUrl || 'Set URL in .env'}</span>
      </p>

    </section>
  )
}

export default HomePage
