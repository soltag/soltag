import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, ExternalLink } from 'lucide-react';
import './HelpPrivacyScreen.css';

export default function HelpPrivacyScreen() {
    const navigate = useNavigate();

    return (
        <div className="help-screen">
            <header className="help-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>Help & Privacy</h1>
            </header>

            <div className="help-content animate-slide-up">
                {/* Privacy section */}
                <section className="help-section">
                    <div className="section-icon">
                        <Shield size={24} />
                    </div>
                    <h2>Privacy Protection</h2>
                    <div className="info-card">
                        <h3>How SOLTAG protects your data</h3>
                        <ul>
                            <li>
                                <strong>No exact GPS stored:</strong> We never record your precise location.
                                Only a hashed zone code is stored on-chain.
                            </li>
                            <li>
                                <strong>On-device processing:</strong> Location verification happens entirely
                                on your device. Raw coordinates never leave your phone.
                            </li>
                            <li>
                                <strong>Non-transferable credentials:</strong> Your attendance credentials
                                are soulbound to your wallet and cannot be traded or transferred.
                            </li>
                            <li>
                                <strong>You control visibility:</strong> Choose whether to display
                                credentials publicly or keep them private.
                            </li>
                        </ul>
                    </div>
                </section>

                {/* How it works */}
                <section className="help-section">
                    <h2>How Check-In Works</h2>
                    <div className="steps-list">
                        <div className="step">
                            <span className="step-number">1</span>
                            <div className="step-content">
                                <strong>Scan QR Code</strong>
                                <p>Point your camera at the event's QR code</p>
                            </div>
                        </div>
                        <div className="step">
                            <span className="step-number">2</span>
                            <div className="step-content">
                                <strong>Verify Presence</strong>
                                <p>App checks signature, time window, and zone</p>
                            </div>
                        </div>
                        <div className="step">
                            <span className="step-number">3</span>
                            <div className="step-content">
                                <strong>Sign Transaction</strong>
                                <p>Confirm in your wallet with one tap</p>
                            </div>
                        </div>
                        <div className="step">
                            <span className="step-number">4</span>
                            <div className="step-content">
                                <strong>Credential Minted</strong>
                                <p>Proof of presence appears in your wallet</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Links */}
                <section className="help-section">
                    <h2>Legal</h2>
                    <div className="links-list">
                        <a href="#" className="link-item">
                            <span>Privacy Policy</span>
                            <ExternalLink size={16} />
                        </a>
                        <a href="#" className="link-item">
                            <span>Terms of Service</span>
                            <ExternalLink size={16} />
                        </a>
                        <a href="#" className="link-item">
                            <span>Contact Support</span>
                            <ExternalLink size={16} />
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
