import { describe, expect, it } from 'vitest'
import type { Genre, WithDistance } from '../types'
import { groupByGenre, sortPlaces } from './sort'

const mk = (id: string, genre: Genre, score: number | null, km: number) =>
  ({ id, genre, tabelogScore: score, distanceKm: km }) as WithDistance
const list = [mk('a', 'meat', 3.5, 1), mk('b', 'japanese', null, 0.5), mk('c', 'japanese', 4.1, 3), mk('d', 'meat', 3.9, 2), mk('e', 'western', null, 0.2)]
const ORDER: Genre[] = ['meat', 'noodle', 'japanese', 'asian', 'western']

describe('sort', () => {
  it('별점순: 높은 점수 먼저, 점수 없는 곳은 맨 뒤(가까운 순)', () => {
    expect(sortPlaces(list, 'score', ORDER).map((r) => r.id)).toEqual(['c', 'd', 'a', 'e', 'b'])
  })
  it('거리순: 숙소에서 가까운 순', () => {
    expect(sortPlaces(list, 'distance', ORDER).map((r) => r.id)).toEqual(['e', 'b', 'a', 'd', 'c'])
  })
  it('카테고리별: 장르 순서로 묶고 묶음 안은 별점순, 빈 장르는 생략', () => {
    const g = groupByGenre(list, ORDER)
    expect(g.map((x) => x.genre)).toEqual(['meat', 'japanese', 'western'])
    expect(g[0].items.map((r) => r.id)).toEqual(['d', 'a'])
    expect(g[1].items.map((r) => r.id)).toEqual(['c', 'b'])
    expect(sortPlaces(list, 'category', ORDER).map((r) => r.id)).toEqual(['d', 'a', 'c', 'b', 'e'])
  })
})
