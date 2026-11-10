import { useCallback, useEffect, useMemo, useState } from 'react'
import raw from './data/restaurants.json'
import { scoreOf, type Area, type Dataset, type Genre, type Place, type WithDistance } from './types'
import { haversineKm, walkMinutes } from './lib/geo'
import { isOpenOn } from './lib/trip'
import { MapView } from './components/MapView'
import { RestaurantCard } from './components/RestaurantCard'
import { Filters } from './components/Filters'
import { DEFAULT_FILTERS, type FilterState } from './lib/filters'
import { groupByGenre, sortPlaces } from './lib/sort'
import { GENRE_LABEL, SPOT_LABEL } from './lib/labels'
import { QuickFilters } from './components/QuickFilters'
import { SortControl } from './components/SortControl'
import { BottomSheet, type Snap } from './components/BottomSheet'

const data = raw as Dataset
const AREA_ORDER: Area[] = ['near', 'tennoji', 'south', 'southwest', 'bay', 'namba', 'west', 'umeda', 'temma', 'east']
const GENRE_ORDER: Genre[] = ['meat', 'noodle', 'japanese', 'asian', 'western']

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

export default function App() {
  const { lodging } = data
  const isDesktop = useIsDesktop()
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [snap, setSnap] = useState<Snap>('peek')
  const [sheetH, setSheetH] = useState(176)
  const [showFilters, setShowFilters] = useState(false)
  const [recenterKey, setRecenterKey] = useState(0)
  const [fitKey, setFitKey] = useState(0)

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
      if (f.type !== 'all' && r.type !== f.type) return false
      if (f.area !== 'all' && r.area !== f.area) return false
      if (f.genre !== 'all' && (r.type === 'spot' || r.genre !== f.genre)) return false
      if (f.rating === 'scored' && scoreOf(r) == null) return false
      if ((f.rating === '3.6' || f.rating === '3.8') && (scoreOf(r) ?? 0) < Number(f.rating)) return false
      if (f.walk !== 'all' && r.walkMin > Number(f.walk)) return false
      if (f.day !== 'all' && !isOpenOn(r.closedDates, f.day)) return false
      return true
    })
    return sortPlaces(list, f.sort, GENRE_ORDER)
  }, [all, filters])

  const activeFilterCount =
    (Object.keys(DEFAULT_FILTERS) as (keyof FilterState)[]).filter((k) => k !== 'sort' && filters[k] !== DEFAULT_FILTERS[k]).length

  // 필터로 사라진 곳은 선택 해제된 것으로 본다
  const activeId = selectedId && places.some((p) => p.id === selectedId) ? selectedId : null

  const quickCounts = useMemo(
    () => ({
      walk10: all.filter((p) => p.walkMin <= 10).length,
      walk15: all.filter((p) => p.walkMin <= 15).length,
      spots: all.filter((p) => p.type === 'spot').length,
    }),
    [all],
  )
  const foodCount = data.restaurants.length

  const select = useCallback(
    (id: string, fromMap: boolean) => {
      setSelectedId((cur) => (cur === id && !fromMap ? null : id))
      if (!isDesktop && fromMap && snap === 'peek') setSnap('half')
      if (fromMap) {
        // scrollIntoView는 바텀시트 바깥까지 스크롤해 버려서, 목록 컨테이너만 직접 스크롤한다
        setTimeout(() => {
          const card = document.getElementById(`card-${id}`)
          const box = card?.closest<HTMLElement>('.sheet-body, .panel')
          if (!card || !box) return
          const top = card.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 8
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          box.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
        }, 120)
      }
    },
    [isDesktop, snap],
  )

  const selectFromMap = useCallback((id: string) => select(id, true), [select])

  const card = (r: WithDistance) => (
    <li key={r.id}>
      <RestaurantCard r={r} lodging={lodging} selected={r.id === activeId} onSelect={(id) => select(id, false)} />
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
        {places.length}곳 표시 중 <span className="muted">/ 맛집 {foodCount} · {SPOT_LABEL} {all.length - foodCount}</span>
      </p>
      {places.length === 0 ? (
        <div className="empty">
          <p>조건에 맞는 곳이 없어요.</p>
          <button type="button" className="btn" onClick={() => setFilters(DEFAULT_FILTERS)}>필터 초기화</button>
        </div>
      ) : (
        <ul className="list">
          {filters.sort === 'category'
            ? groupByGenre(places, GENRE_ORDER).flatMap((g) => [
                <li key={`h-${g.key}`} className={`group-header ${g.key === 'spot' ? 'group-spot' : ''}`}>
                  <h2>{g.key === 'spot' ? `✦ ${SPOT_LABEL}` : GENRE_LABEL[g.key]} <span className="muted">{g.items.length}곳</span></h2>
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
        <p>✦ {SPOT_LABEL}은 식당이 아닌 볼거리로, 공식 사이트 등에서 시간·요금·휴무를 확인했습니다. 사진 촬영 에티켓이 적힌 곳은 꼭 지켜 주세요.</p>
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
    </div>
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">O</span>
          <div>
            <p className="brand-name">OSAKAAA</p>
            <p className="brand-sub">숙소 기준 맛집 지도 · 11/13–11/17</p>
          </div>
        </div>
        <p className="home-addr" lang="ja">숙소 {lodging.address}</p>
      </header>
      <main className="layout">
        {isDesktop && (
          <aside className="panel" aria-label="맛집 목록과 필터">
            <h1 className="panel-title">숙소 근처 맛집 (6명 OK)<br /><span className="panel-sub">+ {SPOT_LABEL}</span></h1>
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
          />
          {mapButtons}
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
