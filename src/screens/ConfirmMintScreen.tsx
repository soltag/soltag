import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Award, Shield, Clock, Hash, Wallet } from 'lucide-react';
import { getSeekerBadgeStatus } from '../services/seekerID';
import type { QRPayload } from '../types';
import './ConfirmMintScreen.css';

export default function ConfirmMintScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const qrPayload = location.state?.qrPayload as QRPayload | undefined;
    const [isSeekerVerified, setIsSeekerVerified] = useState(false);
    const [seekerBadge, setSeekerBadge] = useState('');

    const eventName = qrPayload?.meta?.name || 'Event';

    useEffect(() => {
        const checkSeekerStatus = async () => {
            const status = await getSeekerBadgeStatus();
            setIsSeekerVerified(status.isSeeker);
            setSeekerBadge(status.badgeText);
        };
        checkSeekerStatus();
    }, []);

    const handleConfirm = () => {
        // Navigate to pending screen and simulate transaction
        navigate('/pending', { state: { qrPayload } });
    };

    return (
        <div className="confirm-screen">
            <header className="confirm-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>Confirm Attendance</h1>
            </header>

            <div className="confirm-content animate-slide-up">
                {/* Credential preview */}
                <div className="credential-preview">
                    <div className="credential-preview-header">
                        <Award size={32} />
                        <span>SOLTAG CREDENTIAL</span>
                    </div>
                    <h2 className="credential-preview-title">{eventName}</h2>
                    <div className="credential-preview-badge">
                        <span>NON-TRANSFERABLE</span>
                    </div>
                </div>

                {/* What will be minted */}
                <div className="mint-details">
                    <h3>Data included on-chain</h3>
                    <ul className="mint-details-list">
                        <li>
                            <Hash size={16} />
                            <span>Event ID</span>
                            <code>{qrPayload?.event_pubkey?.slice(0, 8)}...</code>
                        </li>
                        <li>
                            <Shield size={16} />
                            <span>Zone hash (privacy-preserving)</span>
                        </li>
                        <li>
                            <Clock size={16} />
                            <span>Issued timestamp</span>
                        </li>
                        {isSeekerVerified && (
                            <li className="seeker-verified-item">
                                <Shield size={16} className="seeker-shield-icon" />
                                <span>Seeker hardware verified</span>
                                <span className="seeker-badge">{seekerBadge}</span>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Gas estimate */}
                <div className="gas-estimate">
                    <Wallet size={18} />
                    <span>Estimated fee:</span>
                    <span className="gas-amount">~0.0001 SOL</span>
                    <span className="gas-label">Low fee (compressed mint)</span>
                </div>

                {/* Privacy reminder */}
                <div className="confirm-notice">
                    <Shield size={18} />
                    <p>
                        This action will mint a privacy-preserving attendance credential to your wallet.
                        It is <strong>non-transferable</strong>. Proceed?
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="confirm-actions">
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                >
                    Cancel
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleConfirm}
                >
                    Confirm & Sign
                </button>
            </div>
        </div>
    );
}
