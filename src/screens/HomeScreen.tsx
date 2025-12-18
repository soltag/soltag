import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ChevronRight, Trophy, Sparkles } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import CredentialCard from '../components/CredentialCard';
import EventCard from '../components/EventCard';
import { getCredentials } from '../services/api';
import { eventService } from '../services/eventService';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuthStore } from '../stores/authStore';




import type { Credential, Event } from '../types';
import './HomeScreen.css';

export default function HomeScreen() {
    const navigate = useNavigate();
    const { publicKey: walletPubKey } = useAuthStore();
    const { publicKey } = useWallet();

    // Derive address: use adapter if connected, else fallback to store
    const currentAddress = publicKey ? publicKey.toBase58() : walletPubKey;


    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const [creds, evts] = await Promise.all([
                currentAddress ? getCredentials(currentAddress) : Promise.resolve([]),
                eventService.getEvents()
            ]);
            setCredentials(creds);
            setEvents(evts);
        };
        loadData();
    }, [currentAddress]);



    const recentCredentials = credentials.slice(0, 3);

    const handleScanClick = () => {
        navigate('/scan');
    };

    return (
        <div className="home-screen">
            <div className="home-content">
                {/* Header */}
                <header className="home-header animate-fade-in">
                    <h1 className="home-title">Welcome to SOLTAG</h1>
                    <p className="home-subtitle">Your on-chain proof of presence</p>
                </header>

                {/* Primary CTA */}
                <button className="scan-cta animate-slide-up" onClick={handleScanClick}>
                    <div className="scan-cta-icon">
                        <QrCode size={28} />
                    </div>
                    <div className="scan-cta-content">
                        <span className="scan-cta-title">Scan QR to Check In</span>
                        <span className="scan-cta-subtitle">Scan an event QR code to mint your credential</span>
                    </div>
                    <ChevronRight size={24} className="scan-cta-arrow" />
                </button>

                {/* Leaderboard CTA */}
                <button className="rank-cta animate-slide-up" onClick={() => navigate('/leaderboard')}>
                    <div className="rank-cta-icon">
                        <Trophy size={24} />
                    </div>
                    <div className="rank-cta-content">
                        <span className="rank-cta-title">View Leaderboard</span>
                        <span className="rank-cta-subtitle">See top attendees and your rank</span>
                    </div>
                    <ChevronRight size={20} className="rank-cta-arrow" />
                </button>

                {/* Recent Credentials */}
                {recentCredentials.length > 0 && (
                    <section className="home-section animate-slide-up">
                        <div className="section-header">
                            <h2 className="section-title">Recent credentials</h2>
                            <button className="section-link" onClick={() => navigate('/profile')}>
                                View all
                            </button>
                        </div>
                        <div className="credentials-carousel">
                            {recentCredentials.map(credential => (
                                <CredentialCard
                                    key={credential.id}
                                    credential={credential}
                                    variant="compact"
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Nearby Events */}
                <section className="home-section animate-slide-up">
                    <div className="section-header">
                        <h2 className="section-title">Events Feed</h2>
                        <button className="section-link" onClick={() => navigate('/create-event')}>
                            + Host Event
                        </button>
                    </div>

                    {/* Create Event Prompt */}
                    <div className="create-event-promo" onClick={() => navigate('/create-event')}>
                        <div className="promo-icon">✨</div>
                        <div className="promo-text">
                            <h3>Host your own event</h3>
                            <p>Organize specific meetups and issue on-chain credentials</p>
                        </div>
                        <div className="promo-arrow">→</div>
                    </div>

                    <div className="events-list">
                        {events.length > 0 ? (
                            events.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))
                        ) : (
                            <p className="empty-state">No upcoming events found.</p>
                        )}
                    </div>
                </section>

                {/* Suggestion */}
                <div className="home-suggestion animate-fade-in">
                    <p><Sparkles size={16} className="suggestion-icon" /> Attend events to earn badges and build your on-chain reputation</p>
                </div>
            </div>

            <BottomNav activeTab="home" />
        </div>
    );
}
