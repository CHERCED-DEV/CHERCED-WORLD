import type { JSX } from 'react'

export type IntroProps = { name: string; role: string; skipLabel: string }

export function Intro(_props: IntroProps): JSX.Element {
  return <div hidden data-cw-intro="" />
}
