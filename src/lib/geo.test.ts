import { describe, expect, it } from 'vitest'
import data from '../data/restaurants.json'
import type { Dataset } from '../types'
import { haversineKm, walkMinutes } from './geo'
import { TRIP_DAYS } from './trip'

const ds = data as Dataset

// 지역별 대략적인 범위 (위도/경도) — 지오코딩 결과가 엉뚱한 곳에 찍히지 않았는지 확인
const BOX: Record<string, [number, number, number, number]> = {
  umeda: [34.69, 34.71, 135.49, 135.51],
  temma: [34.7, 34.715, 135.5, 135.52],
  namba: [34.66, 34.67, 135.49, 135.51],
  west: [34.665, 34.69, 135.48, 135.5],
  tennoji: [34.64, 34.656, 135.5, 135.52],
  east: [34.675, 34.705, 135.51, 135.54],
  suburb: [34.8, 34.83, 135.55, 135.59],
}

describe('geo', () => {
  it('haversine: 우메다↔난바 약 4km', () => {
    const d = haversineKm(34.7025, 135.4959, 34.6659, 135.5013)
    expect(d).toBeGreaterThan(3.8)
    expect(d).toBeLessThan(4.3)
  })
  it('walkMinutes는 1분 이상', () => {
    expect(walkMinutes(0)).toBe(1)
    expect(walkMinutes(1)).toBe(16)
  })
})

describe('data', () => {
  it('25곳, id 중복 없음', () => {
    expect(ds.restaurants).toHaveLength(25)
    expect(new Set(ds.restaurants.map((r) => r.id)).size).toBe(25)
  })
  it('모든 좌표가 해당 지역 범위 안', () => {
    for (const r of ds.restaurants) {
      const [la1, la2, ln1, ln2] = BOX[r.area]
      expect(r.lat, r.id).toBeGreaterThan(la1)
      expect(r.lat, r.id).toBeLessThan(la2)
      expect(r.lng, r.id).toBeGreaterThan(ln1)
      expect(r.lng, r.id).toBeLessThan(ln2)
    }
  })
  it('휴무일은 여행 기간 날짜만', () => {
    const days = TRIP_DAYS.map((d) => d.date)
    for (const r of ds.restaurants) for (const c of r.closedDates) expect(days).toContain(c)
  })
  it('타베로그 링크 형식', () => {
    for (const r of ds.restaurants) expect(r.tabelogUrl).toMatch(/^https:\/\/tabelog\.com\/osaka\//)
  })
  it('숙소는 니시나리구 아사히 부근', () => {
    expect(ds.lodging.lat).toBeCloseTo(34.6445, 3)
    expect(ds.lodging.lng).toBeCloseTo(135.4922, 3)
  })
})
