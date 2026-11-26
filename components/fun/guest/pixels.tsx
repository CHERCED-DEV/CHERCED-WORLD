import type { GuestAnimation } from '@/lib/ai/agent/guest-animations'
import styles from './Guest.module.scss'

const PALETTE: Record<string, string> = {
  r: '#ff4d8d',
  R: '#c2185b',
  g: '#25ed9e',
  G: '#178a5c',
  y: '#ffd23f',
  w: '#ffffff',
  k: '#0b0f0d',
  b: '#8d5a3b',
  B: '#5e3a24',
  l: '#ffe08a',
  c: '#9aa5ab',
  s: '#e0ac7e',
  h: '#2d211a',
  p: '#b78cff',
  a: '#7fd1ff',
}

export type Sprite = readonly string[]

export const HEART: Sprite = ['.rr.rr.', 'rrrrrrr', 'rrwrrrr', '.rrrrr.', '..rrr..', '...r...']

const BIG_HEART: Sprite = [
  '..rrr...rrr..',
  '.rrrrr.rrrrr.',
  'rrwwrrrrrrrrr',
  'rrwrrrrrrrrrr',
  'rrrrrrrrrrrrr',
  '.rrrrrrrrrrr.',
  '..rrrrrrrrr..',
  '...rrrrrrr...',
  '....rrrrr....',
  '.....rrr.....',
  '......r......',
]

const HOUSE: Sprite = [
  '..........kk..........',
  '.........kRRk.........',
  '........kRRRRk........',
  '.......kRRRRRRk.......',
  '.GG...kRRRRRRRRk...GG.',
  'GGGG.kkkkkkkkkkkk.GGGG',
  'GGGG.kwwwwwwwwwwk.GGGG',
  '.GG..kwllwwwwllwk..GG.',
  '..b..kwllwwwwllwk..b..',
  '..b..kwwwwbbwwwwk..b..',
  '..b..kwwwwbrwwwwk..b..',
  'gggggkkkkkkkkkkkkggggg',
]

const GAVEL: Sprite = ['bbbbbbb.....', 'bBBBBBb.....', 'bbbbbbb.....', '...bb.......', '...bb.......', '...bb.......', '...bb.......', '.cccccc.....', 'cccccccc....']

const EYES: Sprite = ['.kkkk....kkkk.', 'kwwwwk..kwwwwk', 'kwwkkk..kwwkkk', 'kwwkkk..kwwkkk', 'kwwwwk..kwwwwk', '.kkkk....kkkk.']

const FROWN: Sprite = [
  '...yyyyy...',
  '.yyyyyyyyy.',
  '.yyyyyyyyy.',
  'yykkkyykkky',
  'yyyyyyyyyyy',
  'yyyyyyyyyyy',
  'yyykkkkkyyy',
  '.yyyyyyyyy.',
  '.yyyyyyyyy.',
  '...yyyyy...',
]

const SPARKLE: Sprite = ['..y..', '..y..', 'yyyyy', '..y..', '..y..']

const PERSON = (shirt: string): Sprite => ['.hhh.', 'hssss', '.sss.', `${shirt}${shirt}${shirt}${shirt}${shirt}`, `.${shirt}${shirt}${shirt}.`, `.${shirt}${shirt}${shirt}.`, '.c.c.', '.c.c.']

const DESK: Sprite = ['.aaaa.', '.akka.', 'cccccc', '.c..c.', '.c..c.']

const WINDOW: Sprite = ['kkkkkkk', 'kaaayak', 'kaaaaak', 'kgggggk', 'kGGgGGk', 'kkkkkkk']

const BANG: Sprite = ['.rr.', '.rr.', '.rr.', '.rr.', '....', '.rr.']

export function Pixels({ sprite, size = 6, className }: { sprite: Sprite; size?: number; className?: string }) {
  const width = Math.max(...sprite.map((row) => row.length))
  const runs: Array<{ x: number; y: number; w: number; c: string }> = []
  sprite.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x]!
      let end = x
      while (end < row.length && row[end] === c) end += 1
      if (c !== '.' && PALETTE[c]) runs.push({ x, y, w: end - x, c })
      x = end
    }
  })
  return (
    <svg className={className} width={width * size} height={sprite.length * size} viewBox={`0 0 ${width} ${sprite.length}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {runs.map((run) => (
        <rect key={`${run.x}:${run.y}`} x={run.x} y={run.y} width={run.w} height={1} fill={PALETTE[run.c]} />
      ))}
    </svg>
  )
}

export function GuestArt({ animation, label }: { animation: GuestAnimation | 'finale'; label?: string }) {
  switch (animation) {
    case 'hearts':
      return (
        <div className={styles.art} data-cw-guest-art="hearts">
          {[0, 1, 2, 3, 4, 5, 6].map((index) => (
            <span key={index} className={styles.flyHeart} style={{ left: `${8 + index * 13}%`, animationDelay: `${index * 0.18}s` }}>
              <Pixels sprite={HEART} size={5} />
            </span>
          ))}
          {label ? <strong className={styles.artLabel}>{label}</strong> : null}
        </div>
      )
    case 'house':
      return (
        <div className={styles.art} data-cw-guest-art="house">
          <Pixels sprite={HOUSE} size={7} className={styles.pop} />
        </div>
      )
    case 'gavel':
      return (
        <div className={styles.art} data-cw-guest-art="gavel">
          <Pixels sprite={GAVEL} size={7} className={styles.swing} />
          <span className={styles.energy}>
            <span />
          </span>
          {label ? <strong className={styles.artLabel}>{label}</strong> : null}
        </div>
      )
    case 'hug':
      return (
        <div className={styles.art} data-cw-guest-art="hug">
          <Pixels sprite={BIG_HEART} size={8} className={styles.pulse} />
        </div>
      )
    case 'alert':
      return (
        <div className={styles.art} data-cw-guest-art="alert">
          <div className={styles.alert} role="presentation">
            <span className={styles.alertBar}>SYSTEM ALERT</span>
            <strong className={styles.blink}>{label ?? 'ERROR'}</strong>
          </div>
        </div>
      )
    case 'stare':
      return (
        <div className={styles.art} data-cw-guest-art="stare">
          <Pixels sprite={EYES} size={8} className={styles.peek} />
          <span className={styles.dots}>
            <span />
            <span />
            <span />
          </span>
        </div>
      )
    case 'frown':
      return (
        <div className={styles.art} data-cw-guest-art="frown">
          <Pixels sprite={FROWN} size={8} className={styles.shake} />
        </div>
      )
    case 'indignant':
      return (
        <div className={styles.art} data-cw-guest-art="indignant">
          <Pixels sprite={BANG} size={9} className={styles.shake} />
          <Pixels sprite={EYES} size={6} />
        </div>
      )
    case 'sparkles':
      return (
        <div className={styles.art} data-cw-guest-art="sparkles">
          {[0, 1, 2, 3, 4].map((index) => (
            <span key={index} className={styles.twinkle} style={{ left: `${10 + index * 19}%`, top: `${20 + ((index * 37) % 50)}%`, animationDelay: `${index * 0.25}s` }}>
              <Pixels sprite={SPARKLE} size={6} />
            </span>
          ))}
        </div>
      )
    case 'laugh':
      return (
        <div className={styles.art} data-cw-guest-art="laugh">
          <Pixels sprite={PERSON('g')} size={8} className={styles.bounce} />
          <Pixels sprite={PERSON('p')} size={8} className={styles.bounceLate} />
        </div>
      )
    case 'desks':
      return (
        <div className={styles.art} data-cw-guest-art="desks">
          <span className={styles.stack}>
            <Pixels sprite={PERSON('g')} size={6} />
            <Pixels sprite={DESK} size={6} />
          </span>
          <Pixels sprite={WINDOW} size={7} />
          <span className={styles.stack}>
            <Pixels sprite={PERSON('p')} size={6} />
            <Pixels sprite={DESK} size={6} />
          </span>
        </div>
      )
    case 'finale':
      return (
        <div className={styles.art} data-cw-guest-art="finale">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <span key={index} className={styles.firefly} style={{ left: `${6 + index * 16}%`, top: `${15 + ((index * 41) % 60)}%`, animationDelay: `${index * 0.4}s` }} />
          ))}
          <Pixels sprite={PERSON('g')} size={7} />
          <Pixels sprite={HEART} size={5} className={styles.pulse} />
          <Pixels sprite={PERSON('p')} size={7} />
        </div>
      )
  }
}
