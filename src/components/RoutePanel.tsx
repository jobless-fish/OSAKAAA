import { formatRouteDistance, formatRouteTime, type RouteResult } from '../lib/route'

export interface RouteState {
  id: string
  name: string
  from: 'lodging' | 'me'
  status: 'loading' | 'ok' | 'error'
  result?: RouteResult
  error?: string
  /** 내 위치를 못 쓰고 숙소 출발로 바꾼 이유 등 */
  note?: string
  /** 구글 지도 (전철·대중교통) 링크 */
  transitHref: string
}

interface Props {
  route: RouteState
  onFrom: (from: 'lodging' | 'me') => void
  onClose: () => void
  geoAvailable: boolean
}

/** 지도 위 도보 경로 안내 상자: 거리·시간(라우터 계산값), 출발지 바꾸기, 구글 지도 대안, 닫기 */
export function RoutePanel({ route, onFrom, onClose, geoAvailable }: Props) {
  const fromLabel = route.from === 'me' ? '내 위치' : '숙소'
  return (
    <section className="route-panel" aria-label="도보 경로" aria-live="polite">
      <div className="route-head">
        <p className="route-title">
          <span className="route-from">{fromLabel}</span> → <b>{route.name}</b>
        </p>
        <button type="button" className="route-close" onClick={onClose} aria-label="경로 닫기">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7l-1.4-1.4L9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z" /></svg>
          <span>닫기</span>
        </button>
      </div>
      {route.status === 'loading' && <p className="route-stat">도보 경로 찾는 중…</p>}
      {route.status === 'ok' && route.result && (
        <p className="route-stat">
          도보 <b>{formatRouteDistance(route.result.distance)}</b> · <b>{formatRouteTime(route.result.duration)}</b>
        </p>
      )}
      {route.status === 'error' && (
        <p className="route-stat route-err">경로를 불러오지 못했어요 ({route.error}). 아래 구글 지도로 확인해 주세요.</p>
      )}
      {route.note && <p className="route-note">{route.note}</p>}
      <div className="route-actions">
        {route.from === 'lodging' ? (
          geoAvailable && (
            <button type="button" className="btn btn-sm" onClick={() => onFrom('me')}>내 위치에서 출발</button>
          )
        ) : (
          <button type="button" className="btn btn-sm" onClick={() => onFrom('lodging')}>숙소에서 출발</button>
        )}
        <a className="btn btn-sm" href={route.transitHref} target="_blank" rel="noopener noreferrer">구글 지도 (전철·대중교통)</a>
      </div>
      <p className="route-credit">
        경로: <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener noreferrer">FOSSGIS OSRM</a> · ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> ·{' '}
        <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener noreferrer">지도 오류 알리기</a> · 시간은 라우터 추정치
      </p>
    </section>
  )
}
