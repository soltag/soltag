import { Routes, Route, Navigate } from 'react-router-dom';

// Entry & Onboarding
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ConnectWalletScreen from './screens/ConnectWalletScreen';

// Main Experience
import HomeScreen from './screens/HomeScreen';
import EventsListScreen from './screens/EventsListScreen';
import EventDetailScreen from './screens/EventDetailScreen';

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

function App() {
    return (
        <Routes>
            {/* Entry & Onboarding */}
            <Route path="/" element={<SplashScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/connect" element={<ConnectWalletScreen />} />

            {/* Main Experience */}
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/events" element={<EventsListScreen />} />
            <Route path="/event/:id" element={<EventDetailScreen />} />

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
    );
}

export default App;
