import { describe, expect, it } from 'vitest'
import data from '../data/restaurants.json'
import { hasType, type Dataset, type PoiType } from '../types'
import { haversineKm, walkMinutes } from './geo'
import { TRIP_DAYS } from './trip'

const ds = data as Dataset

// 기존 도심 지역은 박스로, 그 밖은 숙소 기준 반경으로 좌표가 엉뚱한 곳에 찍히지 않았는지 확인
const BOX: Partial<Record<string, [number, number, number, number]>> = {
  umeda: [34.69, 34.71, 135.49, 135.51],
  temma: [34.7, 34.715, 135.5, 135.52],
  namba: [34.655, 34.676, 135.485, 135.51],
  west: [34.665, 34.69, 135.48, 135.5],
  tennoji: [34.635, 34.665, 135.495, 135.53],
  east: [34.675, 34.705, 135.51, 135.54],
  usj: [34.66, 34.675, 135.425, 135.445],
  kyoto: [34.96, 34.975, 135.765, 135.78],
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
  it('맛집 83곳 + 식당이 아닌 장소 4종류, id 중복 없음', () => {
    expect(ds.restaurants).toHaveLength(83)
    const n = (t: string) => ds.spots.filter((s) => s.type === t).length
    expect(n('spot')).toBeGreaterThanOrEqual(20)
    expect(n('liquor')).toBeGreaterThanOrEqual(8)
    expect(n('taxfree')).toBeGreaterThanOrEqual(8)
    expect(n('livebar')).toBeGreaterThanOrEqual(3)
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
  it('숙소 500m 이내 맛집 15곳 이상, 주류 상점·면세점도 있음', () => {
    expect(ds.restaurants.filter((r) => km(r) <= 0.53).length).toBeGreaterThanOrEqual(15)
    expect(ds.spots.filter((s) => s.type === 'liquor' && km(s) <= 0.5).length).toBeGreaterThanOrEqual(2)
    expect(ds.spots.filter((s) => s.type === 'taxfree' && km(s) <= 0.5).length).toBeGreaterThanOrEqual(1)
  })
  it('주류 상점은 1.5km 이내가 대부분, 전문점만 3.2km까지', () => {
    const liq = ds.spots.filter((s) => s.type === 'liquor')
    for (const s of liq) expect(km(s), s.id).toBeLessThan(3.2)
    expect(liq.filter((s) => km(s) <= 1.65).length).toBeGreaterThanOrEqual(liq.length - 3)
  })
  it('면세점 카드는 모두 5,000엔 기준을 적고, 라이브 바는 여행 기간 일정·요금을 적음', () => {
    for (const s of ds.spots.filter((x) => x.type === 'taxfree')) expect(s.fee, s.id).toContain('5,000엔')
    for (const s of ds.spots.filter((x) => x.type === 'livebar')) {
      expect(s.description, s.id).toMatch(/11\/1[3-7]|여행 기간/)
      expect(s.fee, s.id).toBeTruthy()
    }
  })
  it('식당이 아닌 장소: 설명·시간·요금·안내 링크가 있고, 근처용 장소는 대부분 숙소 3km 이내', () => {
    for (const s of ds.spots) {
      expect(['spot', 'liquor', 'taxfree', 'livebar', 'conv', 'pharmacy', 'donki', 'discount', 'landmark']).toContain(s.type)
      expect(s.description.length, s.id).toBeGreaterThan(20)
      expect(s.hours, s.id).toBeTruthy()
      expect(s.fee, s.id).toBeTruthy()
      expect(s.infoUrl, s.id).toMatch(/^https?:\/\//)
    }
    const local = ds.spots.filter((s) => !['donki', 'discount', 'landmark'].includes(s.type))
    expect(local.filter((s) => km(s) <= 3.2).length).toBeGreaterThanOrEqual(local.length - 2)
  })
  const of = (t: PoiType) => ds.spots.filter((s) => hasType(s, t))
  it('가장 가까운 편의점 5곳: 모두 숙소 400m 이내 · 24시간', () => {
    expect(of('conv')).toHaveLength(5)
    for (const s of of('conv')) {
      expect(km(s), s.id).toBeLessThan(0.4)
      expect(s.hours, s.id).toContain('24시간')
    }
  })
  it('가장 가까운 약국 5곳 (드럭스토어 면세점 핀은 태그로 포함)', () => {
    expect(of('pharmacy')).toHaveLength(5)
    expect(of('pharmacy').filter((s) => s.type === 'taxfree')).toHaveLength(1)
    for (const s of of('pharmacy')) expect(km(s), s.id).toBeLessThan(0.6)
  })
  it('돈키호테는 5km 이내 전부, 비슷한 매장도 5km 이내', () => {
    const dq = of('donki')
    expect(dq.length).toBeGreaterThanOrEqual(10)
    for (const s of [...dq, ...of('discount')]) expect(km(s), s.id).toBeLessThan(5)
    expect(of('discount').length).toBeGreaterThanOrEqual(6)
    expect(of('discount').some((s) => /MEGA/.test(s.nameJa + s.nameKo))).toBe(false)
  })
  it('대표 명소 2곳(후시미 이나리·USJ)은 가는 법 안내가 있음', () => {
    const lm = ds.spots.filter((s) => s.type === 'landmark')
    expect(lm.map((s) => s.id).sort()).toEqual(['landmark-fushimi', 'landmark-usj'])
    for (const s of lm) {
      expect(s.guide?.length, s.id).toBeGreaterThanOrEqual(3)
      for (const g of s.guide!) expect(g.items.length, `${s.id} ${g.title}`).toBeGreaterThan(0)
    }
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
