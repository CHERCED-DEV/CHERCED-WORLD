import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { tap } from '@/lib/fx/haptics'

const PAGES = [
  {
    title: 'Hoja de cristal',
    text: 'Sube desde abajo con la agarradera. Se cierra arrastrándola hacia abajo, con Esc o con el botón Cerrar.',
  },
  {
    title: 'Cada gesto tiene su botón',
    text: 'Desliza a los lados para cambiar de página, o usa Anterior y Siguiente. Nada depende de un gesto escondido.',
  },
  {
    title: 'Foco y teclado',
    text: 'El foco entra al título, queda atrapado dentro de la hoja y vuelve al botón que la abrió al cerrar.',
  },
] as const

export type HarnessLog = { closes: number; swipes: string[]; haptic: boolean[] }

declare global {
  interface Window {
    __cwM0?: HarnessLog
  }
}

const log: HarnessLog = { closes: 0, swipes: [], haptic: [] }
window.__cwM0 = log

function Harness({ tall }: { tall: boolean }) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [dialog, setDialog] = useState(false)
  const current = PAGES[page] ?? PAGES[0]

  return (
    <div data-m0-harness="" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '16px 14px' }}>
      <button
        type="button"
        data-m0-open=""
        style={{ minHeight: 44, padding: '0 16px', borderRadius: 999 }}
        onClick={() => {
          log.haptic.push(tap())
          setOpen(true)
        }}
      >
        Abrir hoja
      </button>
      <button type="button" data-m0-open-dialog="" style={{ minHeight: 44, padding: '0 16px', borderRadius: 999 }} onClick={() => setDialog(true)}>
        Abrir diálogo
      </button>
      <BottomSheet
        open={open}
        onClose={() => {
          log.closes += 1
          setOpen(false)
        }}
        labelledBy="m0-sheet-title"
        title={current.title}
        closeLabel="Cerrar"
        onSwipe={(direction) => {
          log.swipes.push(direction)
          setPage((value) => (value + (direction === 'next' ? 1 : PAGES.length - 1)) % PAGES.length)
        }}
        navLabels={{ prev: 'Anterior', next: 'Siguiente' }}
        counter={`${page + 1} / ${PAGES.length}`}
      >
        <p data-m0-sheet-text="" style={{ lineHeight: 1.6 }}>
          {current.text}
        </p>
        <form style={{ marginTop: 20 }} onSubmit={(event) => event.preventDefault()}>
          <FormField label="Tu nombre" id="m0-name" floating>
            <input type="text" name="name" autoComplete="off" />
          </FormField>
        </form>
        <a href="#m0-inside" data-m0-inner-link="">
          Un enlace dentro de la hoja
        </a>
        {tall ? <div data-m0-tall="" style={{ height: 1600 }} /> : null}
      </BottomSheet>
      <Dialog open={dialog} onClose={() => setDialog(false)} labelledBy="m0-dialog-title" mobileSheet>
        <h2 id="m0-dialog-title">Diálogo como hoja</h2>
        <button type="button" data-m0-close-dialog="" style={{ minHeight: 44, marginTop: 16 }} onClick={() => setDialog(false)}>
          Cerrar diálogo
        </button>
      </Dialog>
    </div>
  )
}

const host = document.createElement('div')
host.id = 'cw-m0-harness'
;(document.getElementById('main') ?? document.body).prepend(host)
createRoot(host).render(<Harness tall={new URLSearchParams(window.location.search).has('m0-tall')} />)
