import type { Area, Genre, GroupFit, PlaceType, PoiType } from '../types'

export const AREA_LABEL: Record<Area, string> = {
  near: '숙소 도보권 (하나조노초·텐가차야)',
  tennoji: '텐노지·신세카이·아베노',
  south: '남쪽 (다마데·스미요시·니시타나베)',
  southwest: '남서쪽 (기타카가야·스미노에)',
  bay: '서쪽 (다이쇼·벤텐초·오사카항)',
  namba: '난바·닛폰바시',
  west: '호리에·니시구',
  umeda: '우메다·기타신치',
  temma: '텐마·텐로쿠',
  east: '교바시·다니마치',
  usj: 'USJ (고노하나)',
  kyoto: '교토 (후시미)',
}

export const GENRE_LABEL: Record<Genre, string> = {
  meat: '고기·야키니쿠',
  noodle: '라멘·면',
  japanese: '일식·스시·가이세키',
  asian: '한식·중식·카레',
  western: '양식·카페·바',
}

export const TYPE_LABEL: Record<PlaceType, string> = {
  meal: '식사',
  snack: '간식·가벼운 한 끼',
  bar: '술·바',
  spot: '특이한 장소',
  livebar: '라이브 바',
  liquor: '주류 상점',
  taxfree: '면세점',
  landmark: '대표 명소',
  conv: '편의점',
  pharmacy: '약국',
  donki: '돈키호테',
  discount: '할인·잡화점',
}

/** 식당이 아닌 장소의 표시 (지도 마커 색·기호와 목록 머리글) */
export const POI_META: Record<PoiType, { label: string; mark: string }> = {
  spot: { label: '특이한 장소', mark: '✦' },
  livebar: { label: '라이브 바', mark: '♪' },
  liquor: { label: '주류 상점', mark: '◆' },
  taxfree: { label: '면세점', mark: '¥' },
  landmark: { label: '대표 명소', mark: '★' },
  conv: { label: '편의점', mark: '24' },
  pharmacy: { label: '약국', mark: '+' },
  donki: { label: '돈키호테', mark: 'D' },
  discount: { label: '할인·잡화점', mark: '%' },
}

export const GROUP_LABEL: Record<GroupFit, string> = {
  ok: '6명 OK',
  maybe: '6명 조건부',
  no: '6명 비추천',
}

export const SPOT_LABEL = '특이한 장소'

/** 지도 버튼·메인 화면에서 바로 가는 대표 명소 */
export const LANDMARKS = [
  { id: 'landmark-fushimi', short: '후시미', name: '후시미 이나리 신사', sub: '교토 · 전철 약 1시간 15분' },
  { id: 'landmark-usj', short: 'USJ', name: '유니버설 스튜디오 재팬', sub: '고노하나 · JR 약 20분' },
] as const
