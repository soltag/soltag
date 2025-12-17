import { useState, useEffect } from 'react';
import { ChevronRight, Wallet, Eye, Camera, MapPin, RefreshCw, Code, Fingerprint, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { securityService, SecuritySettings } from '../services/securityService';
import './SettingsScreen.css';

export default function SettingsScreen() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        publicVisibility: true,
        autoResubmit: true,
        cameraPermission: true,
        locationPermission: true,
    });

    const [security, setSecurity] = useState<SecuritySettings>({
        biometricsEnabled: false,
        passcodeEnabled: false,
        lockOnEntry: false
    });

    useEffect(() => {
        securityService.getSettings().then(setSecurity);
    }, []);

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleSecurity = async (key: keyof SecuritySettings) => {
        const newSettings = { ...security, [key]: !security[key] };

        // If enabling passcode and none exists, set a default for demo
        if (key === 'passcodeEnabled' && newSettings.passcodeEnabled && !newSettings.passcode) {
            newSettings.passcode = '1234';
        }

        setSecurity(newSettings);
        await securityService.saveSettings(newSettings);
    };

    return (
        <div className="settings-screen">
            <div className="settings-content">
                <header className="settings-header animate-fade-in">
                    <h1 className="settings-title">Settings</h1>
                </header>

                {/* Wallet section */}
                <section className="settings-section animate-slide-up">
                    <h2 className="section-label">Wallet</h2>
                    <div className="settings-group">
                        <button className="setting-item" onClick={() => navigate('/connect')}>
                            <div className="setting-icon">
                                <Wallet size={20} />
                            </div>
                            <div className="setting-info">
                                <span className="setting-title">Manage Wallet</span>
                                <span className="setting-desc">Connect or disconnect wallet</span>
                            </div>
                            <ChevronRight size={20} className="setting-arrow" />
                        </button>
                    </div>
                </section>

                {/* Security section */}
                <section className="settings-section animate-slide-up">
                    <h2 className="section-label">Security</h2>
                    <div className="settings-group">
                        <div className="setting-item">
                            <div className="setting-icon">
                                <Fingerprint size={20} />
                            </div>
                            <div className="setting-info">
                                <span className="setting-title">Biometric Lock</span>
                                <span className="setting-desc">Use fingerprint to open app</span>
                            </div>
                            <button
                                className={`toggle ${security.biometricsEnabled ? 'active' : ''}`}
                                onClick={() => toggleSecurity('biometricsEnabled')}
                                aria-label="Toggle biometrics"
                            />
                        </div>
                        <div className="setting-item">
                            <div className="setting-icon">
                                <Lock size={20} />
                            </div>
                            <div className="setting-info">
                                <span className="setting-title">Passcode Lock</span>
                                <span className="setting-desc">Require 4-digit code</span>
                            </div>
                            <button
                                className={`toggle ${security.passcodeEnabled ? 'active' : ''}`}
                                onClick={() => toggleSecurity('passcodeEnabled')}
                                aria-label="Toggle passcode"
                            />
                        </div>
                    </div>
                </section>

                {/* Privacy section */}
                <section className="settings-section animate-slide-up">
                    <h2 className="section-label">Privacy</h2>
                    <div className="settings-group">
                        <div className="setting-item">
                            <div className="setting-icon">
                                <Eye size={20} />
                            </div>
                            <div className="setting-info">
                                <span className="setting-title">Public Visibility</span>
                                <span className="setting-desc">Show credentials publicly</span>
                            </div>
                            <button
                                className={`toggle ${settings.publicVisibility ? 'active' : ''}`}
                                onClick={() => toggleSetting('publicVisibility')}
                                aria-label="Toggle public visibility"
                            />
                        </div>
                    </div>
                </section>

                {/* Permissions section */}
                <section className="settings-section animate-slide-up">
                    <h2 className="section-label">Permissions</h2>
                    <div className="settings-group">
                        <div className="setting-item">
                            <div className="setting-icon">
                                <Camera size={20} />
                            </div>
                            <div className="setting-info">
                                <span className="setting-title">Camera</span>
                                <span className="setting-desc">For QR scanning</span>
                            </div>
                            <button
                                className={`toggle ${settings.cameraPermission ? 'active' : ''}`}
                                onClick={() => toggleSetting('cameraPermission')}
                                aria-label="Toggle camera permission"
                            />
                        </div>
                        <div className="setting-item">
                            <div className="setting-icon">
                                <MapPin size={20} />
                            </div>
                            <div className="setting-info">
                                <span className="setting-title">Location</span>
                                <span className="setting-desc">For zone verification</span>
                            </div>
                            <button
                                className={`toggle ${settings.locationPermission ? 'active' : ''}`}
                                onClick={() => toggleSetting('locationPermission')}
                                aria-label="Toggle location permission"
                            />
                        </div>
                    </div>
                </section>

                {/* Offline section */}
                <section className="settings-section animate-slide-up">
                    <h2 className="section-label">Offline Behavior</h2>
                    <div className="settings-group">
                        <div className="setting-item">
                            <div className="setting-icon">
                                <RefreshCw size={20} />
                            </div>
                            <div className="setting-info">
                                <span className="setting-title">Auto-Resubmit Queue</span>
                                <span className="setting-desc">Automatically submit when online</span>
                            </div>
                            <button
                                className={`toggle ${settings.autoResubmit ? 'active' : ''}`}
                                onClick={() => toggleSetting('autoResubmit')}
                                aria-label="Toggle auto resubmit"
                            />
                        </div>
                    </div>
                </section>

                {/* Developer section */}
                <section className="settings-section animate-slide-up">
                    <h2 className="section-label">Developer</h2>
                    <div className="settings-group">
                        <button className="setting-item">
                            <div className="setting-icon">
                                <Code size={20} />
                            </div>
                            <div className="setting-info">
                                <span className="setting-title">RPC Endpoint</span>
                                <span className="setting-desc">mainnet-beta.solana.com</span>
                            </div>
                            <ChevronRight size={20} className="setting-arrow" />
                        </button>
                    </div>
                </section>

                {/* Help link */}
                <button
                    className="help-link animate-fade-in"
                    onClick={() => navigate('/help')}
                >
                    Help & Privacy Policy
                </button>

                <p className="version-info">SOLTAG v1.0.0 (Demo)</p>
            </div>

            <BottomNav activeTab="settings" />
        </div>
    );
}
