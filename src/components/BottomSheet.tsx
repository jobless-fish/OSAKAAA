import { useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from 'react'

export type Snap = 'peek' | 'half' | 'full'

interface Props {
  snap: Snap
  onSnap: (s: Snap) => void
  header: ReactNode
  children: ReactNode
  onVisibleHeight: (px: number) => void
}

const ORDER: Snap[] = ['peek', 'half', 'full']
const SNAP_LABEL: Record<Snap, string> = { peek: '접힘', half: '반쯤 펼침', full: '전체 펼침' }

function visibleFor(snap: Snap, total: number): number {
  if (snap === 'peek') return 176
  if (snap === 'half') return Math.round(total * 0.52)
  return total
}

/** 드래그로 높이를 바꾸는 모바일 바텀시트. 손잡이 탭/버튼으로도 조절할 수 있다(단일 포인터 대안). */
export function BottomSheet({ snap, onSnap, header, children, onVisibleHeight }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [total, setTotal] = useState(600)
  const [drag, setDrag] = useState<number | null>(null)
  const start = useRef<{ y: number; vis: number; t: number } | null>(null)

  useEffect(() => {
    const measure = () => {
      const h = ref.current?.parentElement?.clientHeight ?? window.innerHeight
      setTotal(h)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const vis = drag ?? visibleFor(snap, total)

  useEffect(() => {
    if (drag == null) onVisibleHeight(visibleFor(snap, total))
  }, [snap, total, drag, onVisibleHeight])

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    start.current = { y: e.clientY, vis, t: Date.now() }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!start.current) return
    const dy = start.current.y - e.clientY
    if (Math.abs(dy) < 4 && drag == null) return
    setDrag(Math.max(120, Math.min(total, start.current.vis + dy)))
  }
  const finish = useCallback(
    (e: RPointerEvent<HTMLDivElement>) => {
      const s = start.current
      start.current = null
      if (!s) return
      const dy = s.y - e.clientY
      if (drag == null || Math.abs(dy) < 6) {
        setDrag(null)
        // 탭: 다음 단계로
        const i = ORDER.indexOf(snap)
        onSnap(ORDER[(i + 1) % ORDER.length])
        return
      }
      const v = drag
      const velocity = dy / Math.max(1, Date.now() - s.t)
      let next: Snap
      if (velocity > 0.6) next = snap === 'peek' ? 'half' : 'full'
      else if (velocity < -0.6) next = snap === 'full' ? 'half' : 'peek'
      else {
        next = ORDER.reduce((best, cur) =>
          Math.abs(visibleFor(cur, total) - v) < Math.abs(visibleFor(best, total) - v) ? cur : best,
        )
      }
      setDrag(null)
      onSnap(next)
    },
    [drag, snap, onSnap, total],
  )

  return (
    <section
      ref={ref}
      className={`sheet ${drag != null ? 'is-dragging' : ''}`}
      style={{ transform: `translateY(${total - vis}px)` }}
      aria-label="맛집 목록"
    >
      <div
        className="sheet-handle"
        role="button"
        tabIndex={0}
        aria-label={`목록 높이 바꾸기 (현재 ${SNAP_LABEL[snap]})`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={finish}
        onPointerCancel={() => {
          start.current = null
          setDrag(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSnap(ORDER[(ORDER.indexOf(snap) + 1) % ORDER.length])
          } else if (e.key === 'ArrowUp') onSnap(snap === 'peek' ? 'half' : 'full')
          else if (e.key === 'ArrowDown') onSnap(snap === 'full' ? 'half' : 'peek')
        }}
      >
        <span className="grabber" aria-hidden="true" />
      </div>
      <div className="sheet-header">{header}</div>
      <div className="sheet-body" style={{ height: Math.max(0, vis - 96) }}>
        {children}
      </div>
    </section>
  )
}
