import type { FilterState, WalkKey } from '../lib/filters'

interface Props {
  value: FilterState
  onChange: (v: FilterState) => void
  counts: { walk10: number; walk15: number; spots: number }
}

/** 자주 쓰는 조건을 한 번에 켜고 끄는 칩 (도보 시간 · 특이한 장소) */
export function QuickFilters({ value, onChange, counts }: Props) {
  const toggleWalk = (k: Exclude<WalkKey, 'all'>) => onChange({ ...value, walk: value.walk === k ? 'all' : k })
  const spotsOnly = value.type === 'spot'
  return (
    <div className="quick" role="group" aria-label="빠른 필터">
      <button type="button" className={`qchip ${value.walk === '10' ? 'on' : ''}`} aria-pressed={value.walk === '10'} aria-label={`도보 10분 이내 ${counts.walk10}곳`} onClick={() => toggleWalk('10')}>
        도보 10분 <span className="qcount">{counts.walk10}</span>
      </button>
      <button type="button" className={`qchip ${value.walk === '15' ? 'on' : ''}`} aria-pressed={value.walk === '15'} aria-label={`도보 15분 이내 ${counts.walk15}곳`} onClick={() => toggleWalk('15')}>
        도보 15분 <span className="qcount">{counts.walk15}</span>
      </button>
      <button
        type="button"
        className={`qchip qchip-spot ${spotsOnly ? 'on' : ''}`}
        aria-pressed={spotsOnly}
        onClick={() => onChange({ ...value, type: spotsOnly ? 'all' : 'spot', genre: 'all', rating: 'all' })}
      >
        <span aria-hidden="true">✦</span> 특이한 장소 <span className="qcount">{counts.spots}</span>
      </button>
    </div>
  )
}
