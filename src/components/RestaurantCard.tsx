import type { Lodging, WithDistance } from '../types'
import { AREA_LABEL, GROUP_LABEL } from '../lib/labels'
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

export function RestaurantCard({ r, lodging, selected, onSelect }: Props) {
  const closed = closedLabels(r.closedDates)
  const directions = `https://www.google.com/maps/dir/?api=1&origin=${lodging.lat},${lodging.lng}&destination=${r.lat},${r.lng}&travelmode=transit`
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
