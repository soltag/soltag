import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';

// Entry & Onboarding
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ConnectWalletScreen from './screens/ConnectWalletScreen';

// Main Experience
import HomeScreen from './screens/HomeScreen';
import EventsListScreen from './screens/EventsListScreen';
import EventDetailScreen from './screens/EventDetailScreen';
import CreateEventScreen from './screens/CreateEventScreen';

// Event Attendance Flow
import ScanScreen from './screens/ScanScreen';
import VerifyScanScreen from './screens/VerifyScanScreen';
import ConfirmMintScreen from './screens/ConfirmMintScreen';
import TransactionPendingScreen from './screens/TransactionPendingScreen';
import MintSuccessScreen from './screens/MintSuccessScreen';

// Profile & Credentials
import ProfileScreen from './screens/ProfileScreen';
import CredentialDetailScreen from './screens/CredentialDetailScreen';
import OfflineQueueScreen from './screens/OfflineQueueScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';

// Utility
import SettingsScreen from './screens/SettingsScreen';
import HelpPrivacyScreen from './screens/HelpPrivacyScreen';

import AppLock from './components/AppLock';
import { useAuthStore } from './stores/authStore';

function App() {
    console.log('[App] [Lifecycle] Rendering App component...');
    const navigate = useNavigate();
    const initializeAuth = useAuthStore(state => state.initialize);
    const isInitialized = useAuthStore(state => state.isInitialized);

    // Initialize Auth Store
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        console.log('[App] [Lifecycle] App mounted, setting up listeners');
        // Global listener for deep-links
        let urlListener: any;
        let stateListener: any;

        const setupListeners = async () => {
            try {
                urlListener = await CapApp.addListener('appUrlOpen', (event) => {
                    console.log('[App] [Lifecycle] Deep link received:', event.url);

                    // If it's a soltag callback, handle navigation
                    if (event.url.includes('soltag://')) {
                        try {
                            const url = new URL(event.url);
                            const search = url.search || '';

                            console.log('[App] [Routing] Navigating to:', `/connect${search}`);
                            navigate(`/connect${search}`, { replace: true });
                        } catch (e) {
                            console.error('[App] [Error] Failed to parse deep link URL:', e);
                        }
                    }
                });

                stateListener = await CapApp.addListener('appStateChange', (state) => {
                    console.log('[App] [Lifecycle] App state changed to:', state.isActive ? 'FOREGROUND' : 'BACKGROUND');
                });
            } catch (err) {
                console.error('[App] [Error] Failed to setup listeners:', err);
            }
        };

        setupListeners();

        return () => {
            console.log('[App] [Lifecycle] App unmounting, cleaning up listeners');
            if (urlListener && typeof urlListener.remove === 'function') {
                urlListener.remove();
            }
            if (stateListener && typeof stateListener.remove === 'function') {
                stateListener.remove();
            }
        };
    }, [navigate]);

    if (!isInitialized) {
        return <SplashScreen />; // Show splash while restoring session
    }

    return (
        <AppLock>
            <Routes>
                {/* Entry & Onboarding */}
                <Route path="/" element={<SplashScreen />} />
                <Route path="/onboarding" element={<OnboardingScreen />} />
                <Route path="/connect" element={<ConnectWalletScreen />} />

                {/* Main Experience */}
                <Route path="/home" element={<HomeScreen />} />
                <Route path="/events" element={<EventsListScreen />} />
                <Route path="/event/:id" element={<EventDetailScreen />} />
                <Route path="/create-event" element={<CreateEventScreen />} />

                {/* Event Attendance Flow */}
                <Route path="/scan" element={<ScanScreen />} />
                <Route path="/verify" element={<VerifyScanScreen />} />
                <Route path="/confirm" element={<ConfirmMintScreen />} />
                <Route path="/pending" element={<TransactionPendingScreen />} />
                <Route path="/success" element={<MintSuccessScreen />} />

                {/* Profile & Credentials */}
                <Route path="/profile" element={<ProfileScreen />} />
                <Route path="/credential/:id" element={<CredentialDetailScreen />} />
                <Route path="/queue" element={<OfflineQueueScreen />} />
                <Route path="/leaderboard" element={<LeaderboardScreen />} />

                {/* Utility */}
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="/help" element={<HelpPrivacyScreen />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AppLock>
    );
}

export default App;
