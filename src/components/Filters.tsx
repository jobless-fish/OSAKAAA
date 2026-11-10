import type { Area, Genre, PlaceType } from '../types'
import type { FilterState, RatingKey } from '../lib/filters'
import { AREA_LABEL, GENRE_LABEL, TYPE_LABEL } from '../lib/labels'
import { TRIP_DAYS } from '../lib/trip'

interface Props {
  value: FilterState
  onChange: (v: FilterState) => void
  areas: Area[]
  genres: Genre[]
}

export function Filters({ value, onChange, areas, genres }: Props) {
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) => onChange({ ...value, [k]: v })
  return (
    <div className="filters">
      <label className="field">
        <span>종류</span>
        <select value={value.type} onChange={(e) => set('type', e.target.value as FilterState['type'])}>
          <option value="all">전체</option>
          {(Object.keys(TYPE_LABEL) as PlaceType[]).map((t) => (
            <option key={t} value={t}>{TYPE_LABEL[t]}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>지역</span>
        <select value={value.area} onChange={(e) => set('area', e.target.value as FilterState['area'])}>
          <option value="all">전체 지역</option>
          {areas.map((a) => (
            <option key={a} value={a}>{AREA_LABEL[a]}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>장르</span>
        <select value={value.genre} onChange={(e) => set('genre', e.target.value as FilterState['genre'])}>
          <option value="all">전체 장르</option>
          {genres.map((g) => (
            <option key={g} value={g}>{GENRE_LABEL[g]}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>평점</span>
        <select value={value.rating} onChange={(e) => set('rating', e.target.value as RatingKey)}>
          <option value="all">전체</option>
          <option value="scored">점수 확인된 곳</option>
          <option value="3.6">3.6 이상</option>
          <option value="3.8">3.8 이상</option>
        </select>
      </label>
      <label className="field">
        <span>날짜</span>
        <select value={value.day} onChange={(e) => set('day', e.target.value)}>
          <option value="all">모든 날짜</option>
          {TRIP_DAYS.map((d) => (
            <option key={d.date} value={d.date}>{d.label} 영업하는 곳</option>
          ))}
        </select>
      </label>
    </div>
  )
}
