import { useNavigate } from 'react-router-dom';
import { MapPin, Bookmark, CheckCircle2, Loader2, Check } from 'lucide-react';
import type { Event } from '../types';
import { formatDateTime, getEventStatus, getTimeLabel } from '../data/mockData';
import './EventCard.css';

interface EventCardProps {
    event: Event;
    onBookmark?: (eventId: string) => void;
}

export default function EventCard({ event, onBookmark }: EventCardProps) {
    const navigate = useNavigate();
    const status = getEventStatus(event);
    const isPending = event.status === 'pending';
    const isConfirmed = event.status === 'confirmed' || event.status === 'finalized';

    const handleClick = () => {
        // Prevent navigation if pending? Or allow to see detail pending state?
        // For now, allow navigation
        navigate(`/event/${event.id}`);
    };

    const handleBookmark = (e: React.MouseEvent) => {
        e.stopPropagation();
        onBookmark?.(event.id);
    };

    return (
        <article className={`event-card ${isPending ? 'event-card-pending' : ''}`} onClick={handleClick}>
            <div className="event-image">
                {event.image ? (
                    <img src={event.image} alt={event.name} />
                ) : (
                    <div className="event-image-placeholder" />
                )}

                {/* Status Badges */}
                {event.attended && (
                    <div className="event-attended-badge">
                        <CheckCircle2 size={12} />
                        <span>Attended</span>
                    </div>
                )}

                {isPending && (
                    <div className="event-status-badge pending">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Pending</span>
                    </div>
                )}

                {isConfirmed && (
                    <div className="event-status-badge confirmed">
                        <Check size={12} />
                        <span>Confirmed</span>
                    </div>
                )}
            </div>

            <div className="event-content">
                <div className="event-header">
                    <h3 className="event-title">{event.name}</h3>
                    {!isPending && (
                        <button
                            className={`event-bookmark ${event.bookmarked ? 'active' : ''}`}
                            onClick={handleBookmark}
                            aria-label={event.bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                        >
                            <Bookmark size={18} fill={event.bookmarked ? 'currentColor' : 'none'} />
                        </button>
                    )}
                </div>

                <p className="event-datetime">
                    {formatDateTime(event.start_ts)}
                </p>

                {event.location && (
                    <p className="event-location">
                        <MapPin size={14} />
                        <span>{event.location}</span>
                    </p>
                )}

                <div className="event-footer">
                    <span className="event-organizer">
                        {event.organizer.name}
                    </span>
                    <span className={`event-status ${status}`}>
                        {status === 'active' ? 'Live Now' :
                            status === 'upcoming' ? getTimeLabel(event.start_ts) :
                                'Ended'}
                    </span>
                </div>
            </div>
        </article>
    );
}
