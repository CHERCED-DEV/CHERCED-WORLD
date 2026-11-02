import Image from 'next/image'
import styles from './MdxImage.module.scss'

type MdxImageProps = {
  src?: unknown
  alt?: string
  title?: string
  width?: number | string
  height?: number | string
}

const SIZES = '(min-width: 768px) 720px, 100vw'

function dimension(value: number | string | undefined): number | null {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function MdxImage({ src, alt = '', title, width, height }: MdxImageProps) {
  if (typeof src !== 'string' || src === '') return null
  const w = dimension(width)
  const h = dimension(height)

  if (w && h) {
    return <Image src={src} alt={alt} title={title} width={w} height={h} sizes={SIZES} className={styles.image} />
  }

  return (
    <span className={styles.frame}>
      <Image src={src} alt={alt} title={title} fill sizes={SIZES} className={styles.fill} />
    </span>
  )
}
