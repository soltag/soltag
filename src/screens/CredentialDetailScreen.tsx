import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, ExternalLink, Copy, CheckCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { mockCredentials, formatDateTime, shortenAddress } from '../data/mockData';
import './CredentialDetailScreen.css';

export default function CredentialDetailScreen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [isPublic, setIsPublic] = useState(true);

    const credential = mockCredentials.find(c => c.id === id);

    if (!credential) {
        return (
            <div className="credential-detail-screen">
                <div className="not-found">
                    <p>Credential not found</p>
                    <button className="btn btn-primary" onClick={() => navigate('/profile')}>
                        Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    const handleCopyTx = async () => {
        if (credential.tx_sig) {
            await navigator.clipboard.writeText(credential.tx_sig);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="credential-detail-screen">
            <header className="detail-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>Credential</h1>
            </header>

            <div className="detail-content animate-slide-up">
                {/* Credential visual */}
                <div className="credential-visual">
                    {credential.image && (
                        <img src={credential.image} alt={credential.event_name} className="credential-bg-image" />
                    )}
                    <div className="credential-overlay" />
                    <div className="credential-visual-content">
                        <Award size={40} />
                        <span className="credential-badge-label">SOLTAG</span>
                        <h2>{credential.event_name}</h2>
                        <div className="sbt-indicator">
                            <Shield size={14} />
                            <span>Soulbound Token</span>
                        </div>
                    </div>
                </div>

                {/* Metadata */}
                <div className="metadata-section">
                    <div className="metadata-item">
                        <span className="meta-label">Issued</span>
                        <span className="meta-value">{formatDateTime(credential.issued_at)}</span>
                    </div>

                    <div className="metadata-item">
                        <span className="meta-label">Event ID</span>
                        <span className="meta-value mono">{credential.event_id}</span>
                    </div>

                    <div className="metadata-item">
                        <span className="meta-label">Zone Hash</span>
                        <span className="meta-value mono">{shortenAddress(credential.zone_hash, 8)}</span>
                    </div>

                    <div className="metadata-item">
                        <span className="meta-label">Owner</span>
                        <span className="meta-value mono">{shortenAddress(credential.owner_pubkey, 6)}</span>
                    </div>

                    {credential.category && (
                        <div className="metadata-item">
                            <span className="meta-label">Category</span>
                            <span className={`category-badge ${credential.category}`}>{credential.category}</span>
                        </div>
                    )}
                </div>

                {/* Transaction */}
                {credential.tx_sig && (
                    <div className="transaction-section">
                        <span className="section-title">Transaction</span>
                        <div className="tx-row">
                            <code>{shortenAddress(credential.tx_sig, 8)}</code>
                            <button className="icon-btn" onClick={handleCopyTx} aria-label="Copy">
                                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                            </button>
                            <button className="icon-btn" aria-label="View on explorer">
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Visibility toggle */}
                <div className="visibility-section">
                    <div className="visibility-info">
                        {isPublic ? <Eye size={20} /> : <EyeOff size={20} />}
                        <div>
                            <span className="visibility-title">Public Visibility</span>
                            <span className="visibility-desc">
                                {isPublic ? 'Credential is visible to others' : 'Credential is hidden from others'}
                            </span>
                        </div>
                    </div>
                    <button
                        className={`toggle ${isPublic ? 'active' : ''}`}
                        onClick={() => setIsPublic(!isPublic)}
                        aria-label="Toggle visibility"
                    />
                </div>

                {/* Non-transferable notice */}
                <div className="notice-section">
                    <Shield size={18} />
                    <p>
                        This credential is <strong>non-transferable</strong> (soulbound).
                        It cannot be sold, traded, or moved to another wallet.
                    </p>
                </div>
            </div>
        </div>
    );
}
