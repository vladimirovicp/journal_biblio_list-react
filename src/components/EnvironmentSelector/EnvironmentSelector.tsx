import type { ChangeEvent } from 'react'
import styles from './EnvironmentSelector.module.css'

type EnvironmentSelectorProps = {
  options: string[]
  value: string
  onChange: (value: string) => void
  label?: string
}

const NOT_SELECTED_LABEL = '\u041d\u0435 \u0432\u044b\u0431\u0440\u0430\u043d\u043e'

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
          <>
            <option value="">{NOT_SELECTED_LABEL}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  )
}

export default EnvironmentSelector
