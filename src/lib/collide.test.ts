import { describe, expect, it } from 'vitest'
import type { WithDistance } from '../types'
import { pickCards } from './collide'

const mk = (id: string, score: number | null, x: number, y: number, type = 'meal') =>
  ({ id, type, tabelogScore: score, x, y }) as unknown as WithDistance & { x: number; y: number }

describe('pickCards (카드 겹침 처리)', () => {
  const pts = [mk('lo', 3.1, 0, 0), mk('hi', 3.9, 30, 20), mk('far', 3.0, 400, 0), mk('spot', null, 60, 300, 'spot')]
  const proj = (p: WithDistance) => p as unknown as { x: number; y: number }
  it('겹치면 점수 높은 곳이 카드, 떨어진 곳은 모두 카드', () => {
    expect([...pickCards(pts, null, proj)].sort()).toEqual(['far', 'hi', 'spot'])
  })
  it('선택한 곳은 겹쳐도 항상 카드', () => {
    expect(pickCards(pts, 'lo', proj).has('lo')).toBe(true)
    expect(pickCards(pts, 'lo', proj).has('hi')).toBe(false)
  })
})
