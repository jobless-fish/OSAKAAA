import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import { isSpot, type Lodging, type PoiType, type WithDistance } from '../types'
import { POI_META } from '../lib/labels'
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
  /** 지도에 그릴 도보 경로 (key가 바뀔 때만 화면을 경로에 맞춘다) */
  route: { key: string; coords: [number, number][] } | null
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
  const img = (src: string) =>
    `<img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('mk-img-fail');this.remove()"/>`
  const media = isSpot(p)
    ? `<span class="mk-img mk-spot-img">${p.image ? img(p.image) : `<span>${p.icon}</span>`}</span><span class="mk-spot-kind">${POI_META[p.type].mark} ${esc(p.spotKind)}</span>`
    : `<span class="mk-img">${img(p.image)}</span>${starsHtml(p.tabelogScore)}`
  const html = `<div class="mk ${isSpot(p) ? `mk-spot mk-${p.type}` : ''} ${selected ? 'mk-sel' : ''}">
    <span class="mk-name">${esc(p.nameKo)}</span>${media}
  </div>`
  return L.divIcon({ html, className: 'mk-wrap', iconSize: [112, 112], iconAnchor: [56, 112] })
}

function dotIcon(p: WithDistance, selected: boolean, bare = false): L.DivIcon {
  const spot = isSpot(p)
  const label = bare ? '' : `<span>${esc(p.nameKo)}</span>`
  const html = `<div class="dot ${spot ? `dot-spot dot-${p.type}` : ''} ${selected ? 'dot-sel' : ''}"><i>${spot ? p.icon : ''}</i>${label}</div>`
  return L.divIcon({ html, className: 'dot-wrap', iconSize: [24, 24], iconAnchor: [12, 12] })
}

function clusterIcon(c: L.MarkerCluster): L.DivIcon {
  const ms = c.getAllChildMarkers()
  const kinds = ms.map((m) => (m.options as { poi?: PoiType | null }).poi ?? null)
  const n = ms.length
  const pois = kinds.filter(Boolean).length
  const first = kinds[0]
  // 모두 같은 종류면 그 색, 식당이 아닌 곳이 섞여 있으면 섞임 표시
  const kind = pois === n && kinds.every((k) => k === first) ? `cl-spot cl-${first}` : pois > 0 ? 'cl-mixed' : ''
  const size = n >= 20 ? 52 : n >= 8 ? 46 : 40
  return L.divIcon({
    html: `<div class="cl ${kind}" style="width:${size}px;height:${size}px"><b>${n}</b></div>`,
    className: 'cl-wrap',
    iconSize: [size, size],
  })
}

/** 대표 명소(후시미 이나리·USJ): 어느 줌에서든 크게 보이는 전용 마커 */
function landmarkIcon(p: WithDistance, selected: boolean): L.DivIcon {
  const kind = isSpot(p) ? p.spotKind : ''
  const html = `<div class="lm ${selected ? 'lm-sel' : ''}"><span class="lm-badge" aria-hidden="true">${isSpot(p) ? p.icon : ''}</span><span class="lm-text"><b>${esc(p.nameKo)}</b><small>★ ${esc(kind)}</small></span></div><i class="lm-tip" aria-hidden="true"></i>`
  return L.divIcon({ html, className: 'lm-wrap', iconSize: [280, 70], iconAnchor: [140, 70] })
}

function LandmarkLayer({ places, selectedId, onSelect }: Pick<Props, 'places' | 'selectedId' | 'onSelect'>) {
  const map = useMap()
  useEffect(() => {
    const ms = places.map((p) =>
      L.marker([p.lat, p.lng], { icon: landmarkIcon(p, p.id === selectedId), title: p.nameKo, alt: p.nameKo, zIndexOffset: 1500, keyboard: true })
        .on('click', () => onSelect(p.id))
        .addTo(map),
    )
    return () => ms.forEach((m) => m.remove())
  }, [places, selectedId, onSelect, map])
  return null
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
        zIndexOffset: sel ? 1000 : cards.has(p.id) ? 200 : isSpot(p) ? 100 : 0,
        keyboard: true,
        poi: isSpot(p) ? p.type : null,
      } as L.MarkerOptions & { poi: PoiType | null })
      m.on('click', () => onSelect(p.id))
      markers.current.set(p.id, m)
      return m
    })
    g.addLayers(list)
    // 카드 줌에서는 줌이 바뀔 때마다 겹침을 다시 계산한다
  }, [places, selectedId, compact, onSelect, map, layoutZoom])

  return null
}

/** 도보 경로 선 (흰 테두리 + 파란 선) 과 출발점. 새 경로가 오면 경로 전체가 보이게 맞춘다 */
function RouteLayer({ route, bottomInset }: Pick<Props, 'route' | 'bottomInset'>) {
  const map = useMap()
  const key = route?.key
  useEffect(() => {
    if (!route) return
    const casing = L.polyline(route.coords, { color: '#ffffff', weight: 9, opacity: 0.9, interactive: false })
    const line = L.polyline(route.coords, { color: '#2563eb', weight: 5, opacity: 0.95, dashArray: '1 9', lineCap: 'round', interactive: false })
    const solid = L.polyline(route.coords, { color: '#2563eb', weight: 5, opacity: 0.55, interactive: false })
    const start = L.circleMarker(route.coords[0], { radius: 7, color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1, interactive: false })
    const grp = L.layerGroup([casing, solid, line, start]).addTo(map)
    map.flyToBounds(L.latLngBounds(route.coords), { paddingTopLeft: [40, 150], paddingBottomRight: [40, 40 + bottomInset], maxZoom: 17, duration: 0.6 })
    return () => {
      grp.remove()
    }
    // 경로가 바뀔 때만 다시 그린다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])
  return null
}

function Controller({ lodging, places, selectedId, bottomInset, recenterKey, fitKey, onZoom }: Omit<Props, 'onSelect' | 'route'> & { onZoom: (z: number) => void }) {
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
    // 교토·USJ 같은 먼 대표 명소까지 맞추면 숙소 주변이 너무 작아지므로, 명소만 남았을 때만 포함한다
    const near = places.filter((p) => p.type !== 'landmark')
    const b = L.latLngBounds((near.length ? near : places).map((p) => [p.lat, p.lng] as [number, number]))
    b.extend([lodging.lat, lodging.lng])
    map.flyToBounds(b, { paddingTopLeft: [40, 60], paddingBottomRight: [40, 40 + bottomInset], duration: 0.6, maxZoom: CARD_ZOOM })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])

  return null
}

export function MapView(props: Props) {
  const { lodging, places, selectedId, onSelect } = props
  const [zoom, setZoom] = useState(INITIAL_ZOOM)
  const landmarks = useMemo(() => places.filter((p) => p.type === 'landmark'), [places])
  const others = useMemo(() => places.filter((p) => p.type !== 'landmark'), [places])

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
      <ClusterLayer places={others} selectedId={selectedId} onSelect={onSelect} zoom={zoom} />
      <LandmarkLayer places={landmarks} selectedId={selectedId} onSelect={onSelect} />
      <RouteLayer route={props.route} bottomInset={props.bottomInset} />
      <Controller {...props} onZoom={setZoom} />
    </MapContainer>
  )
}
