import type { ChangeEvent } from 'react'
import styles from './EnvironmentSelector.module.css'

type EnvironmentSelectorProps = {
  options: string[]
  value: string
  onChange: (value: string) => void
  label?: string
}

const EnvironmentSelector = ({
  options,
  value,
  onChange,
  label = 'Environment',
}: EnvironmentSelectorProps) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value)
  }

  return (
    <div className={styles.wrapper}>
      <label htmlFor="environment-selector" className={styles.label}>
        {label}
      </label>
      <select
        id="environment-selector"
        className={styles.select}
        value={value}
        onChange={handleChange}
        disabled={options.length === 0}
      >
        {options.length === 0 ? (
          <option value="">No environments</option>
        ) : (
          options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))
        )}
      </select>
    </div>
  )
}

export default EnvironmentSelector
