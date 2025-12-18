import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Crown, RefreshCw, Medal } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { getCredentials } from '../services/api';
import { useWallet } from '@solana/wallet-adapter-react';

import './LeaderboardScreen.css';

interface LeaderboardEntry {
    rank: number;
    wallet: string;
    displayName?: string;
    avatarUrl?: string;
    attendanceCount: number;
    isCurrentUser?: boolean;
}

// Mock leaderboard data
const mockLeaderboard: LeaderboardEntry[] = [
    { rank: 1, wallet: '9xK...Ab3', displayName: 'CryptoNomad', attendanceCount: 42 },
    { rank: 2, wallet: '7pL...Cd9', displayName: 'SolanaMaxi', attendanceCount: 38 },
    { rank: 3, wallet: '5mN...Ef2', displayName: 'Web3Explorer', attendanceCount: 35 },
    { rank: 4, wallet: '3kJ...Gh7', displayName: 'DeFiGuru', attendanceCount: 32 },
    { rank: 5, wallet: '8oP...Ij4', displayName: 'NFTCollector', attendanceCount: 29 },
    { rank: 6, wallet: '2nM...Kl8', displayName: 'DAOBuilder', attendanceCount: 27 },
    { rank: 7, wallet: '6qR...Mn1', displayName: 'BlockchainDev', attendanceCount: 24 },
    { rank: 8, wallet: '4sT...Op5', displayName: 'MetaverseUser', attendanceCount: 22 },
    { rank: 9, wallet: '9uW...Qr3', displayName: 'TokenTrader', attendanceCount: 21 },
    { rank: 10, wallet: '1vX...St6', displayName: 'SmartContract', attendanceCount: 19 },
    { rank: 42, wallet: 'Abc...Xyz', displayName: 'You', attendanceCount: 18, isCurrentUser: true },
];

export default function LeaderboardScreen() {
    const navigate = useNavigate();
    const { publicKey } = useWallet();

    const [activeTab, setActiveTab] = useState<'global' | 'month'>('global');
    const [loading, setLoading] = useState(false);
    const [attendanceCount, setAttendanceCount] = useState(18); // Default mock

    useEffect(() => {
        if (publicKey) {
            getCredentials(publicKey.toBase58()).then(creds => setAttendanceCount(creds.length));
        }
    }, [publicKey]);


    // Merge actual attendance into mock data for display
    const updatedLeaderboard = mockLeaderboard.map(entry =>
        entry.isCurrentUser ? { ...entry, attendanceCount } : entry
    ).sort((a, b) => b.attendanceCount - a.attendanceCount);

    // Recalculate ranks after sorting
    const rankedLeaderboard = updatedLeaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1
    }));

    const currentUserRank = rankedLeaderboard.find(e => e.isCurrentUser);

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1000);
    };

    const getAvatarInitials = (name: string) => {
        return name.slice(0, 2).toUpperCase();
    };

    const getRankClass = (rank: number) => {
        if (rank === 1) return 'rank-gold';
        if (rank === 2) return 'rank-silver';
        if (rank === 3) return 'rank-bronze';
        return 'rank-normal';
    };

    const top3 = rankedLeaderboard.slice(0, 3);
    const restOfList = rankedLeaderboard.slice(3);

    return (
        <div className="leaderboard-screen">
            <header className="leaderboard-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <div className="header-content">
                    <h1>Leaderboard</h1>
                    <p className="header-subtitle">Ranked by verified real-world attendance</p>
                </div>
                <button className="refresh-button" onClick={handleRefresh}>
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            <div className="leaderboard-content">
                {/* User Rank Card */}
                {currentUserRank && (
                    <div className="user-rank-card animate-slide-up">
                        <div className="rank-card-label">Your Rank</div>
                        <div className="rank-card-main">
                            <div className="rank-number">#{currentUserRank.rank}</div>
                            <div className="rank-stats">
                                <div className="stat-value">{currentUserRank.attendanceCount}</div>
                                <div className="stat-label">Check-ins</div>
                            </div>
                        </div>
                        <div className="rank-card-note">Your on-chain activity rank</div>
                    </div>
                )}

                {/* Tabs */}
                <div className="leaderboard-tabs">
                    <button
                        className={`tab ${activeTab === 'global' ? 'active' : ''}`}
                        onClick={() => setActiveTab('global')}
                    >
                        Global
                    </button>
                    <button
                        className={`tab ${activeTab === 'month' ? 'active' : ''}`}
                        onClick={() => setActiveTab('month')}
                    >
                        This Month
                    </button>
                </div>

                {/* Top 3 Showcase */}
                <div className="top-three-showcase">
                    {/* Rank 2 (Left) */}
                    <div className="top-rank-item rank-2">
                        <div className="rank-badge rank-silver"><Medal size={20} /></div>
                        <div className="avatar-container avatar-silver">
                            <div className="avatar">
                                {top3[1]?.displayName ? getAvatarInitials(top3[1].displayName) : '?'}
                            </div>
                        </div>
                        <div className="rank-name">{top3[1]?.displayName || 'Anonymous'}</div>
                        <div className="rank-score">{top3[1]?.attendanceCount} check-ins</div>
                    </div>

                    {/* Rank 1 (Center) */}
                    <div className="top-rank-item rank-1">
                        <Crown className="crown-icon" size={24} />
                        <div className="rank-badge rank-gold"><Medal size={24} /></div>
                        <div className="avatar-container avatar-gold">
                            <div className="avatar avatar-large">
                                {top3[0]?.displayName ? getAvatarInitials(top3[0].displayName) : '?'}
                            </div>
                        </div>
                        <div className="rank-name">{top3[0]?.displayName || 'Anonymous'}</div>
                        <div className="rank-score">{top3[0]?.attendanceCount} check-ins</div>
                    </div>

                    {/* Rank 3 (Right) */}
                    <div className="top-rank-item rank-3">
                        <div className="rank-badge rank-bronze"><Medal size={20} /></div>
                        <div className="avatar-container avatar-bronze">
                            <div className="avatar">
                                {top3[2]?.displayName ? getAvatarInitials(top3[2].displayName) : '?'}
                            </div>
                        </div>
                        <div className="rank-name">{top3[2]?.displayName || 'Anonymous'}</div>
                        <div className="rank-score">{top3[2]?.attendanceCount} check-ins</div>
                    </div>
                </div>

                {/* Leaderboard List */}
                <div className="leaderboard-list">
                    <h3 className="list-title">All Rankings</h3>
                    {restOfList.map((entry) => (
                        <div
                            key={entry.rank}
                            className={`leaderboard-row ${entry.isCurrentUser ? 'current-user' : ''}`}
                        >
                            <div className={`rank-number-small ${getRankClass(entry.rank)}`}>
                                #{entry.rank}
                            </div>
                            <div className="avatar-small">
                                {entry.displayName ? getAvatarInitials(entry.displayName) : '?'}
                            </div>
                            <div className="user-info">
                                <div className="user-name">
                                    {entry.displayName || entry.wallet}
                                    {entry.isCurrentUser && <span className="you-badge">You</span>}
                                </div>
                                <div className="user-wallet">{entry.wallet}</div>
                            </div>
                            <div className="attendance-count">
                                <Trophy size={14} />
                                {entry.attendanceCount}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Privacy Note */}
                <p className="privacy-note">
                    Rankings are based on verified on-chain attendance credentials. No location data is revealed.
                </p>
            </div>

            <BottomNav />
        </div>
    );
}
