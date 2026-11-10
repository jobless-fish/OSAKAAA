/**
 * 도보 경로: FOSSGIS가 운영하는 무료 OSRM 서버(routing.openstreetmap.de, 키 불필요, CORS 허용)를 쓴다.
 * 이용 정책: 출처 표시, 과도한 요청 금지(최대 초당 1회). 그래서 버튼을 눌렀을 때만 1번 요청하고,
 * 직전 요청과 1초 이상 간격을 두며, 같은 경로는 다시 묻지 않고 기억해 둔 결과를 쓴다.
 */
export const OSRM_FOOT = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'

export interface LatLng {
  lat: number
  lng: number
}

export interface RouteResult {
  /** 경로 좌표 [lat, lng] */
  coords: [number, number][]
  /** 미터 */
  distance: number
  /** 초 (라우터가 계산한 도보 시간) */
  duration: number
}

const r6 = (n: number) => n.toFixed(6)

export function routeUrl(from: LatLng, to: LatLng): string {
  return `${OSRM_FOOT}/${r6(from.lng)},${r6(from.lat)};${r6(to.lng)},${r6(to.lat)}?overview=full&geometries=geojson`
}

/** OSRM 응답 JSON → 경로. 형식이 다르거나 경로가 없으면 예외 */
export function parseRoute(json: unknown): RouteResult {
  const j = json as { code?: string; routes?: { distance: number; duration: number; geometry?: { coordinates?: [number, number][] } }[] }
  const r = j?.routes?.[0]
  const c = r?.geometry?.coordinates
  if (j?.code !== 'Ok' || !r || !Array.isArray(c) || c.length < 2) throw new Error(`경로 없음 (${j?.code ?? '형식 오류'})`)
  return { coords: c.map(([lng, lat]) => [lat, lng] as [number, number]), distance: r.distance, duration: r.duration }
}

const cache = new Map<string, RouteResult>()
let last = 0
const MIN_GAP_MS = 1100

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (ms <= 0) return resolve()
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('aborted', 'AbortError'))
    })
  })

export async function fetchRoute(from: LatLng, to: LatLng, signal?: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<RouteResult> {
  const url = routeUrl(from, to)
  const hit = cache.get(url)
  if (hit) return hit
  await wait(last + MIN_GAP_MS - Date.now(), signal)
  last = Date.now()
  const timeout = AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined
  const sig = signal && timeout && AbortSignal.any ? AbortSignal.any([signal, timeout]) : (signal ?? timeout)
  const res = await fetchImpl(url, { signal: sig })
  if (!res.ok) throw new Error(`경로 서버 응답 ${res.status}`)
  const out = parseRoute(await res.json())
  cache.set(url, out)
  return out
}

export function formatRouteDistance(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`
}

export function formatRouteTime(sec: number): string {
  const min = Math.max(1, Math.round(sec / 60))
  if (min < 60) return `약 ${min}분`
  return `약 ${Math.floor(min / 60)}시간 ${min % 60}분`
}
