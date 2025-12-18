import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Clock, MapPin, Shield } from 'lucide-react';
import type { VerificationStatus, QRPayload } from '../types';
import './VerifyScanScreen.css';
import { validateQRPayload, loadUsedNonces, recordNonce } from '../services/qrValidator';
import { verifyZone } from '../services/zone';
import { mockEvents } from '../data/mockData';


export default function VerifyScanScreen() {
    const navigate = useNavigate();
    const location = useLocation();

    const qrPayload = location.state?.qrPayload as QRPayload | undefined;
    const qrRawData = qrPayload ? JSON.stringify(qrPayload) : '';

    const [status, setStatus] = useState<VerificationStatus>({
        signature: 'checking',
        timeWindow: 'checking',
        location: 'checking',
        duplicate: 'checking',
        onChain: 'waiting'
    });

    const [usedNonces, setUsedNonces] = useState<Set<string>>(new Set());

    const [isNoncesLoaded, setIsNoncesLoaded] = useState(false);

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

    // Load nonces on mount
    useEffect(() => {
        loadUsedNonces().then((nonces) => {
            setUsedNonces(nonces);
            setIsNoncesLoaded(true);
        });
    }, []);

    const [errorDetails, setErrorDetails] = useState<string | null>(null);

    // Real verification checks
    useEffect(() => {
        let isCancelled = false;

        const performVerification = async () => {
            if (!qrRawData || !isNoncesLoaded) return;
            setErrorDetails(null);

            // 1. Validate QR (Signature, Time, Nonce)
            const trustedKeys = mockEvents.map(e => e.event_pubkey);
            const result = await validateQRPayload(qrRawData, trustedKeys, usedNonces);

            if (isCancelled) return;

            setStatus(s => ({
                ...s,
                signature: result.signature,
                timeWindow: result.timeWindow,
                duplicate: result.duplicate
            }));

            // Surface specific errors if failed
            if (result.signature === 'invalid') setErrorDetails('QR signature verification failed. The code may be tampered.');
            else if (result.timeWindow === 'expired') setErrorDetails('The check-in window for this event has expired.');
            else if (result.duplicate === 'duplicate') setErrorDetails('This QR code has already been used.');

            // 2. Validate Location (Zone)

            if (result.payload) {
                const zoneResult = await verifyZone([result.payload.zone]);

                if (isCancelled) return;

                const locationStatus = zoneResult.status === 'valid' ? 'valid' : 'mismatch';
                setStatus(s => ({
                    ...s,
                    location: locationStatus
                }));

                // 3. If all passed, record the nonce
                if (
                    result.signature === 'valid' &&
                    result.timeWindow === 'valid' &&
                    result.duplicate === 'clear' &&
                    locationStatus === 'valid'
                ) {
                    await recordNonce(result.payload.nonce, usedNonces);
                }
            } else {
                setStatus(s => ({ ...s, location: 'mismatch' }));
            }
        };

        performVerification();

        return () => {
            isCancelled = true;
        };
    }, [qrRawData, isNoncesLoaded, usedNonces]);

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
                    <h2>Soltag Event</h2>

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
                        <div className="error-text">
                            <span>Verification failed</span>
                            {errorDetails && <p className="error-details">{errorDetails}</p>}
                        </div>
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
                    Proceed to Confirm
                </button>
            </div>
        </div>
    );
}
