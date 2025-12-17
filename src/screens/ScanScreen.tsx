import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft, Camera, MapPin, Keyboard, Copy, AlertCircle, Wallet } from 'lucide-react';
import jsQR from 'jsqr';
import './ScanScreen.css';

export default function ScanScreen() {
    const navigate = useNavigate();
    const { publicKey } = useWallet();
    const [scanning, setScanning] = useState(true);
    const [useLocation, setUseLocation] = useState(true);
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();

    // Navigation Guard: Must have a wallet connected to scan
    useEffect(() => {
        if (!publicKey && !localStorage.getItem('soltag_wallet_pubkey')) {
            // No wallet connected or stored, redirect
            navigate('/connect', { state: { from: '/scan', message: 'Please connect your wallet to scan events.' } });
        }
    }, [publicKey, navigate]);

    // Initialize camera
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                setError(null);
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
                    videoRef.current.play();
                }
            } catch (err) {
                console.error('Camera access error:', err);
                setError('Could not access camera. Please check permissions.');
                setScanning(false);
            }
        };

        if (scanning && !showManualInput && publicKey) {
            startCamera();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [scanning, showManualInput, publicKey]);

    // Scanning loop
    useEffect(() => {
        const tick = () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                const canvas = canvasRef.current;
                const video = videoRef.current;

                if (canvas) {
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (ctx) {
                        canvas.height = video.videoHeight;
                        canvas.width = video.videoWidth;
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: 'dontInvert',
                        });

                        if (code) {
                            handleScanSuccess(code.data);
                            return; // Stop loop
                        }
                    }
                }
            }
            requestRef.current = requestAnimationFrame(tick);
        };

        if (scanning && !showManualInput && !error && publicKey) {
            requestRef.current = requestAnimationFrame(tick);
        }

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [scanning, showManualInput, error, publicKey]);

    const handleScanSuccess = (rawData?: string) => {
        setScanning(false);

        // In production, parse/validate rawData. 
        let payload = null;
        if (rawData) {
            try {
                payload = JSON.parse(rawData);
            } catch (e) {
                console.warn('QR data is not JSON, using fallback mock for demo');
            }
        }

        const qrPayload = payload || {
            v: 1,
            event_pubkey: '8yLXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgBsV',
            start_ts: Date.now() - 3600000,
            end_ts: Date.now() + 7200000,
            zone_code: 'dr5ru',
            nonce: `nonce-${Date.now()}`,
            meta: { name: 'Web3 Builders Night' },
            sig: 'ed25519-demo-signature'
        };

        navigate('/verify', { state: { qrPayload } });
    };

    const handleManualSubmit = () => {
        if (manualCode.trim()) {
            handleScanSuccess();
        }
    };

    return (
        <div className="scan-screen">
            {/* Camera preview */}
            <div className="camera-preview">
                {scanning && !showManualInput && !error && publicKey && (
                    <video ref={videoRef} className="video-feed" />
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                <div className="camera-gradient-top" />
                <div className="camera-gradient-bottom" />

                {/* Back button */}
                <button className="scan-back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>

                {!publicKey && (
                    <div className="camera-error animate-fade-in">
                        <Wallet size={48} color="var(--color-primary)" />
                        <p>Connecting wallet...</p>
                    </div>
                )}

                {error && publicKey && (
                    <div className="camera-error animate-fade-in">
                        <AlertCircle size={48} color="var(--color-error)" />
                        <p>{error}</p>
                        <button className="btn btn-secondary" onClick={() => setScanning(true)}>
                            Try Again
                        </button>
                    </div>
                )}

                {/* Scan overlay */}
                {!showManualInput && !error && publicKey && (
                    <div className="scan-overlay">
                        <div className="scan-frame">
                            <div className="scan-corner scan-corner-tl" />
                            <div className="scan-corner scan-corner-tr" />
                            <div className="scan-corner scan-corner-bl" />
                            <div className="scan-corner scan-corner-br" />
                            {scanning && <div className="scan-line" />}
                        </div>
                        <p className="scan-hint">Align QR code inside the box</p>
                    </div>
                )}

                {/* Manual input overlay */}
                {showManualInput && (
                    <div className="manual-input-overlay animate-fade-in">
                        <div className="manual-input-card">
                            <h2>Enter Code Manually</h2>
                            <p>Paste or type the event code from the QR</p>
                            <div className="manual-input-field">
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Event code..."
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                />
                                <button className="paste-btn" aria-label="Paste from clipboard">
                                    <Copy size={18} />
                                </button>
                            </div>
                            <div className="manual-input-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowManualInput(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleManualSubmit}
                                    disabled={!manualCode.trim()}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom controls */}
            <div className="scan-controls">
                <div className="scan-options">
                    <button
                        className="scan-option"
                        onClick={() => setShowManualInput(true)}
                        disabled={!publicKey}
                    >
                        <Keyboard size={20} />
                        <span>Manual Code</span>
                    </button>

                    <button
                        className={`scan-option location-toggle ${useLocation ? 'active' : ''}`}
                        onClick={() => setUseLocation(!useLocation)}
                        disabled={!publicKey}
                    >
                        <MapPin size={20} />
                        <span>Location {useLocation ? 'On' : 'Off'}</span>
                    </button>
                </div>

                <div className="camera-status">
                    <Camera size={16} />
                    <span>{scanning && publicKey ? 'Scanning...' : 'Ready'}</span>
                </div>
            </div>
        </div>
    );
}
