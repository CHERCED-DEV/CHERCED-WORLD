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

const SVG = /\.svg(?:[?#].*)?$/i

function dimension(value: number | string | undefined): number | null {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function isDiagram(src: string): boolean {
  return SVG.test(src)
}

export function MdxDiagram({ src, alt, title, width, height }: { src: string; alt: string; title?: string; width?: number | null; height?: number | null }) {
  return (
    <span className={styles.diagram} tabIndex={0} data-cw-diagram="">
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image no optimiza SVG y exige medidas que el Markdown no trae */}
      <img
        src={src}
        alt={alt}
        title={title}
        width={width ?? undefined}
        height={height ?? undefined}
        loading="lazy"
        decoding="async"
        className={styles.diagramImage}
      />
    </span>
  )
}

export function MdxImage({ src, alt = '', title, width, height }: MdxImageProps) {
  if (typeof src !== 'string' || src === '') return null
  const w = dimension(width)
  const h = dimension(height)

  if (isDiagram(src)) return <MdxDiagram src={src} alt={alt} title={title} width={w} height={h} />

  if (w && h) {
    return <Image src={src} alt={alt} title={title} width={w} height={h} sizes={SIZES} className={styles.image} />
  }

  return (
    <span className={styles.frame}>
      <Image src={src} alt={alt} title={title} fill sizes={SIZES} className={styles.fill} />
    </span>
  )
}
