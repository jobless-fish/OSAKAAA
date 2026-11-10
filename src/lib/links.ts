import type { Lodging } from '../types'

/** 구글 지도 길찾기 (전철·대중교통). 지도 안 도보 경로가 안 될 때의 대안이기도 하다 */
export function transitUrl(lodging: Lodging, lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&origin=${lodging.lat},${lodging.lng}&destination=${lat},${lng}&travelmode=transit`
}
