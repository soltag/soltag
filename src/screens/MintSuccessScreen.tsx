import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Eye, Share2, Home, Shield } from 'lucide-react';

import './MintSuccessScreen.css';

export default function MintSuccessScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const txSignature = location.state?.txSignature as string | undefined;
    const isSeekerData = location.state?.isSeeker as boolean | undefined;

    const eventName = 'Soltag Event';

    return (
        <div className="success-screen">
            <div className="success-content animate-slide-up">
                {/* Success illustration */}
                <div className="success-illustration">
                    <div className="success-ring success-ring-1" />
                    <div className="success-ring success-ring-2" />
                    <div className="success-ring success-ring-3" />
                    <div className="success-icon">
                        <CheckCircle size={64} />
                    </div>
                </div>

                <h1 className="success-title">Attendance Recorded</h1>
                <p className="success-event">{eventName}</p>
                <p className="success-message">
                    Your proof of presence has been recorded on Solana.
                </p>

                {txSignature && (
                    <div className="tx-status-card">
                        <div className="tx-status-item">
                            <span>Transaction Signature</span>
                            <code>{txSignature.slice(0, 8)}...{txSignature.slice(-8)}</code>
                        </div>
                        {isSeekerData && (
                            <div className="tx-status-item seeker-trust">
                                <Shield size={14} />
                                <span>Seeker Device Attested</span>
                            </div>
                        )}
                    </div>
                )}


                {/* Credential preview */}
                <div className="success-credential">
                    <div className="credential-glow" />
                    <div className="credential-inner">
                        <span className="credential-badge">SOLTAG</span>
                        <span className="credential-name">{eventName}</span>
                        <span className="credential-type">Soulbound Credential</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="success-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/profile')}
                    >
                        <Eye size={18} />
                        View Credential
                    </button>

                    <button className="btn btn-secondary">
                        <Share2 size={18} />
                        Share
                    </button>
                </div>

                <button
                    className="btn btn-primary btn-lg btn-full"
                    onClick={() => navigate('/home')}
                >
                    <Home size={20} />
                    Back to Home
                </button>
            </div>
        </div>
    );
}
