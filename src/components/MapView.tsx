import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Lodging, WithDistance } from '../types'

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

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

function starsHtml(score: number | null): string {
  if (score == null) return '<span class="mk-noscore">점수 미확인</span>'
  const pct = Math.max(0, Math.min(100, (score / 5) * 100))
  return `<span class="mk-stars" aria-hidden="true"><span class="mk-track">★★★★★<span class="mk-fill" style="width:${pct}%">★★★★★</span></span><b>${score.toFixed(2)}</b></span>`
}

function cardIcon(r: WithDistance, selected: boolean): L.DivIcon {
  const html = `<div class="mk ${selected ? 'mk-sel' : ''} ${r.userFound ? 'mk-user' : ''}">
    <span class="mk-name">${esc(r.nameKo)}</span>
    <span class="mk-img"><img src="${esc(r.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('mk-img-fail');this.remove()"/></span>
    ${starsHtml(r.tabelogScore)}
  </div>`
  return L.divIcon({ html, className: 'mk-wrap', iconSize: [112, 112], iconAnchor: [56, 112] })
}

function dotIcon(r: WithDistance, selected: boolean): L.DivIcon {
  const html = `<div class="dot ${selected ? 'dot-sel' : ''} ${r.userFound ? 'dot-user' : ''}"><i></i><span>${esc(r.nameKo)}</span></div>`
  return L.divIcon({ html, className: 'dot-wrap', iconSize: [24, 24], iconAnchor: [12, 12] })
}

const lodgingIcon = L.divIcon({
  html: `<div class="home-pin" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3z"/></svg></div><span class="home-label">숙소</span>`,
  className: 'home-wrap',
  iconSize: [44, 56],
  iconAnchor: [22, 44],
})

function Controller({ lodging, places, selectedId, bottomInset, recenterKey, fitKey, onZoom }: Omit<Props, 'onSelect'> & { onZoom: (z: number) => void }) {
  const map = useMap()
  useMapEvents({ zoomend: () => onZoom(map.getZoom()) })

  useEffect(() => {
    if (!selectedId) return
    const p = places.find((x) => x.id === selectedId)
    if (!p) return
    const zoom = Math.max(map.getZoom(), 15)
    const pt = map.project([p.lat, p.lng], zoom).add([0, bottomInset / 2])
    map.flyTo(map.unproject(pt, zoom), zoom, { duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  useEffect(() => {
    if (recenterKey === 0) return
    map.flyTo([lodging.lat, lodging.lng], 14, { duration: 0.6 })
  }, [recenterKey, lodging, map])

  useEffect(() => {
    if (fitKey === 0 || places.length === 0) return
    // 교외(이바라키)까지 넣으면 너무 멀어지므로, 시내 장소가 있으면 시내만 맞춘다
    const city = places.filter((p) => p.area !== 'suburb')
    const target = city.length > 0 ? city : places
    const b = L.latLngBounds(target.map((p) => [p.lat, p.lng] as [number, number]))
    b.extend([lodging.lat, lodging.lng])
    map.flyToBounds(b, { paddingTopLeft: [40, 60], paddingBottomRight: [40, 40 + bottomInset], duration: 0.6, maxZoom: 15 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])

  return null
}

export function MapView(props: Props) {
  const { lodging, places, selectedId, onSelect } = props
  const [zoom, setZoom] = useState(12.5)
  const compact = zoom < 14
  const icons = useMemo(
    () =>
      new Map(
        places.map((p) => {
          const sel = p.id === selectedId
          return [p.id, compact && !sel ? dotIcon(p, sel) : cardIcon(p, sel)]
        }),
      ),
    [places, selectedId, compact],
  )

  return (
    <MapContainer
      className="map"
      center={[lodging.lat, lodging.lng]}
      zoom={12.5}
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
      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={icons.get(p.id)!}
          title={p.nameKo}
          alt={p.nameKo}
          zIndexOffset={p.id === selectedId ? 1000 : p.userFound ? 100 : 0}
          eventHandlers={{ click: () => onSelect(p.id) }}
        />
      ))}
      <Controller {...props} onZoom={setZoom} />
    </MapContainer>
  )
}
