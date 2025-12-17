import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Clock, MapPin, Shield, AlertTriangle } from 'lucide-react';
import type { VerificationStatus, QRPayload } from '../types';
import './VerifyScanScreen.css';

export default function VerifyScanScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const qrPayload = location.state?.qrPayload as QRPayload | undefined;

    const [status, setStatus] = useState<VerificationStatus>({
        signature: 'checking',
        timeWindow: 'checking',
        location: 'checking',
        duplicate: 'checking'
    });

    const allPassed =
        status.signature === 'valid' &&
        status.timeWindow === 'valid' &&
        status.location === 'valid' &&
        status.duplicate === 'clear';

    const hasFailed =
        status.signature === 'invalid' ||
        status.timeWindow === 'expired' ||
        status.location === 'mismatch' ||
        status.duplicate === 'duplicate';

    // Simulate verification checks
    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];

        timers.push(setTimeout(() => {
            setStatus(s => ({ ...s, signature: 'valid' }));
        }, 800));

        timers.push(setTimeout(() => {
            setStatus(s => ({ ...s, timeWindow: 'valid' }));
        }, 1200));

        timers.push(setTimeout(() => {
            setStatus(s => ({ ...s, location: 'valid' }));
        }, 1800));

        timers.push(setTimeout(() => {
            setStatus(s => ({ ...s, duplicate: 'clear' }));
        }, 2200));

        return () => timers.forEach(clearTimeout);
    }, []);

    const handleProceed = () => {
        navigate('/confirm', { state: { qrPayload } });
    };

    const getStatusIcon = (check: string) => {
        switch (check) {
            case 'valid':
            case 'clear':
                return <CheckCircle size={20} className="status-icon success" />;
            case 'invalid':
            case 'expired':
            case 'mismatch':
            case 'duplicate':
                return <XCircle size={20} className="status-icon error" />;
            case 'notStarted':
            case 'denied':
                return <AlertTriangle size={20} className="status-icon warning" />;
            default:
                return <Loader2 size={20} className="status-icon checking animate-spin" />;
        }
    };

    const getStatusLabel = (type: string, value: string) => {
        const labels: Record<string, Record<string, string>> = {
            signature: {
                checking: 'Verifying QR signature...',
                valid: 'QR signature verified',
                invalid: 'Invalid or tampered QR'
            },
            timeWindow: {
                checking: 'Checking time window...',
                valid: 'Within valid time window',
                expired: 'Check-in window has closed',
                notStarted: 'Check-in window not started'
            },
            location: {
                checking: 'Verifying location zone...',
                valid: 'You appear in the correct zone',
                mismatch: 'Zone mismatch detected',
                denied: 'Location permission denied'
            },
            duplicate: {
                checking: 'Checking for duplicates...',
                clear: 'No duplicate attendance found',
                duplicate: 'You already checked in'
            }
        };
        return labels[type]?.[value] || 'Unknown status';
    };

    return (
        <div className="verify-screen">
            <header className="verify-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>Verify Check-In</h1>
            </header>

            <div className="verify-content animate-slide-up">
                {/* Event info from QR */}
                <div className="verify-event-card">
                    <h2>{qrPayload?.meta?.name || 'Event'}</h2>
                    <p className="verify-event-meta">
                        Scanned from event QR code
                    </p>
                </div>

                {/* Verification checks */}
                <div className="verification-checks">
                    <div className={`check-item ${status.signature !== 'checking' ? status.signature : ''}`}>
                        {getStatusIcon(status.signature)}
                        <div className="check-content">
                            <Shield size={16} className="check-type-icon" />
                            <span>{getStatusLabel('signature', status.signature)}</span>
                        </div>
                    </div>

                    <div className={`check-item ${status.timeWindow !== 'checking' ? status.timeWindow : ''}`}>
                        {getStatusIcon(status.timeWindow)}
                        <div className="check-content">
                            <Clock size={16} className="check-type-icon" />
                            <span>{getStatusLabel('timeWindow', status.timeWindow)}</span>
                        </div>
                    </div>

                    <div className={`check-item ${status.location !== 'checking' ? (status.location === 'valid' ? 'valid' : 'error') : ''}`}>
                        {getStatusIcon(status.location)}
                        <div className="check-content">
                            <MapPin size={16} className="check-type-icon" />
                            <span>{getStatusLabel('location', status.location)}</span>
                        </div>
                    </div>

                    <div className={`check-item ${status.duplicate !== 'checking' ? (status.duplicate === 'clear' ? 'valid' : 'error') : ''}`}>
                        {getStatusIcon(status.duplicate)}
                        <div className="check-content">
                            <CheckCircle size={16} className="check-type-icon" />
                            <span>{getStatusLabel('duplicate', status.duplicate)}</span>
                        </div>
                    </div>
                </div>

                {/* Success message */}
                {allPassed && (
                    <div className="verify-success animate-fade-in">
                        <CheckCircle size={24} />
                        <span>QR verified — you're in the right place</span>
                    </div>
                )}

                {/* Error message */}
                {hasFailed && (
                    <div className="verify-error animate-fade-in">
                        <XCircle size={24} />
                        <span>Verification failed — contact the event organizer</span>
                    </div>
                )}

                {/* Privacy notice */}
                <p className="privacy-note">
                    Your exact GPS location is never stored. Only a hashed zone code is used.
                </p>
            </div>

            {/* Actions */}
            <div className="verify-actions">
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                >
                    Cancel
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleProceed}
                    disabled={!allPassed}
                >
                    Proceed
                </button>
            </div>
        </div>
    );
}
