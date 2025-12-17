import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, Keyboard, Copy } from 'lucide-react';
import './ScanScreen.css';

export default function ScanScreen() {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(true);
    const [useLocation, setUseLocation] = useState(true);
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualCode, setManualCode] = useState('');

    // Simulate scan after 3 seconds for demo
    useEffect(() => {
        if (scanning && !showManualInput) {
            const timer = setTimeout(() => {
                // Simulate successful scan
                handleScanSuccess();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [scanning, showManualInput]);

    const handleScanSuccess = () => {
        setScanning(false);
        // Navigate to verify screen with mock payload
        navigate('/verify', {
            state: {
                qrPayload: {
                    v: 1,
                    event_pubkey: '8yLXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgBsV',
                    start_ts: Date.now() - 3600000,
                    end_ts: Date.now() + 7200000,
                    zone_code: 'dr5ru',
                    nonce: 'uuid-v4-demo',
                    meta: { name: 'Web3 Builders Night' },
                    sig: 'ed25519-demo-signature'
                }
            }
        });
    };

    const handleManualSubmit = () => {
        if (manualCode.trim()) {
            handleScanSuccess();
        }
    };

    return (
        <div className="scan-screen">
            {/* Camera preview (simulated) */}
            <div className="camera-preview">
                <div className="camera-gradient-top" />
                <div className="camera-gradient-bottom" />

                {/* Back button */}
                <button className="scan-back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>

                {/* Scan overlay */}
                {!showManualInput && (
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
                    >
                        <Keyboard size={20} />
                        <span>Manual Code</span>
                    </button>

                    <button
                        className={`scan-option location-toggle ${useLocation ? 'active' : ''}`}
                        onClick={() => setUseLocation(!useLocation)}
                    >
                        <MapPin size={20} />
                        <span>Location {useLocation ? 'On' : 'Off'}</span>
                    </button>
                </div>

                <div className="camera-status">
                    <Camera size={16} />
                    <span>{scanning ? 'Scanning...' : 'Ready'}</span>
                </div>
            </div>
        </div>
    );
}
