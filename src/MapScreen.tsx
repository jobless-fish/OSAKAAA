import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import raw from './data/restaurants.json'
import { hasType, isSpot, POI_TYPES, scoreOf, type Area, type Dataset, type Genre, type Place, type PoiType, type WithDistance } from './types'
import { haversineKm, walkMinutes } from './lib/geo'
import { isOpenOn } from './lib/trip'
import { MapView } from './components/MapView'
import { RestaurantCard } from './components/RestaurantCard'
import { Filters } from './components/Filters'
import { DEFAULT_FILTERS, type FilterState } from './lib/filters'
import { groupByGenre, sortPlaces } from './lib/sort'
import { GENRE_LABEL, LANDMARKS, POI_META } from './lib/labels'
import { fetchRoute, type LatLng } from './lib/route'
import { RoutePanel, type RouteState } from './components/RoutePanel'
import { transitUrl } from './lib/links'
import { QuickFilters } from './components/QuickFilters'
import { SortControl } from './components/SortControl'
import { BottomSheet, type Snap } from './components/BottomSheet'

const data = raw as Dataset
const AREA_ORDER: Area[] = ['near', 'tennoji', 'south', 'southwest', 'bay', 'namba', 'west', 'umeda', 'temma', 'east', 'usj', 'kyoto']

const GENRE_ORDER: Genre[] = ['meat', 'noodle', 'japanese', 'asian', 'western']

/** 브라우저 위치 (권한 요청). 실패하면 이유를 담아 reject */
function getPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('이 브라우저는 위치를 지원하지 않아요'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(new Error(e.code === e.PERMISSION_DENIED ? '위치 권한이 거부됐어요' : '현재 위치를 찾지 못했어요')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  })
}

function useIsDesktop(): boolean {
  const q = '(min-width: 900px)'
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const fn = () => setM(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return m
}

interface Props {
  /** 처음 열 때 고를 장소 (#/map?place=…) */
  initialPlace?: string | null
  /** 처음 열 때 켤 종류 필터 (#/map?type=…) */
  initialType?: PoiType | null
  onHome: () => void
}

/** 목록에서 카드가 정렬 바 아래로 바로 보이게 스크롤.
 *  scrollIntoView는 바텀시트 바깥까지 스크롤해 버려서, 목록 컨테이너만 직접 스크롤한다 */
function scrollToCard(id: string, smooth: boolean) {
  const card = document.getElementById(`card-${id}`)
  const box = card?.closest<HTMLElement>('.sheet-body, .panel')
  if (!card || !box) return
  const bar = box.querySelector<HTMLElement>('.sort-bar')?.offsetHeight ?? 0
  const top = card.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 8 - bar
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  box.scrollTo({ top, behavior: smooth && !reduce ? 'smooth' : 'auto' })
}

export function MapScreen({ initialPlace = null, initialType = null, onHome }: Props) {
  const { lodging } = data
  const isDesktop = useIsDesktop()
  const [filters, setFilters] = useState<FilterState>(() => ({ ...DEFAULT_FILTERS, type: initialType ?? 'all' }))
  const [selectedId, setSelectedId] = useState<string | null>(initialPlace)
  const [snap, setSnap] = useState<Snap>(initialPlace ? 'half' : 'peek')
  const [sheetH, setSheetH] = useState(176)
  const [showFilters, setShowFilters] = useState(false)
  const [recenterKey, setRecenterKey] = useState(0)
  const [fitKey, setFitKey] = useState(initialType ? 1 : 0)
  const [route, setRoute] = useState<RouteState | null>(null)
  const routeAbort = useRef<AbortController | null>(null)

  const all: WithDistance[] = useMemo(
    () =>
      ([...data.restaurants, ...data.spots] as Place[]).map((r) => {
        const km = haversineKm(lodging.lat, lodging.lng, r.lat, r.lng)
        return { ...r, distanceKm: km, walkMin: walkMinutes(km) } as WithDistance
      }),
    [lodging],
  )

  const places = useMemo(() => {
    const f = filters
    const list = all.filter((r) => {
      if (f.type !== 'all' && !hasType(r, f.type)) return false
      if (f.area !== 'all' && r.area !== f.area) return false
      if (f.genre !== 'all' && (isSpot(r) || r.genre !== f.genre)) return false
      if (f.rating === 'scored' && scoreOf(r) == null) return false
      if ((f.rating === '3.6' || f.rating === '3.8') && (scoreOf(r) ?? 0) < Number(f.rating)) return false
      if (f.walk !== 'all' && r.walkMin > Number(f.walk)) return false
      if (f.day !== 'all' && !isOpenOn(r.closedDates, f.day)) return false
      return true
    })
    return sortPlaces(list, f.sort, GENRE_ORDER, f.type)
  }, [all, filters])

  const activeFilterCount =
    (Object.keys(DEFAULT_FILTERS) as (keyof FilterState)[]).filter((k) => k !== 'sort' && filters[k] !== DEFAULT_FILTERS[k]).length

  // 필터로 사라진 곳은 선택 해제된 것으로 본다
  const activeId = selectedId && places.some((p) => p.id === selectedId) ? selectedId : null

  const quickCounts = useMemo(
    () => ({
      walk5: all.filter((p) => p.walkMin <= 5).length,
      walk10: all.filter((p) => p.walkMin <= 10).length,
      walk15: all.filter((p) => p.walkMin <= 15).length,
      ...(Object.fromEntries(POI_TYPES.map((t) => [t, all.filter((p) => hasType(p, t)).length])) as Record<PoiType, number>),
    }),
    [all],
  )
  const foodCount = data.restaurants.length

  const select = useCallback(
    (id: string, fromMap: boolean) => {
      setSelectedId((cur) => (cur === id && !fromMap ? null : id))
      if (!isDesktop && fromMap && snap === 'peek') setSnap('half')
      if (fromMap) {
        setTimeout(() => scrollToCard(id, true), 120)
      }
    },
    [isDesktop, snap],
  )

  const selectFromMap = useCallback((id: string) => select(id, true), [select])

  /** 대표 명소로 바로 이동: 지금 필터에 안 보이면 필터를 풀고 고른다 */
  const jumpTo = useCallback(
    (id: string) => {
      if (!places.some((p) => p.id === id)) setFilters(DEFAULT_FILTERS)
      setSelectedId(id)
      if (!isDesktop) setSnap('half')
      setTimeout(() => scrollToCard(id, false), 200)
    },
    [places, isDesktop],
  )

  // 딥링크로 장소를 받고 열렸으면 그 카드로 목록을 내린다
  const firstJump = useRef(initialPlace)
  useEffect(() => {
    if (firstJump.current) jumpTo(firstJump.current)
    firstJump.current = null
  }, [jumpTo])

  /** 지도 안 도보 경로: 버튼을 눌렀을 때만 라우터에 1번 묻는다 (이전 요청은 취소) */
  const startRoute = useCallback(
    async (id: string, from: 'lodging' | 'me' = 'lodging') => {
      const p = all.find((x) => x.id === id)
      if (!p) return
      routeAbort.current?.abort()
      const ac = new AbortController()
      routeAbort.current = ac
      const base: RouteState = { id, name: p.nameKo, from, status: 'loading', transitHref: transitUrl(lodging, p.lat, p.lng) }
      setRoute(base)
      setSelectedId(id)
      if (!isDesktop) setSnap('peek')
      let origin: LatLng = { lat: lodging.lat, lng: lodging.lng }
      let note: string | undefined
      if (from === 'me') {
        try {
          const me = await getPosition()
          if (haversineKm(me.lat, me.lng, p.lat, p.lng) > 20) {
            note = '현재 위치가 목적지에서 20km 넘게 떨어져 있어 숙소 출발 경로로 보여 드려요.'
            from = 'lodging'
          } else origin = me
        } catch (e) {
          note = `${(e as Error).message} — 숙소 출발 경로로 보여 드려요.`
          from = 'lodging'
        }
        if (ac.signal.aborted) return
        setRoute({ ...base, from, note })
      }
      try {
        const result = await fetchRoute(origin, { lat: p.lat, lng: p.lng }, ac.signal)
        if (ac.signal.aborted) return
        setRoute({ ...base, from, note, status: 'ok', result })
      } catch (e) {
        if (ac.signal.aborted) return
        const msg = (e as Error).name === 'TimeoutError' ? '응답 시간 초과' : (e as Error).message || '네트워크 오류'
        setRoute({ ...base, from, note, status: 'error', error: msg })
      }
    },
    [all, lodging, isDesktop],
  )

  const closeRoute = useCallback(() => {
    routeAbort.current?.abort()
    setRoute(null)
  }, [])

  const onRoute = useCallback((id: string) => (route?.id === id ? closeRoute() : void startRoute(id)), [route, closeRoute, startRoute])

  const card = (r: WithDistance) => (
    <li key={r.id}>
      <RestaurantCard r={r} lodging={lodging} selected={r.id === activeId} onSelect={(id) => select(id, false)} onRoute={onRoute} routeActive={route?.id === r.id} />
    </li>
  )

  const list = (
    <>
      <div className="sort-bar">
        <SortControl value={filters.sort} onChange={(sort) => setFilters((f) => ({ ...f, sort }))} />
        <QuickFilters
          value={filters}
          onChange={(v) => {
            setFilters(v)
            setFitKey((k) => k + 1) // 빠른 필터를 바꾸면 남은 곳이 모두 보이게 지도를 맞춘다
          }}
          counts={quickCounts}
        />
      </div>
      <p className="count" aria-live="polite">
        {places.length}곳 표시 중{' '}
        <span className="muted">
          / 맛집 {foodCount}
          {POI_TYPES.map((t) => ` · ${POI_META[t].label} ${quickCounts[t]}`).join('')}
        </span>
      </p>
      {places.length === 0 ? (
        <div className="empty">
          <p>조건에 맞는 곳이 없어요.</p>
          <button type="button" className="btn" onClick={() => setFilters(DEFAULT_FILTERS)}>필터 초기화</button>
        </div>
      ) : (
        <ul className="list">
          {filters.sort === 'category'
            ? groupByGenre(places, GENRE_ORDER, filters.type).flatMap((g) => [
                <li key={`h-${g.key}`} className={`group-header ${g.key in POI_META ? `group-spot group-${g.key}` : ''}`}>
                  <h2>
                    {g.key in POI_META ? `${POI_META[g.key as PoiType].mark} ${POI_META[g.key as PoiType].label}` : GENRE_LABEL[g.key as Genre]}{' '}
                    <span className="muted">{g.items.length}곳</span>
                  </h2>
                </li>,
                ...g.items.map(card),
              ])
            : places.map(card)}
        </ul>
      )}
      <footer className="notes">
        <p>
          맛집은 예약이 되고 6명이 함께 앉을 수 있는 곳(개별실·단체석·6인 테이블·좌식)만 모았습니다. 점수·좌석·영업시간은 2026년 11월 타베로그 기준이고,
          점수가 보이지 않던 곳은 비워 두었습니다. 예약 전에 가게에 한 번 더 확인해 주세요.
        </p>
        <p>
          ★ 대표 명소(후시미 이나리·USJ)는 카드에 전철·택시 가는 법과 요금을 정리했어요. 전철 시각은 평일 아침 기준 예시, 택시 요금은 오사카 택시 요금표로 계산한
          어림값입니다.
        </p>
        <p>
          24 편의점·+ 약국은 숙소에서 걸어서 가까운 5곳(길 따라 잰 거리), D 돈키호테와 % 할인·잡화점(다마데·업무 슈퍼·핸즈·로프트)은 숙소에서 5km 안만 넣었어요.
          면세 드럭스토어·돈키호테처럼 한 곳이 여러 종류에 해당하면 각 필터에 함께 나와요.
        </p>
        <p>✦ 특이한 장소는 식당이 아닌 볼거리로, 공식 사이트 등에서 시간·요금·휴무를 확인했습니다. 사진 촬영 에티켓이 적힌 곳은 꼭 지켜 주세요.</p>
        <p>
          ♪ 라이브 바는 공식 사이트·스케줄 블로그에서 11/13~17 공연 일정을 확인했고, ◆ 주류 상점은 타베로그·공식 사이트, ¥ 면세점은 각 점포 공식 페이지나 관광청
          면세점 사이트(TAXFREESHOPS.JP)에서 면세 대응을 확인했습니다. 2026년 11월부터 면세는 &lsquo;먼저 세금 내고 출국 때 환급&rsquo; 방식이에요 (면세점 카드에 안내).
        </p>
        <p>&lsquo;길찾기&rsquo;는 FOSSGIS의 무료 OSRM 도보 경로(OpenStreetMap 기반)를 지도에 그려 주고, 실패하면 구글 지도(전철·대중교통) 링크를 쓰세요.</p>
        <p>거리는 숙소에서의 직선거리, 도보 시간은 길이 1.3배 돌아간다고 보고 분속 80m로 계산한 추정치입니다 (도보 10분 ≈ 직선 615m).</p>
      </footer>
    </>
  )

  const mapButtons = (
    <div className="map-fabs" style={isDesktop ? undefined : { bottom: `calc(${Math.min(sheetH, 420)}px + 12px)` }}>
      <button type="button" className="fab" onClick={() => setRecenterKey((k) => k + 1)} aria-label="숙소로 지도 이동">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3z" /></svg>
        <span>숙소</span>
      </button>
      <button type="button" className="fab" onClick={() => setFitKey((k) => k + 1)} aria-label="표시 중인 맛집 전체 보기">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z" /></svg>
        <span>전체</span>
      </button>
      {LANDMARKS.map((l) => (
        <button key={l.id} type="button" className="fab fab-landmark" onClick={() => jumpTo(l.id)} aria-label={`${l.short} 위치로 지도 이동`}>
          <span aria-hidden="true" className="fab-star">★</span>
          <span>{l.short}</span>
        </button>
      ))}
    </div>
  )

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="brand brand-btn" onClick={onHome} aria-label="메인 화면으로">
          <span className="logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z" /></svg>
          </span>
          <span>
            <span className="brand-name">OSAKAAA</span>
            <span className="brand-sub">메인으로 · 숙소 기준 지도 11/13–11/17</span>
          </span>
        </button>
        <p className="home-addr" lang="ja">숙소 {lodging.address}</p>
      </header>
      <main className="layout">
        {isDesktop && (
          <aside className="panel" aria-label="맛집 목록과 필터">
            <h1 className="panel-title">숙소 근처 맛집 (6명 OK)<br /><span className="panel-sub">+ 명소 · 볼거리 · 라이브 바 · 술 · 면세점 · 편의점 · 약국 · 돈키호테</span></h1>
            <Filters value={filters} onChange={setFilters} areas={AREA_ORDER} genres={GENRE_ORDER} />
            {list}
          </aside>
        )}
        <div className="map-area">
          <MapView
            lodging={lodging}
            places={places}
            selectedId={activeId}
            onSelect={selectFromMap}
            bottomInset={isDesktop ? 0 : Math.min(sheetH, 420)}
            recenterKey={recenterKey}
            fitKey={fitKey}
            route={route?.status === 'ok' && route.result ? { key: `${route.id}-${route.from}`, coords: route.result.coords } : null}
          />
          {mapButtons}
          {route && (
            <RoutePanel
              route={route}
              geoAvailable={'geolocation' in navigator}
              onFrom={(from) => void startRoute(route.id, from)}
              onClose={closeRoute}
            />
          )}
        </div>
        {!isDesktop && (
          <BottomSheet
            snap={snap}
            onSnap={setSnap}
            onVisibleHeight={setSheetH}
            header={
              <div className="sheet-bar">
                <h1 className="sheet-title">6명 OK 맛집·장소 <span className="muted">{places.length}곳</span></h1>
                <button
                  type="button"
                  className={`btn btn-sm ${showFilters ? 'btn-primary' : ''}`}
                  aria-expanded={showFilters}
                  aria-controls="m-filters"
                  onClick={() => {
                    setShowFilters((v) => !v)
                    if (snap === 'peek') setSnap('half')
                    document.querySelector('.sheet-body')?.scrollTo({ top: 0 })
                  }}
                >
                  필터{activeFilterCount > 0 ? ` ${activeFilterCount}` : ''}
                </button>
              </div>
            }
          >
            {showFilters && (
              <div id="m-filters">
                <Filters value={filters} onChange={setFilters} areas={AREA_ORDER} genres={GENRE_ORDER} />
              </div>
            )}
            {list}
          </BottomSheet>
        )}
      </main>
    </div>
  )
}
