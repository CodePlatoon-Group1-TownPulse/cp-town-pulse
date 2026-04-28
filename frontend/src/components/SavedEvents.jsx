import EventCard from './EventCard'

export default function SavedEvents({ 
  savedEvents, 
  getEventKey, 
  editingEventKey, 
  editingNote, 
  setEditingNote, 
  saveNote, 
  cancelEditing, 
  startEditing, 
  deleteEvent, 
  setSelectedEventForModal 
}) {
  return (
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
            <EventCard
              key={event.external_id || `${event.title}-${index}`}
              event={event}
              onClick={() => setSelectedEventForModal(event)}
            >
              {!isEditing && event.notes && (
                <div className="event-notes">
                  <strong>Notes:</strong>
                  <p>{event.notes}</p>
                </div>
              )}

              {isEditing && (
                <div className="event-notes-editor" onClick={(e) => e.stopPropagation()}>
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

              {!isEditing && (
                <div className="card-actions" onClick={(e) => e.stopPropagation()}>
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
            </EventCard>
          )
        })}
      </div>
    </main>
  )
}
