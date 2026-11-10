import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { Lodging, WithDistance } from '../types'
import { pickCards } from '../lib/collide'

interface Props {
  lodging: Lodging
  places: WithDistance[]
  selectedId: string | null
  onSelect: (id: string) => void
  /** 모바일 바텀시트가 가리는 하단 높이(px). 선택한 곳을 그 위쪽에 보이게 한다. */
  bottomInset: number
  recenterKey: number
  fitKey: number
}

/** 이 줌부터 묶음을 풀고 사진 카드 마커를 보여 준다 */
const CARD_ZOOM = 15
/** 첫 화면: 숙소 주변 사방 4~5km가 한눈에 보이게 (모바일은 화면이 좁아 한 단계 넓게) */
const INITIAL_ZOOM = typeof window !== 'undefined' && window.innerWidth < 900 ? 12.5 : 13

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

function starsHtml(score: number | null): string {
  if (score == null) return '<span class="mk-noscore">점수 미확인</span>'
  const pct = Math.max(0, Math.min(100, (score / 5) * 100))
  return `<span class="mk-stars" aria-hidden="true"><span class="mk-track">★★★★★<span class="mk-fill" style="width:${pct}%">★★★★★</span></span><b>${score.toFixed(2)}</b></span>`
}

function cardIcon(p: WithDistance, selected: boolean): L.DivIcon {
  const media =
    p.type === 'spot'
      ? `<span class="mk-img mk-spot-img"><span>${p.icon}</span></span><span class="mk-spot-kind">✦ ${esc(p.spotKind)}</span>`
      : `<span class="mk-img"><img src="${esc(p.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('mk-img-fail');this.remove()"/></span>${starsHtml(p.tabelogScore)}`
  const html = `<div class="mk ${p.type === 'spot' ? 'mk-spot' : ''} ${selected ? 'mk-sel' : ''}">
    <span class="mk-name">${esc(p.nameKo)}</span>${media}
  </div>`
  return L.divIcon({ html, className: 'mk-wrap', iconSize: [112, 112], iconAnchor: [56, 112] })
}

function dotIcon(p: WithDistance, selected: boolean, bare = false): L.DivIcon {
  const spot = p.type === 'spot'
  const label = bare ? '' : `<span>${esc(p.nameKo)}</span>`
  const html = `<div class="dot ${spot ? 'dot-spot' : ''} ${selected ? 'dot-sel' : ''}"><i>${spot ? p.icon : ''}</i>${label}</div>`
  return L.divIcon({ html, className: 'dot-wrap', iconSize: [24, 24], iconAnchor: [12, 12] })
}

function clusterIcon(c: L.MarkerCluster): L.DivIcon {
  const ms = c.getAllChildMarkers()
  const spots = ms.filter((m) => (m.options as { spot?: boolean }).spot).length
  const n = ms.length
  const kind = spots === n ? 'cl-spot' : spots > 0 ? 'cl-mixed' : ''
  const size = n >= 20 ? 52 : n >= 8 ? 46 : 40
  return L.divIcon({
    html: `<div class="cl ${kind}" style="width:${size}px;height:${size}px"><b>${n}</b></div>`,
    className: 'cl-wrap',
    iconSize: [size, size],
  })
}

const lodgingIcon = L.divIcon({
  html: `<div class="home-pin" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3z"/></svg></div><span class="home-label">숙소</span>`,
  className: 'home-wrap',
  iconSize: [44, 56],
  iconAnchor: [22, 44],
})

/** 마커 묶음(클러스터) 레이어. 줌이 낮으면 가까운 곳끼리 숫자 원으로 묶고, CARD_ZOOM부터는 하나씩 사진 카드로 보인다. */
function ClusterLayer({ places, selectedId, onSelect, zoom }: Pick<Props, 'places' | 'selectedId' | 'onSelect'> & { zoom: number }) {
  const map = useMap()
  const group = useRef<L.MarkerClusterGroup | null>(null)
  const markers = useRef(new Map<string, L.Marker>())
  const compact = zoom < CARD_ZOOM
  /** 카드 줌에서만 의미 있는 줌 값 (점 모드에서는 줌이 바뀌어도 다시 그리지 않음) */
  const layoutZoom = compact ? -1 : zoom

  useEffect(() => {
    const g = L.markerClusterGroup({
      disableClusteringAtZoom: CARD_ZOOM,
      maxClusterRadius: (z) => (z >= 14 ? 36 : 52),
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      chunkedLoading: true,
      iconCreateFunction: clusterIcon,
    })
    group.current = g
    map.addLayer(g)
    return () => {
      map.removeLayer(g)
      group.current = null
    }
  }, [map])

  useEffect(() => {
    const g = group.current
    if (!g) return
    g.clearLayers()
    markers.current.clear()
    const cards = layoutZoom < 0 ? new Set<string>() : pickCards(places, selectedId, (p) => map.project([p.lat, p.lng], layoutZoom))
    const list = places.map((p) => {
      const sel = p.id === selectedId
      const icon = sel || cards.has(p.id) ? cardIcon(p, sel) : dotIcon(p, sel, !compact)
      const m = L.marker([p.lat, p.lng], {
        icon,
        title: p.nameKo,
        alt: p.nameKo,
        zIndexOffset: sel ? 1000 : cards.has(p.id) ? 200 : p.type === 'spot' ? 100 : 0,
        keyboard: true,
        spot: p.type === 'spot',
      } as L.MarkerOptions & { spot: boolean })
      m.on('click', () => onSelect(p.id))
      markers.current.set(p.id, m)
      return m
    })
    g.addLayers(list)
    // 카드 줌에서는 줌이 바뀔 때마다 겹침을 다시 계산한다
  }, [places, selectedId, compact, onSelect, map, layoutZoom])

  return null
}

function Controller({ lodging, places, selectedId, bottomInset, recenterKey, fitKey, onZoom }: Omit<Props, 'onSelect'> & { onZoom: (z: number) => void }) {
  const map = useMap()
  useMapEvents({ zoomend: () => onZoom(map.getZoom()) })

  // 첫 화면에서 바텀시트에 가려지는 만큼 지도를 내려, 숙소가 보이는 영역 한가운데 오게 한다
  useEffect(() => {
    if (bottomInset > 0) map.panBy([0, bottomInset / 2], { animate: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedId) return
    const p = places.find((x) => x.id === selectedId)
    if (!p) return
    const zoom = Math.max(map.getZoom(), CARD_ZOOM)
    const pt = map.project([p.lat, p.lng], zoom).add([0, bottomInset / 2])
    map.flyTo(map.unproject(pt, zoom), zoom, { duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  useEffect(() => {
    if (recenterKey === 0) return
    map.flyTo([lodging.lat, lodging.lng], CARD_ZOOM, { duration: 0.6 })
  }, [recenterKey, lodging, map])

  useEffect(() => {
    if (fitKey === 0 || places.length === 0) return
    const b = L.latLngBounds(places.map((p) => [p.lat, p.lng] as [number, number]))
    b.extend([lodging.lat, lodging.lng])
    map.flyToBounds(b, { paddingTopLeft: [40, 60], paddingBottomRight: [40, 40 + bottomInset], duration: 0.6, maxZoom: CARD_ZOOM })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])

  return null
}

export function MapView(props: Props) {
  const { lodging, places, selectedId, onSelect } = props
  const [zoom, setZoom] = useState(INITIAL_ZOOM)

  return (
    <MapContainer
      className={`map ${zoom < 13.5 ? 'map-far' : ''}`}
      center={[lodging.lat, lodging.lng]}
      zoom={INITIAL_ZOOM}
      zoomSnap={0.5}
      zoomControl={false}
      attributionControl
      preferCanvas={false}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 기여자'
        maxZoom={19}
      />
      <Marker position={[lodging.lat, lodging.lng]} icon={lodgingIcon} zIndexOffset={2000} title="숙소" alt="숙소" keyboard={false} />
      <ClusterLayer places={places} selectedId={selectedId} onSelect={onSelect} zoom={zoom} />
      <Controller {...props} onZoom={setZoom} />
    </MapContainer>
  )
}
