const KEY = 'osakaaa:pinned-places'

export function loadPins(): ReadonlySet<string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

export function savePins(pins: ReadonlySet<string>): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify([...pins]))
    return true
  } catch {
    return false
  }
}
