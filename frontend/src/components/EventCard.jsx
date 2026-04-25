import { formatDateMDY } from '../utils/date'

function EventCard({ event, children }) {
    const title = event.title || 'Untitled event'

    return (
        <div className="event-card">
            {event.url ? (
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
            ) : (
                <h2>{title}</h2>
            )}
            <p>{formatDateMDY(event.date) || 'No date'}</p>
            {event.location_address && <p>{event.location_address}</p>}
            {event.description && <p className="event-description">{event.description}</p>}
            {children}
        </div>
    )
}

export default EventCard