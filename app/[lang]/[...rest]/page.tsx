import { notFound } from 'next/navigation'

export default function UnknownRoute(): never {
  notFound()
}
