import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setHasSearched(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      params.set('limit', '25')
      const resp = await fetch(`/api/seattle-events/?${params.toString()}`)
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body.detail || `Request failed (${resp.status})`)
      }
      const data = await resp.json()
      setResults(data.results || [])
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="tp-main">
      <header className="tp-header">
        <h1>Town Pulse</h1>
        <p>Search civic events from Seattle's open data portal.</p>
      </header>

      <form className="tp-search" onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try &quot;parade&quot;, &quot;festival&quot;, &quot;run&quot;..."
          aria-label="Search civic events"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="tp-error">Error: {error}</p>}

      {hasSearched && !loading && !error && results.length === 0 && (
        <p className="tp-empty">No events found.</p>
      )}

      <ul className="tp-results">
        {results.map((event) => (
          <li key={event.external_id || `${event.title}-${event.date}`} className="tp-event">
            <h2>{event.title || 'Untitled event'}</h2>
            <p className="tp-meta">
              {event.category && <span className="tp-category">{event.category}</span>}
              {event.date && <span className="tp-date">{event.date}</span>}
            </p>
            {event.location_address && <p className="tp-address">{event.location_address}</p>}
            {event.description && <p className="tp-description">{event.description}</p>}
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
