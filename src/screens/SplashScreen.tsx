import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { secureGet, STORAGE_KEYS } from '../storage/secureStorage';
import './SplashScreen.css';

export default function SplashScreen() {
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            // Check if first run
            const hasCompletedOnboarding = await secureGet(STORAGE_KEYS.ONBOARDING_COMPLETE);
            const walletConnected = await secureGet(STORAGE_KEYS.AUTH_TOKEN);

            // Give the splash screen at least 2 seconds of airtime
            setTimeout(() => {
                if (!hasCompletedOnboarding) {
                    navigate('/onboarding');
                } else if (!walletConnected) {
                    navigate('/connect');
                } else {
                    navigate('/home');
                }
            }, 2000);
        };

        init();
    }, [navigate]);

    return (
        <div className="splash-screen">
            <div className="splash-content animate-fade-in">
                <div className="splash-logo">
                    <img
                        src="/logos/logo splash screen.png"
                        alt="SOLTAG Logo"
                        className="splash-logo-image"
                    />
                </div>

                <h1 className="splash-title">SOLTAG</h1>
                <p className="splash-tagline">Your on-chain proof of presence.</p>

                <div className="splash-loader">
                    <Loader2 className="animate-spin" size={24} />
                </div>
            </div>

            {/* Decorative elements */}
            <div className="splash-decoration" aria-hidden="true">
                <div className="splash-circle splash-circle-1" />
                <div className="splash-circle splash-circle-2" />
                <div className="splash-circle splash-circle-3" />
            </div>
        </div>
    );
}
