import { useCallback, useEffect, useMemo, useState } from 'react'
import raw from './data/restaurants.json'
import type { Area, Dataset, Genre, WithDistance } from './types'
import { haversineKm, walkMinutes } from './lib/geo'
import { isOpenOn } from './lib/trip'
import { MapView } from './components/MapView'
import { RestaurantCard } from './components/RestaurantCard'
import { Filters } from './components/Filters'
import { DEFAULT_FILTERS, type FilterState } from './lib/filters'
import { BottomSheet, type Snap } from './components/BottomSheet'

const data = raw as Dataset
const AREA_ORDER: Area[] = ['umeda', 'temma', 'namba', 'west', 'tennoji', 'east', 'suburb']
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
      data.restaurants.map((r) => {
        const km = haversineKm(lodging.lat, lodging.lng, r.lat, r.lng)
        return { ...r, distanceKm: km, walkMin: walkMinutes(km) }
      }),
    [lodging],
  )

  const places = useMemo(() => {
    const f = filters
    const list = all.filter((r) => {
      if (f.type !== 'all' && r.type !== f.type) return false
      if (f.area !== 'all' && r.area !== f.area) return false
      if (f.genre !== 'all' && r.genre !== f.genre) return false
      if (f.rating === 'scored' && r.tabelogScore == null) return false
      if ((f.rating === '3.4' || f.rating === '3.5') && (r.tabelogScore ?? 0) < Number(f.rating)) return false
      if (f.day !== 'all' && !isOpenOn(r.closedDates, f.day)) return false
      if (f.groupOnly && r.group !== 'ok') return false
      if (f.userOnly && !r.userFound) return false
      return true
    })
    const sorted = [...list]
    if (f.sort === 'distance') sorted.sort((a, b) => a.distanceKm - b.distanceKm)
    else if (f.sort === 'score') sorted.sort((a, b) => (b.tabelogScore ?? -1) - (a.tabelogScore ?? -1) || a.distanceKm - b.distanceKm)
    else sorted.sort((a, b) => a.nameKo.localeCompare(b.nameKo, 'ko'))
    return sorted
  }, [all, filters])

  const activeFilterCount =
    (Object.keys(DEFAULT_FILTERS) as (keyof FilterState)[]).filter((k) => k !== 'sort' && filters[k] !== DEFAULT_FILTERS[k]).length

  // 필터로 사라진 곳은 선택 해제된 것으로 본다
  const activeId = selectedId && places.some((p) => p.id === selectedId) ? selectedId : null

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

  const list = (
    <>
      <p className="count" aria-live="polite">
        {places.length}곳 표시 중 <span className="muted">/ 전체 {all.length}곳</span>
      </p>
      {places.length === 0 ? (
        <div className="empty">
          <p>조건에 맞는 곳이 없어요.</p>
          <button type="button" className="btn" onClick={() => setFilters(DEFAULT_FILTERS)}>필터 초기화</button>
        </div>
      ) : (
        <ul className="list">
          {places.map((r) => (
            <li key={r.id}>
              <RestaurantCard r={r} lodging={lodging} selected={r.id === activeId} onSelect={(id) => select(id, false)} />
            </li>
          ))}
        </ul>
      )}
      <footer className="notes">
        <p>
          인스타그램 <a href="https://www.instagram.com/aito_osaka/" target="_blank" rel="noopener noreferrer">@aito_osaka</a>와
          같은 크리에이터의 Lemon8에서 확인한 25곳입니다. 점수·영업시간은 2026년 11월 타베로그 기준이고, 점수가 보이지 않던 곳은 비워 두었습니다.
        </p>
        <p>거리는 숙소에서의 직선거리, 도보 시간은 길이 1.3배 돌아간다고 보고 분속 80m로 계산한 추정치입니다.</p>
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
            <h1 className="panel-title">숙소 근처 맛집<br />aito_osaka 추천</h1>
            <Filters value={filters} onChange={setFilters} areas={AREA_ORDER} genres={GENRE_ORDER} />
            {list}
          </aside>
        )}
        <div className="map-area">
          <MapView
            lodging={lodging}
            places={places}
            selectedId={activeId}
            onSelect={(id) => select(id, true)}
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
                <h1 className="sheet-title">숙소 근처 맛집 <span className="muted">{places.length}곳</span></h1>
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
