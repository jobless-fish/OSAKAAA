export type Genre = 'meat' | 'noodle' | 'japanese' | 'asian' | 'western'
export type Area = 'near' | 'umeda' | 'temma' | 'namba' | 'west' | 'tennoji' | 'east' | 'south' | 'southwest' | 'bay' | 'usj' | 'kyoto'
export type FoodType = 'meal' | 'snack' | 'bar'
/** 식당이 아닌 장소: 대표 명소 · 특이한 장소(볼거리) · 라이브 바 · 주류 상점 · 면세점 · 편의점 · 약국 · 돈키호테 · 비슷한 할인·잡화점 */
export type PoiType = 'landmark' | 'spot' | 'liquor' | 'taxfree' | 'livebar' | 'conv' | 'pharmacy' | 'donki' | 'discount'
export const POI_TYPES: readonly PoiType[] = ['landmark', 'spot', 'livebar', 'liquor', 'taxfree', 'conv', 'pharmacy', 'donki', 'discount']
export type PlaceType = FoodType | PoiType
export type GroupFit = 'ok' | 'maybe' | 'no'

interface PlaceBase {
  id: string
  nameKo: string
  nameJa: string
  area: Area
  station: string
  hours: string
  closedDates: string[]
  closedNote: string | null
  address: string
  lat: number
  lng: number
  geocode: { provider: string; matched: string }
}

export interface Restaurant extends PlaceBase {
  type: FoodType
  genre: Genre
  genreText: string
  tabelogScore: number | null
  budget: string
  reserve: string
  seats: string
  group: GroupFit
  groupNote: string
  tabelogUrl: string
  courseUrl: string | null
  image: string
}

/** 식당이 아닌 장소 (이름은 처음 만든 '특이한 장소'에서 그대로 씀) */
export interface Spot extends PlaceBase {
  type: PoiType
  /** 대표 사진 (타베로그 등 출처가 있을 때만) */
  image?: string | null
  icon: string
  spotKind: string
  description: string
  fee: string
  tip: string | null
  infoUrl: string
  infoLabel: string
  /** 대표 종류(type) 말고도 이 필터에 함께 나오게 할 종류 (예: 면세 드럭스토어 → 약국) */
  tags?: PoiType[]
  /** 대표 명소의 가는 법·이벤트 같은 상세 안내 */
  guide?: { title: string; items: string[] }[]
}

export type Place = Restaurant | Spot

export interface Lodging {
  name: string
  address: string
  addressEn: string
  lat: number
  lng: number
}

export interface Dataset {
  updated: string
  lodging: Lodging
  restaurants: Restaurant[]
  spots: Spot[]
}

export type WithDistance = Place & {
  distanceKm: number
  walkMin: number
}

export const isSpot = (p: Place): p is Spot => (POI_TYPES as readonly string[]).includes(p.type)
/** 대표 종류나 태그 중 하나라도 맞으면 그 종류로 본다 (한 핀이 여러 필터에 나옴) */
export const hasType = (p: Place, t: PlaceType): boolean => p.type === t || (isSpot(p) && !!p.tags?.includes(t as PoiType))
export const scoreOf = (p: Place): number | null => (isSpot(p) ? null : p.tabelogScore)
