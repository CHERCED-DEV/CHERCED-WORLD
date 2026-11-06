import styles from './Showcases.module.scss'

export function MadeUp({ text }: { text: string }) {
  return (
    <p className={styles.madeUp} data-cw-made-up="">
      <svg className={styles.madeUpIcon} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 20l1-4L16 5l3 3L8 19l-4 1zM14 7l3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      {text}
    </p>
  )
}
