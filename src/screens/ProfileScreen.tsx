import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Copy, CheckCircle, Download, LogOut, Edit2, Camera, X } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import CredentialCard from '../components/CredentialCard';
import { mockCredentials, shortenAddress } from '../data/mockData';
import './ProfileScreen.css';

type Filter = 'all' | 'conference' | 'gym' | 'ticket';

export default function ProfileScreen() {
    const navigate = useNavigate();
    const { publicKey, disconnect } = useWallet();

    // Get real public key if connected, otherwise fallback to stored (or empty)
    const walletAddress = publicKey ? publicKey.toBase58() : localStorage.getItem('soltag_wallet_pubkey') || '';

    const [activeFilter, setActiveFilter] = useState<Filter>('all');
    const [copied, setCopied] = useState(false);

    // State for profile editing
    const [showEditModal, setShowEditModal] = useState(false);
    const [username, setUsername] = useState(localStorage.getItem('soltag_username') || '');
    const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('soltag_avatar') || '');
    const [tempUsername, setTempUsername] = useState(username);
    const [tempAvatar, setTempAvatar] = useState(avatarUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredCredentials = mockCredentials.filter(c => {
        if (activeFilter === 'all') return true;
        return c.category === activeFilter;
    });

    const handleCopy = async () => {
        await navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDisconnect = async () => {
        await disconnect();
        localStorage.removeItem('soltag_wallet_connected');
        localStorage.removeItem('soltag_wallet_pubkey');
        navigate('/connect');
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = () => {
        setUsername(tempUsername);
        setAvatarUrl(tempAvatar);
        localStorage.setItem('soltag_username', tempUsername);
        localStorage.setItem('soltag_avatar', tempAvatar);
        setShowEditModal(false);
    };

    const handleCancelEdit = () => {
        setTempUsername(username);
        setTempAvatar(avatarUrl);
        setShowEditModal(false);
    };

    const getInitials = (name: string) => {
        if (!name) return shortenAddress(walletAddress, 2);
        return name.slice(0, 2).toUpperCase();
    };

    const filters: { key: Filter; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'conference', label: 'Conferences' },
        { key: 'gym', label: 'Gym' },
        { key: 'ticket', label: 'Tickets' },
    ];

    return (
        <div className="profile-screen">
            <div className="profile-content">
                <header className="profile-header animate-fade-in">
                    <h1 className="profile-title">Profile</h1>
                    <button className="disconnect-btn" onClick={handleDisconnect}>
                        <LogOut size={18} />
                    </button>
                </header>

                <div className="user-profile-section animate-slide-up">
                    <div className="profile-avatar-container">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="profile-avatar" />
                        ) : (
                            <div className="profile-avatar profile-avatar-placeholder">
                                {getInitials(username)}
                            </div>
                        )}
                        {/* Seeker badge overlay - commented out until we have real Seeker device */}
                        {/* <div className="seeker-shield-overlay" title="Seeker Verified">
                            <Shield size={16} />
                        </div> */}
                    </div>
                    <div className="profile-user-info">
                        <h2 className="profile-username">{username || 'Anonymous User'}</h2>
                        <p className="profile-wallet-short">{shortenAddress(walletAddress, 6)}</p>
                    </div>
                    <button className="edit-profile-btn" onClick={() => setShowEditModal(true)}>
                        <Edit2 size={18} />
                    </button>
                </div>

                {/* Wallet info */}
                <div className="wallet-info animate-slide-up">
                    <div className="wallet-address">
                        <span className="wallet-label">Wallet Address</span>
                        <div className="address-row">
                            <code>{shortenAddress(walletAddress, 8)}</code>
                            <button className="copy-btn" onClick={handleCopy} aria-label="Copy address">
                                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="profile-stats animate-slide-up">
                    <div className="stat-card">
                        <span className="stat-value">{mockCredentials.length}</span>
                        <span className="stat-label">Attendances</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{mockCredentials.length * 10}</span>
                        <span className="stat-label">Reputation</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">#{Math.floor(Math.random() * 1000) + 1}</span>
                        <span className="stat-label">Rank</span>
                    </div>
                </div>

                {/* Credentials section */}
                <section className="credentials-section animate-slide-up">
                    <div className="section-header">
                        <h2>Credentials</h2>
                        <button className="export-btn">
                            <Download size={16} />
                            <span>Export</span>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="credential-filters">
                        {filters.map(filter => (
                            <button
                                key={filter.key}
                                className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
                                onClick={() => setActiveFilter(filter.key)}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Credentials list */}
                    <div className="credentials-grid">
                        {filteredCredentials.map(credential => (
                            <CredentialCard key={credential.id} credential={credential} />
                        ))}
                    </div>

                    {filteredCredentials.length === 0 && (
                        <div className="empty-credentials">
                            <p>No credentials found</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={handleCancelEdit}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Profile</h3>
                            <button className="modal-close-btn" onClick={handleCancelEdit}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Avatar Upload */}
                            <div className="avatar-upload-section">
                                <div className="avatar-preview">
                                    {tempAvatar ? (
                                        <img src={tempAvatar} alt="Avatar preview" className="avatar-preview-img" />
                                    ) : (
                                        <div className="avatar-preview-placeholder">
                                            {getInitials(tempUsername)}
                                        </div>
                                    )}
                                    <button className="avatar-upload-btn" onClick={() => fileInputRef.current?.click()}>
                                        <Camera size={20} />
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    style={{ display: 'none' }}
                                />
                                <p className="avatar-upload-hint">Click camera icon to upload avatar</p>
                            </div>

                            {/* Username Input */}
                            <div className="username-input-section">
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    className="input username-input"
                                    placeholder="Enter your username"
                                    value={tempUsername}
                                    onChange={(e) => setTempUsername(e.target.value)}
                                    maxLength={20}
                                />
                                <span className="character-count">{tempUsername.length}/20</span>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={handleCancelEdit}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveProfile}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav activeTab="profile" />
        </div>
    );
}
