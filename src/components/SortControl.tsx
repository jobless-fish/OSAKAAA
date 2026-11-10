import { useRef, type KeyboardEvent } from 'react'
import { SORT_OPTIONS, type SortKey } from '../lib/filters'

interface Props {
  value: SortKey
  onChange: (v: SortKey) => void
}

/** 정렬 세그먼트 컨트롤 — 라디오 그룹처럼 동작(좌우 화살표로 이동) */
export function SortControl({ value, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const i = SORT_OPTIONS.findIndex((o) => o.key === value)
    const n = (i + (e.key === 'ArrowRight' ? 1 : SORT_OPTIONS.length - 1)) % SORT_OPTIONS.length
    onChange(SORT_OPTIONS[n].key)
    refs.current[n]?.focus()
  }
  return (
    <div className="seg" role="radiogroup" aria-label="정렬" onKeyDown={onKey}>
      {SORT_OPTIONS.map((o, i) => {
        const on = o.key === value
        return (
          <button
            key={o.key}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            className={`seg-btn ${on ? 'on' : ''}`}
            onClick={() => onChange(o.key)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
