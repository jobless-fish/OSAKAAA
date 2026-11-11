import { POI_TYPES, type PoiType } from '../types'

/** 해시 주소: #/ (메인) · #/map · #/map?place=장소id · #/map?type=종류 */
export interface Route {
  view: 'home' | 'map'
  place: string | null
  type: PoiType | null
}

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '')
  const [path, query = ''] = h.split('?')
  if (!/^\/?map\/?$/.test(path)) return { view: 'home', place: null, type: null }
  const q = new URLSearchParams(query)
  const t = q.get('type')
  return { view: 'map', place: q.get('place'), type: t && (POI_TYPES as readonly string[]).includes(t) ? (t as PoiType) : null }
}
