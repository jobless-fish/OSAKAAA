import { useCallback, useEffect, useState } from 'react'
import { parseHash, type Route } from './lib/hash'
import { MapScreen } from './MapScreen'
import { Home } from './Home'

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = useCallback((hash: string) => {
    window.location.hash = hash
  }, [])
  if (route.view === 'map')
    return <MapScreen key={`${route.place}-${route.type}`} initialPlace={route.place} initialType={route.type} onHome={() => go('/')} />
  return <Home go={go} />
}
