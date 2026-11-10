import { describe, expect, it } from 'vitest'
import data from '../data/restaurants.json'
import type { Dataset } from '../types'
import { haversineKm, walkMinutes } from './geo'
import { TRIP_DAYS } from './trip'

const ds = data as Dataset

// 기존 도심 지역은 박스로, 그 밖은 숙소 기준 반경으로 좌표가 엉뚱한 곳에 찍히지 않았는지 확인
const BOX: Partial<Record<string, [number, number, number, number]>> = {
  umeda: [34.69, 34.71, 135.49, 135.51],
  temma: [34.7, 34.715, 135.5, 135.52],
  namba: [34.655, 34.673, 135.485, 135.51],
  west: [34.665, 34.69, 135.48, 135.5],
  tennoji: [34.635, 34.66, 135.495, 135.53],
  east: [34.675, 34.705, 135.51, 135.54],
}
/** 지역별 숙소에서의 최대 직선거리(km) */
const RADIUS: Partial<Record<string, number>> = { near: 1.25, south: 5.5, southwest: 5.0, bay: 5.3 }
const L0 = { lat: 34.644451, lng: 135.492218 }
const km = (p: { lat: number; lng: number }) => haversineKm(L0.lat, L0.lng, p.lat, p.lng)
/** 8방위 (북=0°, 시계방향) */
const sector = (p: { lat: number; lng: number }) => {
  const a = (Math.atan2((p.lng - L0.lng) * 91.4, (p.lat - L0.lat) * 111.0) * 180) / Math.PI
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor((((a + 360) % 360) + 22.5) / 45) % 8]
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
  it('맛집 73곳 + 특이한 장소, id 중복 없음', () => {
    expect(ds.restaurants).toHaveLength(73)
    expect(ds.spots.length).toBeGreaterThanOrEqual(10)
    const ids = [...ds.restaurants, ...ds.spots].map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('맛집은 모두 6명 OK, 출처 표기 필드 없음 (특이한 장소는 대상 아님)', () => {
    for (const r of ds.restaurants) {
      expect(r.group, r.id).toBe('ok')
      expect(r, r.id).not.toHaveProperty('sourceUrl')
      expect(r, r.id).not.toHaveProperty('sourceLabel')
      expect(r, r.id).not.toHaveProperty('userFound')
    }
  })
  it('모든 좌표가 해당 지역 범위(박스 또는 숙소 반경) 안', () => {
    for (const r of [...ds.restaurants, ...ds.spots]) {
      const box = BOX[r.area]
      const rad = RADIUS[r.area]
      expect(box || rad, `${r.id}: ${r.area}`).toBeTruthy()
      if (box) {
        const [la1, la2, ln1, ln2] = box
        expect(r.lat, r.id).toBeGreaterThan(la1)
        expect(r.lat, r.id).toBeLessThan(la2)
        expect(r.lng, r.id).toBeGreaterThan(ln1)
        expect(r.lng, r.id).toBeLessThan(ln2)
      } else {
        expect(km(r), r.id).toBeLessThan(rad as number)
      }
    }
  })
  it('숙소 기준 8방위 모두에 맛집이 4곳 이상', () => {
    const count: Record<string, number> = {}
    for (const r of ds.restaurants) count[sector(r)] = (count[sector(r)] ?? 0) + 1
    for (const s of ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']) expect(count[s] ?? 0, s).toBeGreaterThanOrEqual(4)
  })
  it('도보권(직선 1.2km 이내) 맛집 15곳 이상', () => {
    expect(ds.restaurants.filter((r) => km(r) <= 1.2).length).toBeGreaterThanOrEqual(15)
  })
  it('타베로그 점수는 3.0 이상 (확인된 곳만)', () => {
    for (const r of ds.restaurants) if (r.tabelogScore != null) expect(r.tabelogScore, r.id).toBeGreaterThanOrEqual(3.0)
  })
  it('특이한 장소: 설명·시간·요금·안내 링크가 있고 대부분 숙소 3km 이내', () => {
    for (const s of ds.spots) {
      expect(s.type).toBe('spot')
      expect(s.description.length, s.id).toBeGreaterThan(20)
      expect(s.hours, s.id).toBeTruthy()
      expect(s.fee, s.id).toBeTruthy()
      expect(s.infoUrl, s.id).toMatch(/^https:\/\//)
    }
    expect(ds.spots.filter((s) => km(s) <= 3).length).toBeGreaterThanOrEqual(ds.spots.length - 2)
  })
  it('휴무일은 여행 기간 날짜만', () => {
    const days = TRIP_DAYS.map((d) => d.date)
    for (const r of [...ds.restaurants, ...ds.spots]) for (const c of r.closedDates) expect(days).toContain(c)
  })
  it('맛집 타베로그 링크 형식', () => {
    for (const r of ds.restaurants) expect(r.tabelogUrl).toMatch(/^https:\/\/tabelog\.com\/osaka\//)
  })
  it('숙소는 니시나리구 아사히 부근', () => {
    expect(ds.lodging.lat).toBeCloseTo(34.6445, 3)
    expect(ds.lodging.lng).toBeCloseTo(135.4922, 3)
  })
})
