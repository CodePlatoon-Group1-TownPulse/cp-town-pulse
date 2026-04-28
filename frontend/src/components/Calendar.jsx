import { useMemo } from 'react'
import { buildYmd, toYmd } from '../utils/date'
import { MONTH_NAMES } from '../constants'

export default function Calendar({ 
  viewYear, 
  viewMonth, 
  selectedDate, 
  results, 
  prevMonth, 
  nextMonth, 
  handleDayClick 
}) {
  const today = new Date()
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

  return (
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
  )
}
