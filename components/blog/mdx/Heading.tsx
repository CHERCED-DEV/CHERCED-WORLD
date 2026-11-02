import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '@/components/ui/cx'
import styles from './Heading.module.scss'

type HeadingProps = Omit<HTMLAttributes<HTMLHeadingElement>, 'children'> & { children?: ReactNode }

function Heading({ level, id, children, className, ...rest }: HeadingProps & { level: 2 | 3 }) {
  const Tag = level === 2 ? 'h2' : 'h3'
  return (
    <Tag {...rest} id={id} className={cx(styles.heading, styles[`h${level}`], className)}>
      {id ? (
        <a href={`#${id}`} className={styles.anchor}>
          {children}
        </a>
      ) : (
        children
      )}
    </Tag>
  )
}

export function MdxH2(props: HeadingProps) {
  return <Heading level={2} {...props} />
}

export function MdxH3(props: HeadingProps) {
  return <Heading level={3} {...props} />
}
