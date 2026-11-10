import { describe, expect, it, vi } from 'vitest'
import { fetchRoute, formatRouteDistance, formatRouteTime, parseRoute, routeUrl } from './route'

const ok = { code: 'Ok', routes: [{ distance: 365.9, duration: 292.7, geometry: { coordinates: [[135.4922, 34.6444], [135.4931, 34.6451]] } }] }

describe('route', () => {
  it('builds an OSRM foot URL as lng,lat pairs', () => {
    expect(routeUrl({ lat: 34.644451, lng: 135.492218 }, { lat: 34.6451, lng: 135.4931 })).toBe(
      'https://routing.openstreetmap.de/routed-foot/route/v1/foot/135.492218,34.644451;135.493100,34.645100?overview=full&geometries=geojson',
    )
  })
  it('parses geometry into lat,lng and keeps router distance/time', () => {
    const r = parseRoute(ok)
    expect(r.coords[0]).toEqual([34.6444, 135.4922])
    expect(r.distance).toBe(365.9)
    expect(r.duration).toBe(292.7)
  })
  it('rejects responses without a route', () => {
    expect(() => parseRoute({ code: 'NoRoute', routes: [] })).toThrow()
    expect(() => parseRoute(null)).toThrow()
  })
  it('throws on HTTP errors and caches successful routes', async () => {
    const bad = vi.fn(async () => new Response('x', { status: 503 }))
    await expect(fetchRoute({ lat: 1, lng: 2 }, { lat: 3, lng: 4 }, undefined, bad as unknown as typeof fetch)).rejects.toThrow('503')
    const good = vi.fn(async () => new Response(JSON.stringify(ok), { status: 200 }))
    const a = await fetchRoute({ lat: 5, lng: 6 }, { lat: 7, lng: 8 }, undefined, good as unknown as typeof fetch)
    const b = await fetchRoute({ lat: 5, lng: 6 }, { lat: 7, lng: 8 }, undefined, good as unknown as typeof fetch)
    expect(a).toBe(b)
    expect(good).toHaveBeenCalledTimes(1)
  })
  it('formats distance and time', () => {
    expect(formatRouteDistance(365.9)).toBe('370m')
    expect(formatRouteDistance(1520)).toBe('1.5km')
    expect(formatRouteTime(292.7)).toBe('약 5분')
    expect(formatRouteTime(4000)).toBe('약 1시간 7분')
  })
})
