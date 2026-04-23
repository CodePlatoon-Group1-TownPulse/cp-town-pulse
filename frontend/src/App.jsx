import { useEffect, useMemo, useState } from 'react'
import './App.css'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const CITY_LABELS = {
  seattle: 'Seattle',
  'king-county': 'King County',
  bellevue: 'Bellevue',
  redmond: 'Redmond',
}

function pad2(n) {
  return n < 10 ? `0${n}` : String(n)
}

function buildYmd(year, monthIdx, day) {
  return `${year}-${pad2(monthIdx + 1)}-${pad2(day)}`
}

function toYmd(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return ''
  return dateStr.slice(0, 10)
}

function formatDateMDY(value) {
  const ymd = toYmd(value)
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-')
  if (!y || !m || !d) return ''
  return `${m}/${d}/${y}`
}

function App() {
  const today = new Date()
  const todayYmd = buildYmd(today.getFullYear(), today.getMonth(), today.getDate())

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [page, setPage] = useState('signin')
  const [savedEvents, setSavedEvents] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [area, setArea] = useState('seattle')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(todayYmd)
  const [editingEventKey, setEditingEventKey] = useState(null)
  const [editingNote, setEditingNote] = useState('')

  useEffect(() => {
    const loggedIn = localStorage.getItem('tp_logged_in')
    const storedSavedEvents = localStorage.getItem('tp_saved_events')

    if (loggedIn === 'true') {
      setIsLoggedIn(true)
      setPage('dashboard')
    }

    if (storedSavedEvents) {
      setSavedEvents(JSON.parse(storedSavedEvents))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tp_saved_events', JSON.stringify(savedEvents))
  }, [savedEvents])

  useEffect(() => {
    if (isLoggedIn && page === 'dashboard') {
      loadEvents(area)
    }
  }, [isLoggedIn, page, area])

  function handleLogin() {
    setIsLoggedIn(true)
    setPage('dashboard')
    localStorage.setItem('tp_logged_in', 'true')
  }

  function handleLogout() {
    setIsLoggedIn(false)
    setPage('signin')
    localStorage.removeItem('tp_logged_in')
  }

  function goToSignUp() {
    setPage('signup')
  }

  function goToSignIn() {
    setPage('signin')
  }

  function goToSaved() {
    setPage('saved')
  }

  function goToDashboard() {
    setPage('dashboard')
  }

  function getEventKey(event) {
    return event.external_id || event.title
  }

  async function loadEvents(selectedArea) {
    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.set('limit', '500')
      params.set('days_ahead', '60')
      params.set('area', selectedArea)

      const resp = await fetch(`/api/seattle-events/?${params.toString()}`)
      const data = await resp.json()
      setResults(data.results || [])
    } catch (error) {
      console.log('Load events error:', error)
      setResults([])
    }

    setLoading(false)
  }

  function saveEvent(event) {
    const eventKey = event.external_id || event.title
    const alreadySaved = savedEvents.find((item) => {
      return (item.external_id || item.title) === eventKey
    })

    if (!alreadySaved) {
      const newSavedEvents = [...savedEvents, { ...event, notes: '' }]
      setSavedEvents(newSavedEvents)
      localStorage.setItem('tp_saved_events', JSON.stringify(newSavedEvents))
    }
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
    setSelectedDate(null)
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
    setSelectedDate(null)
  }

  function handleDayClick(day) {
    const ymd = buildYmd(viewYear, viewMonth, day)
    setSelectedDate((prev) => (prev === ymd ? null : ymd))
  }

  function renderEventTitle(event) {
    const title = event.title || 'Untitled event'
    if (event.url) {
      return (
        <h2>
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="event-title-link"
          >
            {title}
          </a>
        </h2>
      )
    }
    return <h2>{title}</h2>
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()

  const eventDates = useMemo(() => {
    const set = new Set()
    for (const ev of results) {
      const ymd = toYmd(ev.date)
      if (ymd) set.add(ymd)
    }
    return set
  }, [results])

  const filteredResults = selectedDate
    ? results.filter((ev) => toYmd(ev.date) === selectedDate)
    : []

  const selectedDateDisplay = formatDateMDY(selectedDate)

  function deleteEvent(eventKey) {
    const updated = savedEvents.filter((item) => getEventKey(item) !== eventKey)
    setSavedEvents(updated)
    if (editingEventKey === eventKey) {
      setEditingEventKey(null)
      setEditingNote('')
    }
  }

  function startEditing(event) {
    setEditingEventKey(getEventKey(event))
    setEditingNote(event.notes || '')
  }

  function cancelEditing() {
    setEditingEventKey(null)
    setEditingNote('')
  }

  function saveNote(eventKey) {
    const updated = savedEvents.map((item) =>
      getEventKey(item) === eventKey ? { ...item, notes: editingNote } : item
    )
    setSavedEvents(updated)
    setEditingEventKey(null)
    setEditingNote('')
  }

  function isEventSaved(event) {
    let saved = false
    for (let i = 0; i < savedEvents.length; i++) {
      if (getEventKey(savedEvents[i]) === getEventKey(event)) {
        saved = true
      }
    }
    return saved
  }

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-right">
          {!isLoggedIn && page === 'signin' && (
            <button className="nav-button" onClick={goToSignUp}>
              Sign Up
            </button>
          )}

          {!isLoggedIn && page === 'signup' && (
            <button className="nav-button" onClick={goToSignIn}>
              Sign In
            </button>
          )}

          {isLoggedIn && (
            <>
              <button className="nav-button" onClick={goToDashboard}>
                Home
              </button>
              <button className="nav-button" onClick={goToSaved}>
                Saved
              </button>
              <button className="nav-button signout-button" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          )}
        </div>
      </nav>

      {!isLoggedIn && page === 'signin' && (
        <main className="auth-page">
          <div className="auth-card">
            <h1>Sign In</h1>
            <p>Sign in to see local civic events and save the ones you want.</p>

            <form className="auth-form">
              <input type="email" placeholder="Email" />
              <input type="password" placeholder="Password" />
              <button type="button" onClick={handleLogin}>
                Sign In
              </button>
            </form>
          </div>
        </main>
      )}

      {!isLoggedIn && page === 'signup' && (
        <main className="auth-page">
          <div className="auth-card">
            <h1>Sign Up</h1>
            <p>Create an account to save events and keep track of city happenings.</p>

            <form className="auth-form">
              <input type="text" placeholder="Name" />
              <input type="email" placeholder="Email" />
              <input type="password" placeholder="Password" />
              <button type="button" onClick={handleLogin}>
                Create Account
              </button>
            </form>
          </div>
        </main>
      )}

      {isLoggedIn && page === 'dashboard' && (
        <main className="dashboard-page">
          <section className="hero">
            <img src="/HomePage.png" alt="Town Pulse" />
          </section>

          <header className="page-header">
            <h1>Events in {CITY_LABELS[area] || area}</h1>
            <div className="area-bar">
              <p>Pick an area to see current civic and community events.</p>
              <select value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="seattle">Seattle</option>
                <option value="king-county">King County</option>
                <option value="bellevue">Bellevue</option>
                <option value="redmond">Redmond</option>
              </select>
            </div>
          </header>

          <div className="dashboard-layout">
            <div className="left-column">
              {selectedDate && (
                <div className="filter-bar">
                  <span>Showing events on {selectedDateDisplay}</span>
                </div>
              )}

              {loading && <p className="status-message">Loading events...</p>}

              {!loading && !selectedDate && (
                <p className="status-message">
                  Select a date on the calendar to see events.
                </p>
              )}

              {!loading && selectedDate && filteredResults.length === 0 && (
                <p className="status-message">
                  No events on {selectedDateDisplay} in this area.
                </p>
              )}

              {!loading && selectedDate && filteredResults.length > 0 && (
                <div className="cards-grid">
                  {filteredResults.map((event, index) => (
                    <div
                      key={event.external_id || `${event.title}-${index}`}
                      className="event-card"
                    >
                      {renderEventTitle(event)}
                      <p>{formatDateMDY(event.date) || 'No date'}</p>
                      {event.location_address && <p>{event.location_address}</p>}
                      {event.description && <p className="event-description">{event.description}</p>}
                      <button
                        type="button"
                        onClick={() => saveEvent(event)}
                        disabled={isEventSaved(event)}
                      >
                        {isEventSaved(event) ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="right-column">
              <div className="calendar-box">
                <div className="calendar-top">
                  <button type="button" onClick={prevMonth}>{'<'}</button>
                  <h3>{`${MONTH_NAMES[viewMonth]} ${viewYear}`}</h3>
                  <button type="button" onClick={nextMonth}>{'>'}</button>
                </div>

                <div className="calendar-days">
                  <div className="calendar-weekday">Sun</div>
                  <div className="calendar-weekday">Mon</div>
                  <div className="calendar-weekday">Tue</div>
                  <div className="calendar-weekday">Wed</div>
                  <div className="calendar-weekday">Thu</div>
                  <div className="calendar-weekday">Fri</div>
                  <div className="calendar-weekday">Sat</div>

                  {Array.from({ length: firstWeekday }).map((_, i) => (
                    <div key={`blank-${i}`} className="calendar-date calendar-date-blank" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const ymd = buildYmd(viewYear, viewMonth, day)
                    const hasEvents = eventDates.has(ymd)
                    const isSelected = selectedDate === ymd
                    const isToday =
                      day === today.getDate() &&
                      viewMonth === today.getMonth() &&
                      viewYear === today.getFullYear()

                    const classes = ['calendar-date', 'calendar-date-button']
                    if (hasEvents) classes.push('has-events')
                    if (isSelected) classes.push('is-selected')
                    if (isToday) classes.push('is-today')

                    return (
                      <button
                        key={ymd}
                        type="button"
                        className={classes.join(' ')}
                        onClick={() => handleDayClick(day)}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {isLoggedIn && page === 'saved' && (
        <main className="dashboard-page">
          <header className="page-header">
            <h1>Saved Events</h1>
            <p>These are the events you saved.</p>
          </header>

          <div className="cards-grid">
            {savedEvents.length === 0 && <p>No saved events yet.</p>}

            {savedEvents.map((event, index) => {
              const eventKey = getEventKey(event)
              const isEditing = editingEventKey === eventKey

              return (
                <div
                  key={event.external_id || `${event.title}-${index}`}
                  className="event-card"
                >
                  {renderEventTitle(event)}
                  <p>{formatDateMDY(event.date) || 'No date'}</p>
                  {event.location_address && <p>{event.location_address}</p>}
                  {event.description && <p className="event-description">{event.description}</p>}

                  {/* Notes display */}
                  {!isEditing && event.notes && (
                    <div className="event-notes">
                      <strong>Notes:</strong>
                      <p>{event.notes}</p>
                    </div>
                  )}

                  {/* Edit notes form */}
                  {isEditing && (
                    <div className="event-notes-editor">
                      <textarea
                        value={editingNote}
                        onChange={(e) => setEditingNote(e.target.value)}
                        placeholder="Add your notes here..."
                        rows={3}
                      />
                      <div className="note-actions">
                        <button type="button" onClick={() => saveNote(eventKey)}>
                          Save Note
                        </button>
                        <button type="button" onClick={cancelEditing}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Card action buttons */}
                  {!isEditing && (
                    <div className="card-actions">
                      <button type="button" onClick={() => startEditing(event)}>
                        {event.notes ? 'Edit Notes' : 'Add Notes'}
                      </button>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => deleteEvent(eventKey)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </main>
      )}
    </div>
  )
}

export default App