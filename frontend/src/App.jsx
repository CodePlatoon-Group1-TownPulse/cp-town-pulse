import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { buildYmd, toYmd, formatDateMDY } from './utils/date'
import { MONTH_NAMES, CITY_LABELS } from './constants'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import NavBar from './components/NavBar'
import EventCard from './components/EventCard'
import EventModal from './components/EventModal'
import Calendar from './components/Calendar'
import AuthPage from './components/AuthPage'
import SavedEvents from './components/SavedEvents'





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
  const [selectedEventForModal, setSelectedEventForModal] = useState(null)

  const [googleClientId, setGoogleClientId] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formName, setFormName] = useState('')
  const googleButtonRef = useRef(null)

  const [mode, setMode] = useState('light')

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
  }

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  )

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

  useEffect(() => {
    fetch('/api/auth/google/config/')
      .then((r) => r.json())
      .then((data) => setGoogleClientId(data.client_id || ''))
      .catch(() => setGoogleClientId(''))
  }, [])

  useEffect(() => {
    if (isLoggedIn || !googleClientId || !googleButtonRef.current) return
    let cancelled = false
    const interval = setInterval(() => {
      if (cancelled) return
      if (!window.google?.accounts?.id) return
      clearInterval(interval)
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      })
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 280,
        })
      }
    }, 100)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isLoggedIn, googleClientId, page])

  function handleLogin() {
    setIsLoggedIn(true)
    setPage('dashboard')
    localStorage.setItem('tp_logged_in', 'true')
  }

  function handleLogout() {
    setIsLoggedIn(false)
    setPage('signin')
    localStorage.removeItem('tp_logged_in')
    setAuthError('')
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect()
    }
  }

  async function handleGoogleCredential(response) {
    setAuthError('')
    try {
      const resp = await fetch('/api/auth/google/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        setAuthError(data.detail || 'Sign-in failed.')
        return
      }
      handleLogin()
    } catch (err) {
      setAuthError('Network error. Try again.')
    }
  }

  function resetAuthForm() {
    setFormUsername('')
    setFormPassword('')
    setFormName('')
    setAuthError('')
  }

  function goToSignUp() {
    resetAuthForm()
    setPage('signup')
  }

  function goToSignIn() {
    resetAuthForm()
    setPage('signin')
  }

  async function handleSignup(e) {
    e.preventDefault()
    setAuthError('')
    setAuthSubmitting(true)
    try {
      const resp = await fetch('/api/auth/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formUsername,
          password: formPassword,
          name: formName,
        }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        setAuthError(data.detail || 'Could not create account.')
        setAuthSubmitting(false)
        return
      }
      resetAuthForm()
      setAuthSubmitting(false)
      handleLogin()
    } catch (err) {
      setAuthError('Network error. Try again.')
      setAuthSubmitting(false)
    }
  }

  async function handleSigninSubmit(e) {
    e.preventDefault()
    setAuthError('')
    setAuthSubmitting(true)
    try {
      const resp = await fetch('/api/auth/signin/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formUsername,
          password: formPassword,
        }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        setAuthError(data.detail || 'Sign-in failed.')
        setAuthSubmitting(false)
        return
      }
      resetAuthForm()
      setAuthSubmitting(false)
      handleLogin()
    } catch (err) {
      setAuthError('Network error. Try again.')
      setAuthSubmitting(false)
    }
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
    setSelectedDate(ymd)
  }

  const filteredResults = useMemo(() => {
    if (!selectedDate) return []
    return results.filter((ev) => toYmd(ev.date) === selectedDate)
  }, [results, selectedDate])

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={`app ${mode}`}>
        <NavBar
          isLoggedIn={isLoggedIn}
          page={page}
          onSignUp={goToSignUp}
          onSignIn={goToSignIn}
          onHome={goToDashboard}
          onSaved={goToSaved}
          onSignOut={handleLogout}
          mode={mode}
          toggleColorMode={toggleColorMode}
        />

      {!isLoggedIn && (page === 'signin' || page === 'signup') && (
        <AuthPage
            mode={page}
            handleSigninSubmit={handleSigninSubmit}
            handleSignup={handleSignup}
            formUsername={formUsername}
            setFormUsername={setFormUsername}
            formPassword={formPassword}
            setFormPassword={setFormPassword}
            formName={formName}
            setFormName={setFormName}
            authError={authError}
            authSubmitting={authSubmitting}
            googleClientId={googleClientId}
            googleButtonRef={googleButtonRef}
        />
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
                    <EventCard
                      key={event.external_id || `${event.title}-${index}`}
                      event={event}
                      onClick={() => setSelectedEventForModal(event)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          saveEvent(event)
                        }}
                        disabled={isEventSaved(event)}
                      >
                        {isEventSaved(event) ? 'Saved' : 'Save'}
                      </button>
                    </EventCard>
                  ))}
                </div>
              )}
            </div>

            <div className="right-column">
              <Calendar
                viewYear={viewYear}
                viewMonth={viewMonth}
                selectedDate={selectedDate}
                results={results}
                prevMonth={prevMonth}
                nextMonth={nextMonth}
                handleDayClick={handleDayClick}
              />
            </div>
          </div>
        </main>
      )}

      {isLoggedIn && page === 'saved' && (
        <SavedEvents
          savedEvents={savedEvents}
          getEventKey={getEventKey}
          editingEventKey={editingEventKey}
          editingNote={editingNote}
          setEditingNote={setEditingNote}
          saveNote={saveNote}
          cancelEditing={cancelEditing}
          startEditing={startEditing}
          deleteEvent={deleteEvent}
          setSelectedEventForModal={setSelectedEventForModal}
        />
      )}

      <EventModal
        open={!!selectedEventForModal}
        handleClose={() => setSelectedEventForModal(null)}
        event={selectedEventForModal}
      />
    </div>
    </ThemeProvider>
  )
}

export default App