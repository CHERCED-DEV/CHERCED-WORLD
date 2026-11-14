import { cx } from '@/components/ui/cx'
import { initials } from '@/lib/accounts/profile-options'
import styles from './Dashboard.module.scss'

export type AvatarProps = { src: string | null; name: string; size?: 'sm' | 'md' | 'lg'; className?: string }

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  return (
    <span className={cx(styles.avatar, styles[`avatar-${size}`], className)} data-cw-avatar={src ? 'image' : 'initials'}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar privado o de Google, sin pasar por el optimizador
        <img src={src} alt="" width={256} height={256} referrerPolicy="no-referrer" decoding="async" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  )
}
