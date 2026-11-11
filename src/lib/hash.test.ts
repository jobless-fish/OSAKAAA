import { describe, expect, it } from 'vitest'
import data from '../data/restaurants.json'
import { hasType, type Dataset } from '../types'
import { parseHash } from './hash'

describe('parseHash', () => {
  it('빈 주소·#/ 는 메인 화면', () => {
    expect(parseHash('')).toEqual({ view: 'home', place: null, type: null })
    expect(parseHash('#/')).toEqual({ view: 'home', place: null, type: null })
  })
  it('#/map, 장소·종류 바로가기', () => {
    expect(parseHash('#/map').view).toBe('map')
    expect(parseHash('#/map?place=landmark-usj')).toEqual({ view: 'map', place: 'landmark-usj', type: null })
    expect(parseHash('#/map?type=donki').type).toBe('donki')
    expect(parseHash('#/map?type=xxx').type).toBeNull()
  })
})

describe('hasType', () => {
  it('면세점 핀에 붙은 태그로도 약국·돈키호테에 잡힘 (핀 중복 없음)', () => {
    const ds = data as Dataset
    const byId = (id: string) => ds.spots.find((s) => s.id === id)!
    expect(hasType(byId('taxfree-daikoku-hanazono'), 'pharmacy')).toBe(true)
    expect(hasType(byId('taxfree-daikoku-hanazono'), 'taxfree')).toBe(true)
    expect(hasType(byId('taxfree-mega-donki'), 'donki')).toBe(true)
    expect(hasType(ds.restaurants[0], 'pharmacy')).toBe(false)
  })
})
