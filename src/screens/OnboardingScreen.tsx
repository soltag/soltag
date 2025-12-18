import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, Bell, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import './OnboardingScreen.css';

interface Slide {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const slides: Slide[] = [
    {
        icon: <Scan size={48} />,
        title: 'What is SOLTAG?',
        description: 'SOLTAG lets you prove real-world attendance on Solana. Scan a QR code at any event to mint a permanent, verifiable credential.',
    },
    {
        icon: <img src="/logos/splash screen two.png" alt="Privacy First" className="onboarding-logo-img" />,
        title: 'Privacy First',
        description: 'We never store exact GPS. Only hashed location zones go on-chain. Your presence is verified, not tracked.',
    },
    {
        icon: <img src="/logos/splash sreen three.png" alt="How It Works" className="onboarding-logo-img" />,
        title: 'How It Works',
        description: 'Scan → Verify → Mint → Done. One tap to sign with your wallet. Your credential appears instantly.',
    },
    {
        icon: <Bell size={48} />,
        title: 'Permissions',
        description: "Camera and location are used only during check-in. We'll ask when needed, not before.",
    },
];

export default function OnboardingScreen() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    const isLastSlide = currentSlide === slides.length - 1;

    const handleNext = () => {
        if (isLastSlide) {
            handleGetStarted();
        } else {
            setCurrentSlide(currentSlide + 1);
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleSkip = () => {
        handleGetStarted();
    };

    const setHasCompletedOnboarding = useAuthStore(state => state.setHasCompletedOnboarding);

    const handleGetStarted = async () => {
        await setHasCompletedOnboarding(true);
        navigate('/connect');
    };

    const slide = slides[currentSlide];

    return (
        <div className="onboarding-screen">
            <div className="onboarding-content animate-fade-in" key={currentSlide}>
                <div className="onboarding-icon">
                    {slide.icon}
                </div>

                <h1 className="onboarding-title">{slide.title}</h1>
                <p className="onboarding-description">{slide.description}</p>
            </div>

            {/* Pagination dots */}
            <div className="onboarding-pagination">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={`pagination-dot ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Navigation controls */}
            <div className="onboarding-controls">
                {currentSlide > 0 ? (
                    <button className="btn btn-ghost" onClick={handlePrev}>
                        <ChevronLeft size={20} />
                        Back
                    </button>
                ) : (
                    <button className="btn btn-ghost" onClick={handleSkip}>
                        Skip
                    </button>
                )}

                <button className="btn btn-primary" onClick={handleNext}>
                    {isLastSlide ? 'Get Started' : 'Next'}
                    {!isLastSlide && <ChevronRight size={20} />}
                </button>
            </div>

            {/* Background decoration */}
            <div className="onboarding-decoration" aria-hidden="true">
                <div className="decoration-glow" />
            </div>
        </div>
    );
}
