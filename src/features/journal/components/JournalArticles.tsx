import type { JournalArticle } from '../model/types'
import styles from './JournalArticles.module.css'

type JournalArticlesProps = {
  articles: JournalArticle[]
  label: string
  emptyLabel: string
}

const JournalArticles = ({ articles, label, emptyLabel }: JournalArticlesProps) => {
  if (articles.length === 0) {
    return <p className={styles.text}>{emptyLabel}</p>
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>{label}</p>
      <ul className={styles.list}>
        {articles.map((article) => (
          <li key={article.id} className={styles.listItem}>
            {article.title}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default JournalArticles

