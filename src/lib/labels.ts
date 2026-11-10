import type { Area, Genre, GroupFit, PlaceType } from '../types'

export const AREA_LABEL: Record<Area, string> = {
  umeda: '우메다·기타신치',
  temma: '텐마·텐로쿠',
  namba: '난바·닛폰바시',
  west: '호리에·니시구',
  tennoji: '텐노지·신세카이',
  east: '교바시·다니마치',
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
}

export const GROUP_LABEL: Record<GroupFit, string> = {
  ok: '6명 OK',
  maybe: '6명 조건부',
  no: '6명 비추천',
}
