import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [page, setPage] = useState('signin')
  const [savedEvents, setSavedEvents] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [area, setArea] = useState('seattle')
  const [monthIndex, setMonthIndex] = useState(8)

  const months = [
    'January 2025',
    'February 2025',
    'March 2025',
    'April 2025',
    'May 2025',
    'June 2025',
    'July 2025',
    'August 2025',
    'September 2025',
    'October 2025',
    'November 2025',
    'December 2025',
  ]

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

  async function loadEvents(selectedArea) {
    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.set('limit', '25')
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
      const newSavedEvents = [...savedEvents, event]
      setSavedEvents(newSavedEvents)
      localStorage.setItem('tp_saved_events', JSON.stringify(newSavedEvents))
    }
  }

  function prevMonth() {
    if (monthIndex > 0) {
      setMonthIndex(monthIndex - 1)
    }
  }

  function nextMonth() {
    if (monthIndex < months.length - 1) {
      setMonthIndex(monthIndex + 1)
    }
  }

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-logo">Town Pulse</div>

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
          <header className="page-header">
            <h1>Local Events</h1>
            <p>Pick an area to see current civic and community events.</p>
          </header>

          <div className="area-bar">
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="seattle">Seattle</option>
              <option value="king-county">King County</option>
              <option value="bellevue">Bellevue</option>
              <option value="redmond">Redmond</option>
            </select>
          </div>

          <div className="dashboard-layout">
            <div className="left-column">
              <div className="cards-grid">
                {loading && <p>Loading events...</p>}

                {!loading && results.length === 0 && <p>No events found.</p>}

                {!loading &&
                  results.map((event, index) => (
                    <div
                      key={event.external_id || `${event.title}-${index}`}
                      className="event-card"
                    >
                      <h2>{event.title || 'Untitled event'}</h2>
                      <p>{event.date || 'No date'}</p>
                      {event.location_address && <p>{event.location_address}</p>}
                      {event.description && <p>{event.description}</p>}
                      <button type="button" onClick={() => saveEvent(event)}>
                        Save
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="right-column">
              <div className="calendar-box">
                <div className="calendar-top">
                  <button type="button" onClick={prevMonth}>{'<'}</button>
                  <h3>{months[monthIndex]}</h3>
                  <button type="button" onClick={nextMonth}>{'>'}</button>
                </div>

                <div className="calendar-days">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>

                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="calendar-date">
                      {i + 1 <= 30 ? i + 1 : ''}
                    </div>
                  ))}
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

            {savedEvents.map((event, index) => (
              <div
                key={event.external_id || `${event.title}-${index}`}
                className="event-card"
              >
                <h2>{event.title || 'Untitled event'}</h2>
                <p>{event.date || 'No date'}</p>
                {event.location_address && <p>{event.location_address}</p>}
                {event.description && <p>{event.description}</p>}
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  )
}

export default App