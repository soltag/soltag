import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import EventCard from '../components/EventCard';
import { mockEvents, getEventStatus } from '../data/mockData';
import './EventsListScreen.css';

type Filter = 'nearby' | 'upcoming' | 'past' | 'bookmarked';

export default function EventsListScreen() {
    const [activeFilter, setActiveFilter] = useState<Filter>('nearby');
    const [events, setEvents] = useState(mockEvents);

    const filteredEvents = events.filter(event => {
        const status = getEventStatus(event);
        switch (activeFilter) {
            case 'nearby':
                return status !== 'past';
            case 'upcoming':
                return status === 'upcoming';
            case 'past':
                return status === 'past';
            case 'bookmarked':
                return event.bookmarked;
            default:
                return true;
        }
    });

    const handleBookmark = (eventId: string) => {
        setEvents(events.map(e =>
            e.id === eventId ? { ...e, bookmarked: !e.bookmarked } : e
        ));
    };

    const filters: { key: Filter; label: string }[] = [
        { key: 'nearby', label: 'Nearby' },
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'past', label: 'Past' },
        { key: 'bookmarked', label: 'Bookmarked' },
    ];

    return (
        <div className="events-list-screen">
            <div className="events-content">
                <header className="events-header animate-fade-in">
                    <h1 className="events-title">Events</h1>
                </header>

                {/* Filter tabs */}
                <div className="filter-tabs animate-fade-in">
                    {filters.map(filter => (
                        <button
                            key={filter.key}
                            className={`filter-tab ${activeFilter === filter.key ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter.key)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Events list */}
                <div className="events-list animate-slide-up">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onBookmark={handleBookmark}
                            />
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No events found</p>
                            <span>Try a different filter or check back later</span>
                        </div>
                    )}
                </div>
            </div>

            <BottomNav activeTab="events" />
        </div>
    );
}
