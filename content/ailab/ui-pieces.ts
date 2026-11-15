import type { Localized } from '@/content/types'

export const UI_PIECE_LEVELS = ['primitiva', 'composicion', 'modulo'] as const

export type UiPieceLevel = (typeof UI_PIECE_LEVELS)[number]

export type UiPiece = { id: string; name: string; level: UiPieceLevel; path: string; does: Localized }

export const NEW_PIECE = 'nueva'

export const uiPieces: readonly UiPiece[] = [
  { id: 'button', name: 'Button', level: 'primitiva', path: 'components/ui/Button.tsx', does: { es: 'Botón con variantes solid, glass y ghost, en tres tamaños', en: 'Button with solid, glass and ghost variants in three sizes' } },
  { id: 'icon', name: 'Icon', level: 'primitiva', path: 'components/ui/Icon.tsx', does: { es: 'Íconos SVG de una línea', en: 'Single-line SVG icons' } },
  { id: 'choice-chips', name: 'ChoiceChips', level: 'primitiva', path: 'components/ui/ChoiceChips.tsx', does: { es: 'Opciones tipo chip con radios nativos', en: 'Chip-style options with native radios' } },
  { id: 'availability-chip', name: 'AvailabilityChip', level: 'primitiva', path: 'components/ui/AvailabilityChip.tsx', does: { es: 'Chip de estado con punto de color', en: 'Status chip with a colored dot' } },
  { id: 'separator', name: 'Separator', level: 'primitiva', path: 'components/ui/Separator.tsx', does: { es: 'Línea divisoria', en: 'Divider line' } },
  { id: 'form-field', name: 'FormField', level: 'primitiva', path: 'components/ui/FormField.tsx', does: { es: 'Campo con etiqueta, ayuda y error', en: 'Field with label, hint and error' } },
  { id: 'glass-surface', name: 'GlassSurface', level: 'primitiva', path: 'components/ui/GlassSurface.tsx', does: { es: 'Superficie de vidrio para tarjetas y paneles', en: 'Glass surface for cards and panels' } },
  { id: 'dialog', name: 'Dialog', level: 'composicion', path: 'components/ui/Dialog.tsx', does: { es: 'Diálogo modal accesible', en: 'Accessible modal dialog' } },
  { id: 'bottom-sheet', name: 'BottomSheet', level: 'composicion', path: 'components/ui/BottomSheet.tsx', does: { es: 'Hoja inferior para móvil', en: 'Mobile bottom sheet' } },
  { id: 'toast', name: 'Toast', level: 'composicion', path: 'components/ui/Toast.tsx', does: { es: 'Aviso temporal', en: 'Temporary notice' } },
  { id: 'section-title', name: 'SectionTitle', level: 'composicion', path: 'components/site/SectionTitle.tsx', does: { es: 'Título de sección con su línea', en: 'Section title with its rule' } },
  { id: 'post-card', name: 'PostCard', level: 'composicion', path: 'components/blog/PostCard.tsx', does: { es: 'Tarjeta con título, fecha y etiquetas', en: 'Card with title, date and tags' } },
  { id: 'nav-tabs', name: 'NavTabs', level: 'composicion', path: 'components/admin/NavTabs.tsx', does: { es: 'Pestañas de navegación del panel', en: 'Panel navigation tabs' } },
  { id: 'filter-bar', name: 'FilterBar', level: 'composicion', path: 'components/admin/FilterBar.tsx', does: { es: 'Barra de filtros sobre una lista', en: 'Filter bar above a list' } },
  { id: 'site-header', name: 'SiteHeader', level: 'modulo', path: 'components/shell/SiteHeader.tsx', does: { es: 'Encabezado con logo, navegación y acciones', en: 'Header with logo, navigation and actions' } },
  { id: 'dock', name: 'Dock', level: 'modulo', path: 'components/shell/Dock.tsx', does: { es: 'Barra de navegación inferior en móvil', en: 'Bottom navigation bar on mobile' } },
  { id: 'panel-header', name: 'PanelHeader', level: 'modulo', path: 'components/admin/PanelHeader.tsx', does: { es: 'Encabezado del panel con la cuenta', en: 'Panel header with the account' } },
  { id: 'message-list', name: 'MessageList', level: 'modulo', path: 'components/admin/MessageList.tsx', does: { es: 'Lista de mensajes con acciones por fila', en: 'Message list with per-row actions' } },
  { id: 'site-footer', name: 'SiteFooter', level: 'modulo', path: 'components/shell/SiteFooter.tsx', does: { es: 'Pie del sitio con enlaces', en: 'Site footer with links' } },
  { id: 'command-palette', name: 'CommandPalette', level: 'modulo', path: 'components/experience/CommandPalette.tsx', does: { es: 'Paleta de comandos con búsqueda', en: 'Searchable command palette' } },
]

export const UI_PIECE_IDS = uiPieces.map((piece) => piece.id)

export function uiPiece(id: string): UiPiece | null {
  return uiPieces.find((piece) => piece.id === id) ?? null
}

export const SHOT_SAMPLE_SRC = '/assets/imgs/projects/bookingUI.png'
