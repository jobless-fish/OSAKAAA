import type { FilterState, WalkKey } from '../lib/filters'
import { POI_META } from '../lib/labels'
import { POI_TYPES, type PoiType } from '../types'

interface Props {
  value: FilterState
  onChange: (v: FilterState) => void
  counts: { walk5: number; walk10: number; walk15: number } & Record<PoiType, number>
}

const WALKS: Exclude<WalkKey, 'all'>[] = ['5', '10', '15']

/** 자주 쓰는 조건을 한 번에 켜고 끄는 칩 (도보 시간 · 식당이 아닌 장소 종류) */
export function QuickFilters({ value, onChange, counts }: Props) {
  const toggleWalk = (k: Exclude<WalkKey, 'all'>) => onChange({ ...value, walk: value.walk === k ? 'all' : k })
  const walkCount = { '5': counts.walk5, '10': counts.walk10, '15': counts.walk15 }
  return (
    <div className="quick" role="group" aria-label="빠른 필터">
      {WALKS.map((k) => (
        <button
          key={k}
          type="button"
          className={`qchip ${value.walk === k ? 'on' : ''}`}
          aria-pressed={value.walk === k}
          aria-label={`도보 ${k}분 이내 ${walkCount[k]}곳`}
          onClick={() => toggleWalk(k)}
        >
          도보 {k}분 <span className="qcount">{walkCount[k]}</span>
        </button>
      ))}
      {POI_TYPES.map((t) => {
        const on = value.type === t
        return (
          <button
            key={t}
            type="button"
            className={`qchip qchip-spot qchip-${t} ${on ? 'on' : ''}`}
            aria-pressed={on}
            aria-label={`${POI_META[t].label} ${counts[t]}곳만 보기`}
            onClick={() => onChange({ ...value, type: on ? 'all' : t, genre: 'all', rating: 'all' })}
          >
            <span aria-hidden="true">{POI_META[t].mark}</span> {POI_META[t].label} <span className="qcount">{counts[t]}</span>
          </button>
        )
      })}
    </div>
  )
}
