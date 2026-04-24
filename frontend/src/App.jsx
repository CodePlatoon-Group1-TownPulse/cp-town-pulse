import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Container, Typography, Box, Divider, ThemeProvider, createTheme, CssBaseline } from "@mui/material"
import { useState, useMemo, useEffect } from 'react'

import Signup from "./pages/Signup"
import Login from "./pages/Login"
import Navbar from "./components/Navbar"
import Dashboard from "./pages/Dashboard"
import SavedEvents from "./pages/SavedEvents"

import './App.css'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

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

export default function App() {
  // Theme state
  const [mode, setMode] = useState('light')

  // them != theme
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: '#1976d2', // color is "Professional Blue"
      },
      secondary: {
        main: '#dc004e', // color is red
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
      }
    },
    shape: {
      borderRadius: 8, 
    }
  }), [mode])

  const toggleColorMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'))

  // end Theme State

  // Town Pulse Global Logic
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
    const stored = localStorage.getItem('tp_saved_events')
    if (stored) {
      try {
        setSavedEvents(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse saved events", e)
      }
    }
  }, [])

  // keep saved events when they change
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

  function clearSelectedDate() {
    setSelectedDate(null)
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
          
          <Navbar mode={mode} toggleColorMode={toggleColorMode} />

          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
            <Routes>
              {/* Main Feed */}
              <Route 
                path="/" 
                element={<Dashboard savedEvents={savedEvents} setSavedEvents={setSavedEvents} />} 
              />

              {/* Saved Items */}
              <Route 
                path="/saved" 
                element={<SavedEvents savedEvents={savedEvents} setSavedEvents={setSavedEvents} />} 
              />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Container>

          <Divider />
          <Box component="footer" sx={{ py: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
            <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
              Town Pulse • {new Date().getFullYear()}
            </Box>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  )













}