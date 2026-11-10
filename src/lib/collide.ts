import type { WithDistance } from '../types'

const CARD_W = 112
const CARD_H = 118

/**
 * 카드 마커 겹침 처리: 우선순위(선택 > 특이한 장소 > 점수 높은 순) 대로 카드 자리를 잡고,
 * 이미 놓인 카드와 겹치는 곳은 작은 점으로 바꾼다. 화면 이동과 무관하게 줌 단위로만 계산한다.
 */
export function pickCards(places: WithDistance[], selectedId: string | null, project: (p: WithDistance) => { x: number; y: number }): Set<string> {
  const pri = (p: WithDistance) => (p.id === selectedId ? 10 : p.type === 'spot' ? 6 : (p.tabelogScore ?? 3))
  const order = [...places].sort((a, b) => pri(b) - pri(a))
  const placed: { x: number; y: number }[] = []
  const ok = new Set<string>()
  for (const p of order) {
    const pt = project(p)
    const hit = placed.some((q) => Math.abs(q.x - pt.x) < CARD_W + 4 && Math.abs(q.y - pt.y) < CARD_H + 4)
    if (!hit || p.id === selectedId) {
      placed.push(pt)
      ok.add(p.id)
    }
  }
  return ok
}

