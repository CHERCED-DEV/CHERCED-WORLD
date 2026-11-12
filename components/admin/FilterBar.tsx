import Link from 'next/link'
import styles from './admin.module.scss'

export type FilterOption = { value: string; label: string; href: string }

export function FilterGroup({ label, options, current }: { label: string; options: FilterOption[]; current: string }) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      <span className={styles.groupLabel} aria-hidden="true">
        {label}
      </span>
      {options.map((option) => (
        <Link
          key={option.value}
          href={option.href}
          prefetch={false}
          className={styles.chip}
          aria-current={option.value === current ? 'page' : undefined}
          data-cw-filter={option.value}
        >
          {option.label}
        </Link>
      ))}
    </div>
  )
}
