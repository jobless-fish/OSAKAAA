import type { Lodging, Restaurant, Spot, WithDistance } from '../types'
import { AREA_LABEL, GROUP_LABEL, SPOT_LABEL } from '../lib/labels'
import { formatDistance, formatWalk } from '../lib/geo'
import { closedLabels } from '../lib/trip'
import { Photo } from './Photo'
import { Stars } from './Stars'

interface Props {
  r: WithDistance
  lodging: Lodging
  selected: boolean
  onSelect: (id: string) => void
}

type D = { distanceKm: number; walkMin: number }

export function RestaurantCard(props: Props) {
  const { r } = props
  return r.type === 'spot' ? <SpotCard {...props} s={r} /> : <FoodCard {...props} f={r} />
}

function directionsUrl(lodging: Lodging, lat: number, lng: number, mode: 'transit' | 'walking') {
  return `https://www.google.com/maps/dir/?api=1&origin=${lodging.lat},${lodging.lng}&destination=${lat},${lng}&travelmode=${mode}`
}

function FoodCard({ f: r, lodging, selected, onSelect }: Props & { f: Restaurant & D }) {
  const closed = closedLabels(r.closedDates)
  const directions = directionsUrl(lodging, r.lat, r.lng, r.walkMin <= 15 ? 'walking' : 'transit')
  return (
    <article className={`card ${selected ? 'is-selected' : ''}`} id={`card-${r.id}`} aria-labelledby={`title-${r.id}`}>
      <button
        type="button"
        className="card-main"
        aria-pressed={selected}
        aria-controls={`detail-${r.id}`}
        aria-expanded={selected}
        onClick={() => onSelect(r.id)}
      >
        <Photo src={r.image} alt={`${r.nameKo} 대표 사진`} fallbackText={r.genreText} className="card-photo" />
        <div className="card-body">
          <h3 className="card-title" id={`title-${r.id}`}>{r.nameKo}</h3>
          <p className="card-ja" lang="ja">{r.nameJa}</p>
          <Stars score={r.tabelogScore} />
          <p className="card-meta">
            {r.genreText} · {AREA_LABEL[r.area]}
          </p>
          <p className="card-dist">
            숙소에서 {formatDistance(r.distanceKm)} · {formatWalk(r.walkMin)}
          </p>
          <div className="chips">
            <span className={`chip chip-${r.group}`}>{GROUP_LABEL[r.group]}</span>
            {r.walkMin <= 10 && <span className="chip chip-walk">도보 10분</span>}
            {closed.length > 0 && <span className="chip chip-closed">휴무 {closed.join(', ')}</span>}
            {r.closedNote && <span className="chip chip-warn">영업일 확인 필요</span>}
          </div>
        </div>
      </button>
      {selected && (
        <div className="card-detail" id={`detail-${r.id}`}>
          <dl>
            <dt>가는 법</dt><dd>{r.station}</dd>
            <dt>영업</dt><dd>{r.hours}</dd>
            {r.closedNote && (<><dt>주의</dt><dd>{r.closedNote}</dd></>)}
            <dt>예산</dt><dd>{r.budget}</dd>
            <dt>예약</dt><dd>{r.reserve}</dd>
            <dt>좌석</dt><dd>{r.seats}</dd>
            <dt>6명</dt><dd>{GROUP_LABEL[r.group]} — {r.groupNote}</dd>
            <dt>주소</dt><dd lang="ja">{r.address}</dd>
          </dl>
          <div className="links">
            <a className="btn btn-primary" href={r.tabelogUrl} target="_blank" rel="noopener noreferrer">타베로그에서 보기</a>
            {r.courseUrl && <a className="btn" href={r.courseUrl} target="_blank" rel="noopener noreferrer">코스 보기</a>}
            <a className="btn" href={directions} target="_blank" rel="noopener noreferrer">숙소에서 길찾기</a>
          </div>
          <p className="credit">사진·점수: <a href={r.tabelogUrl} target="_blank" rel="noopener noreferrer">타베로그</a> · 거리·시간은 직선거리 기준 추정치</p>
        </div>
      )}
    </article>
  )
}

function SpotCard({ s, lodging, selected, onSelect }: Props & { s: Spot & D }) {
  const closed = closedLabels(s.closedDates)
  const directions = directionsUrl(lodging, s.lat, s.lng, s.walkMin <= 15 ? 'walking' : 'transit')
  return (
    <article className={`card card-spot ${selected ? 'is-selected' : ''}`} id={`card-${s.id}`} aria-labelledby={`title-${s.id}`}>
      <button
        type="button"
        className="card-main"
        aria-pressed={selected}
        aria-controls={`detail-${s.id}`}
        aria-expanded={selected}
        onClick={() => onSelect(s.id)}
      >
        <div className="card-photo spot-tile" aria-hidden="true"><span>{s.icon}</span></div>
        <div className="card-body">
          <h3 className="card-title" id={`title-${s.id}`}>{s.nameKo}</h3>
          <p className="card-ja" lang="ja">{s.nameJa}</p>
          <p className="spot-kind"><span aria-hidden="true">✦</span> {SPOT_LABEL} · {s.spotKind}</p>
          <p className="card-dist">
            숙소에서 {formatDistance(s.distanceKm)} · {formatWalk(s.walkMin)}
          </p>
          <div className="chips">
            <span className="chip chip-spot">{s.fee.startsWith('무료') ? '무료' : s.fee === '—' ? '관람 시설 아님' : '유료'}</span>
            {s.walkMin <= 10 && <span className="chip chip-walk">도보 10분</span>}
            {closed.length > 0 && <span className="chip chip-closed">휴무 {closed.join(', ')}</span>}
            {s.tip && <span className="chip chip-warn">에티켓 주의</span>}
          </div>
        </div>
      </button>
      {selected && (
        <div className="card-detail" id={`detail-${s.id}`}>
          <p className="spot-desc">{s.description}</p>
          <dl>
            <dt>가는 법</dt><dd>{s.station}</dd>
            <dt>시간</dt><dd>{s.hours}</dd>
            <dt>요금</dt><dd>{s.fee}</dd>
            {s.tip && (<><dt>에티켓</dt><dd>{s.tip}</dd></>)}
            {s.closedNote && (<><dt>주의</dt><dd>{s.closedNote}</dd></>)}
            <dt>주소</dt><dd lang="ja">{s.address}</dd>
          </dl>
          <div className="links">
            <a className="btn btn-spot" href={s.infoUrl} target="_blank" rel="noopener noreferrer">{s.infoLabel}</a>
            <a className="btn" href={directions} target="_blank" rel="noopener noreferrer">숙소에서 길찾기</a>
          </div>
          <p className="credit">정보: <a href={s.infoUrl} target="_blank" rel="noopener noreferrer">{s.infoLabel}</a> (2026년 11월 확인)</p>
        </div>
      )}
    </article>
  )
}
