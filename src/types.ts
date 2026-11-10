export type Genre = 'meat' | 'noodle' | 'japanese' | 'asian' | 'western'
export type Area = 'umeda' | 'temma' | 'namba' | 'west' | 'tennoji' | 'east'
export type PlaceType = 'meal' | 'snack' | 'bar'
export type GroupFit = 'ok' | 'maybe' | 'no'

export interface Restaurant {
  id: string
  nameKo: string
  nameJa: string
  genre: Genre
  genreText: string
  type: PlaceType
  area: Area
  station: string
  tabelogScore: number | null
  budget: string
  hours: string
  closedDates: string[]
  closedNote: string | null
  reserve: string
  seats: string
  group: GroupFit
  groupNote: string
  tabelogUrl: string
  courseUrl: string | null
  image: string
  address: string
  lat: number
  lng: number
  geocode: { provider: string; matched: string }
}

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
}

export interface WithDistance extends Restaurant {
  distanceKm: number
  walkMin: number
}
