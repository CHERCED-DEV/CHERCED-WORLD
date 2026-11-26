import type { RouteStation } from '@/content/ailab/route/stations'

export const engineeringStation: RouteStation = {
  id: 'tablero-en-numeros',
  proof: 4,
  alsoProves: [3],
  title: { es: 'El tablero en números', en: 'The dashboard in numbers' },
  minutes: 2,
  steps: [
    {
      es: 'Abre la spec 030 en el tablero de ingeniería: sus commits con fecha y enlace, sus requisitos con una prueba que los nombra y los días hasta su primer feat.',
      en: 'Open spec 030 on the engineering dashboard: its commits with date and link, its requirements named by a test and the days to its first feat.',
    },
    {
      es: 'Vuelve al tablero y mira la franja de este despliegue: el commit, el entorno y las pruebas que pasaron en su build.',
      en: 'Go back to the dashboard and look at the deployment strip: the commit, the environment and the tests that passed in its build.',
    },
  ],
  href: '/ingenieria/030',
  evidence: ['metrics-link'],
  spec: '045',
}
