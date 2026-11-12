'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps, MouseEvent } from 'react'
import { isPlainClick, scrollToTop } from '@/lib/fx/scroll-top'
import { inPrivatePanel } from './nav'

type SelfLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: string }

export function isSamePage(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  const trim = (value: string) => (value.length > 1 ? value.replace(/\/+$/, '') : value)
  return trim(pathname) === trim(href.split(/[?#]/)[0] ?? href)
}

export function SelfLink({ href, onClick, prefetch, ...props }: SelfLinkProps) {
  const pathname = usePathname()
  const current = isSamePage(pathname, href)

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (!current || !isPlainClick(event)) return
    event.preventDefault()
    scrollToTop()
  }

  return (
    <Link
      href={href}
      prefetch={prefetch ?? (inPrivatePanel(pathname) ? false : undefined)}
      aria-current={current ? 'page' : undefined}
      onClick={handleClick}
      {...props}
    />
  )
}
