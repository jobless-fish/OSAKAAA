import { isSpot, type Lodging, type Restaurant, type Spot, type WithDistance } from '../types'
import { AREA_LABEL, GROUP_LABEL, POI_META } from '../lib/labels'
import { formatDistance, formatWalk } from '../lib/geo'
import { closedLabels } from '../lib/trip'
import { transitUrl } from '../lib/links'
import { Photo } from './Photo'
import { Stars } from './Stars'

interface Props {
  r: WithDistance
  lodging: Lodging
  selected: boolean
  onSelect: (id: string) => void
  /** 지도 위에 도보 경로 그리기 */
  onRoute: (id: string) => void
  routeActive: boolean
}

type D = { distanceKm: number; walkMin: number }

export function RestaurantCard(props: Props) {
  const { r } = props
  return isSpot(r) ? <SpotCard {...props} s={r} /> : <FoodCard {...props} f={r} />
}


function RouteLinks({ id, lat, lng, lodging, onRoute, routeActive, walk = true }: { id: string; lat: number; lng: number; lodging: Lodging; onRoute: (id: string) => void; routeActive: boolean; walk?: boolean }) {
  return (
    <>
      {walk && <button type="button" className={`btn btn-route ${routeActive ? 'on' : ''}`} aria-pressed={routeActive} onClick={() => onRoute(id)}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9.8 8.9 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3A7.3 7.3 0 0 0 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>
        {routeActive ? '도보 경로 표시 중' : '길찾기 (지도에 도보 경로)'}
      </button>}
      <a className="btn" href={transitUrl(lodging, lat, lng)} target="_blank" rel="noopener noreferrer">구글 지도 (전철·대중교통)</a>
    </>
  )
}

/** 2026년 11월부터 바뀐 면세(리펀드) 방식 안내 — 관광청·세관 공식 안내 기준 */
function TaxFreeNote() {
  return (
    <div className="taxfree-note">
      <p className="taxfree-title">2026년 11월 1일부터 면세 방식 변경 (리펀드 방식)</p>
      <ul>
        <li>가게에서는 <b>세금 포함 가격으로 결제</b>하고, 출국할 때 공항 세관 확인 후 소비세를 돌려받아요.</li>
        <li>같은 날 <b>한 점포 5,000엔 이상(세금 제외)</b> 살 때 대상. 계산할 때 <b>여권</b>을 꼭 보여 주세요.</li>
        <li>출국일에 짐을 부치기 전, 공항 키오스크에서 여권으로 확인 (간사이공항은 Visit Japan Web도 가능). 물건은 뜯지 말고 들고 나가야 해요.</li>
        <li>환급은 구매 때 고른 방법(카드 등)으로, 간사이공항은 출국 심사 뒤 카운터에서 현금도 가능.</li>
      </ul>
      <p className="credit">
        출처: <a href="https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00021.html" target="_blank" rel="noopener noreferrer">관광청 면세 안내</a> ·{' '}
        <a href="https://www.customs.go.jp/kaigairyoko/taxrefund.htm" target="_blank" rel="noopener noreferrer">일본 세관</a> ·{' '}
        <a href="https://www.kansai-airport.or.jp/tax-refund" target="_blank" rel="noopener noreferrer">간사이공항</a>
      </p>
    </div>
  )
}

/** 대표 명소의 가는 법·요금·이벤트 안내 */
function Guide({ guide }: { guide: NonNullable<Spot['guide']> }) {
  return (
    <div className="guide">
      {guide.map((g) => (
        <section key={g.title} className="guide-sec">
          <h4>{g.title}</h4>
          <ul>{g.items.map((it) => <li key={it}>{it}</li>)}</ul>
        </section>
      ))}
    </div>
  )
}

function FoodCard({ f: r, lodging, selected, onSelect, onRoute, routeActive }: Props & { f: Restaurant & D }) {
  const closed = closedLabels(r.closedDates)
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
            {r.walkMin <= 10 && <span className="chip chip-walk">도보 {r.walkMin <= 5 ? 5 : 10}분</span>}
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
            <RouteLinks id={r.id} lat={r.lat} lng={r.lng} lodging={lodging} onRoute={onRoute} routeActive={routeActive} />
          </div>
          <p className="credit">사진·점수: <a href={r.tabelogUrl} target="_blank" rel="noopener noreferrer">타베로그</a> · 거리·시간은 직선거리 기준 추정치</p>
        </div>
      )}
    </article>
  )
}

function feeChip(s: Spot): string {
  const late = /24시간/.test(s.hours) ? '24시간' : /다음날/.test(s.hours) ? '심야 영업' : null
  if (s.type === 'landmark') return '가는 법 안내'
  if (s.type === 'conv') return '24시간'
  if (s.type === 'pharmacy') return /연중무휴/.test(s.hours) ? '연중무휴' : '일요일 휴무'
  if (s.type === 'donki') return late ?? '밤까지 영업'
  if (s.type === 'discount') return late ?? (s.tags?.includes('taxfree') ? '면세 가능' : '잡화·할인')
  if (s.type === 'taxfree') return '면세 5,000엔~'
  if (s.type === 'liquor') return s.fee.startsWith('면세') ? '면세 가능' : s.spotKind.includes('가쿠우치') ? '서서 한 잔' : '술 사기'
  if (s.type === 'livebar') return s.fee.startsWith('노 차지') ? '노 차지' : s.fee.startsWith('투게센') ? '팁(투게센)' : '라이브 요금'
  return s.fee.startsWith('무료') ? '무료' : s.fee === '—' ? '관람 시설 아님' : '유료'
}

function SpotCard({ s, lodging, selected, onSelect, onRoute, routeActive }: Props & { s: Spot & D }) {
  const closed = closedLabels(s.closedDates)
  const meta = POI_META[s.type]
  return (
    <article className={`card card-spot card-${s.type} ${selected ? 'is-selected' : ''}`} id={`card-${s.id}`} aria-labelledby={`title-${s.id}`}>
      <button
        type="button"
        className="card-main"
        aria-pressed={selected}
        aria-controls={`detail-${s.id}`}
        aria-expanded={selected}
        onClick={() => onSelect(s.id)}
      >
        {s.image ? (
          <Photo src={s.image} alt={`${s.nameKo} 대표 사진`} fallbackText={s.spotKind} className="card-photo" />
        ) : (
          <div className="card-photo spot-tile" aria-hidden="true"><span>{s.icon}</span></div>
        )}
        <div className="card-body">
          <h3 className="card-title" id={`title-${s.id}`}>{s.nameKo}</h3>
          <p className="card-ja" lang="ja">{s.nameJa}</p>
          <p className="spot-kind">
            <span aria-hidden="true">{meta.mark}</span> {meta.label} · {s.spotKind}
            {s.tags?.map((t) => <span key={t} className={`tag tag-${t}`}>{POI_META[t].label}</span>)}
          </p>
          <p className="card-dist">
            숙소에서 {formatDistance(s.distanceKm)} · {s.distanceKm < 5 ? formatWalk(s.walkMin) : '전철·택시로 이동'}
          </p>
          <div className="chips">
            <span className="chip chip-spot">{feeChip(s)}</span>
            {s.walkMin <= 10 && <span className="chip chip-walk">도보 {s.walkMin <= 5 ? 5 : 10}분</span>}
            {closed.length > 0 && <span className="chip chip-closed">휴무 {closed.join(', ')}</span>}
            {s.tip && s.type !== 'landmark' && <span className="chip chip-warn">{s.type === 'spot' ? '에티켓 주의' : '6명 팁'}</span>}
          </div>
        </div>
      </button>
      {selected && (
        <div className="card-detail" id={`detail-${s.id}`}>
          <p className="spot-desc">{s.description}</p>
          <dl>
            <dt>가는 법</dt><dd>{s.station}</dd>
            <dt>{s.type === 'spot' || s.type === 'landmark' ? '시간' : '영업'}</dt><dd>{s.hours}</dd>
            <dt>{s.type === 'taxfree' ? '면세' : s.type === 'livebar' ? '요금' : s.type === 'liquor' ? '참고' : '요금'}</dt><dd>{s.fee}</dd>
            {s.tip && (<><dt>{s.type === 'spot' || s.type === 'landmark' ? '팁' : '6명'}</dt><dd>{s.tip}</dd></>)}
            {s.closedNote && (<><dt>주의</dt><dd>{s.closedNote}</dd></>)}
            <dt>주소</dt><dd lang="ja">{s.address}</dd>
          </dl>
          {s.guide && <Guide guide={s.guide} />}
          {(s.type === 'taxfree' || s.tags?.includes('taxfree')) && <TaxFreeNote />}
          <div className="links">
            <a className="btn btn-spot" href={s.infoUrl} target="_blank" rel="noopener noreferrer">{s.infoLabel}</a>
            <RouteLinks id={s.id} lat={s.lat} lng={s.lng} lodging={lodging} onRoute={onRoute} routeActive={routeActive} walk={s.distanceKm < 5} />
          </div>
          <p className="credit">정보: <a href={s.infoUrl} target="_blank" rel="noopener noreferrer">{s.infoLabel}</a> (2026년 11월 확인)</p>
        </div>
      )}
    </article>
  )
}
