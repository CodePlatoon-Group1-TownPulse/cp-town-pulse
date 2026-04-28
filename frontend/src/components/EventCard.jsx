import { formatDateMDY } from '../utils/date'

function EventCard({ event, children, onClick }) {
    const title = event.title || 'Untitled event'

    return (
        <div 
            className="event-card" 
            onClick={onClick} 
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <h2>{title}</h2>
            <p>{formatDateMDY(event.date) || 'No date'}</p>
            {event.location_address && <p>{event.location_address}</p>}
            {event.description && <p className="event-description">{event.description}</p>}
            {children}
        </div>
    )
}

export default EventCard