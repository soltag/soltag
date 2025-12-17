import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, User, Shield, ExternalLink, QrCode } from 'lucide-react';
import { mockEvents, formatDate, formatTime, getEventStatus } from '../data/mockData';
import './EventDetailScreen.css';

export default function EventDetailScreen() {
    const { id } = useParams();
    const navigate = useNavigate();

    const event = mockEvents.find(e => e.id === id);

    if (!event) {
        return (
            <div className="event-detail-screen">
                <div className="event-not-found">
                    <p>Event not found</p>
                    <button className="btn btn-primary" onClick={() => navigate('/events')}>
                        Back to Events
                    </button>
                </div>
            </div>
        );
    }

    const status = getEventStatus(event);

    const handleScan = () => {
        navigate('/scan', { state: { eventId: event.id } });
    };

    return (
        <div className="event-detail-screen">
            {/* Header image */}
            <div className="event-hero">
                {event.image ? (
                    <img src={event.image} alt={event.name} className="event-hero-image" />
                ) : (
                    <div className="event-hero-placeholder" />
                )}
                <div className="event-hero-overlay" />
                <button className="back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <div className={`event-status-badge ${status}`}>
                    {status === 'active' ? 'Live Now' : status === 'upcoming' ? 'Upcoming' : 'Ended'}
                </div>
            </div>

            <div className="event-detail-content animate-slide-up">
                <h1 className="event-detail-title">{event.name}</h1>

                {/* Meta info */}
                <div className="event-meta">
                    <div className="meta-item">
                        <Calendar size={18} />
                        <span>{formatDate(event.start_ts)}</span>
                    </div>
                    <div className="meta-item">
                        <Clock size={18} />
                        <span>{formatTime(event.start_ts)} - {formatTime(event.end_ts)}</span>
                    </div>
                    {event.location && (
                        <div className="meta-item">
                            <MapPin size={18} />
                            <span>{event.location}</span>
                        </div>
                    )}
                    <div className="meta-item">
                        <User size={18} />
                        <span>{event.organizer.name}</span>
                    </div>
                </div>

                {/* Description */}
                {event.description && (
                    <div className="event-description">
                        <h2>About this event</h2>
                        <p>{event.description}</p>
                    </div>
                )}

                {/* Privacy notice */}
                <div className="privacy-notice">
                    <Shield size={18} />
                    <div>
                        <strong>Privacy Protected</strong>
                        <p>Only a hashed location zone is stored on-chain. Your exact GPS is never recorded.</p>
                    </div>
                </div>

                {/* What gets minted */}
                <div className="mint-info">
                    <h2>What gets minted</h2>
                    <ul>
                        <li>Event ID: <code>{event.id}</code></li>
                        <li>Zone hash (privacy-preserving)</li>
                        <li>Timestamp of attendance</li>
                        <li>Non-transferable (Soulbound)</li>
                    </ul>
                </div>

                {/* Report link */}
                <button className="report-link">
                    <ExternalLink size={16} />
                    <span>Report an issue</span>
                </button>
            </div>

            {/* Floating CTA */}
            {status !== 'past' && !event.attended && (
                <div className="floating-cta">
                    <button className="btn btn-primary btn-lg btn-full" onClick={handleScan}>
                        <QrCode size={22} />
                        Scan to Check-In
                    </button>
                </div>
            )}

            {event.attended && (
                <div className="floating-cta">
                    <div className="attended-notice">
                        <span>✓ You've already checked in to this event</span>
                    </div>
                </div>
            )}
        </div>
    );
}
