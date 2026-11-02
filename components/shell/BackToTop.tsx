import { Icon } from '@/components/ui/Icon'
import styles from './SiteFooter.module.scss'

export function BackToTop({ label }: { label: string }) {
  return (
    <a href="#header" className={styles.backToTop} data-cw-back-to-top="">
      <span className={styles.backToTopIcon}>
        <Icon name="arrow-up" size={18} />
      </span>
      <span className={styles.backToTopLabel}>{label}</span>
    </a>
  )
}
