import { Montserrat, Silkscreen } from 'next/font/google'

export const pixelFont = Silkscreen({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--cw-font-pixel',
})

export const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--cw-font-montserrat',
})
