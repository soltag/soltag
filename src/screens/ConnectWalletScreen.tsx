import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HelpCircle, Loader2, AlertCircle, User } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { signInWithWallet } from '../services/api';
import {
    isMWAAvailable,
    authenticateWithMWA,
} from '../services/mwaService';
import { useAuthStore } from '../stores/authStore';
import {
    signMessageWithPhantom,
    handleConnectCallback,
    handleSignMessageCallback,
    getPhantomPublicKey,
    isAndroidDevice,
    connectToPhantom,
} from '../services/phantomDeeplink';

import './ConnectWalletScreen.css';

// Storage keys for auth flow state
const PENDING_NONCE_KEY = 'soltag_pending_nonce';
const AUTH_STEP_KEY = 'soltag_auth_step';

// Wallet configurations matching the design - using original icons from logos folder
const WALLET_OPTIONS = [
    {
        id: 'phantom',
        name: 'Phantom',
        description: 'Full MWA support on Android',
        icon: '/wallet-phantom.svg',
    },
    {
        id: 'solflare',
        name: 'Solflare',
        description: 'Full MWA support on Android',
        icon: '/wallet-solflare.svg',
    },
    {
        id: 'ultimate',
        name: 'Ultimate',
        description: 'Saga-native wallet',
        icon: '/wallet-ultimate.svg',
    },
    {
        id: 'backpack',
        name: 'Backpack',
        description: 'Full MWA support',
        icon: '/wallet-backpack.svg',
    },
    {
        id: 'glow',
        name: 'Glow',
        description: 'Full MWA support',
        icon: '/wallet-glow.png',
    },
];

export default function ConnectWalletScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { connected, publicKey, signMessage, connecting, wallets, select } = useWallet();

    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [authMethod, setAuthMethod] = useState<'mwa' | 'deeplink' | 'adapter' | null>(null);

    const isMWASupported = isMWAAvailable();
    const isAndroid = isAndroidDevice();

    const login = useAuthStore(state => state.login);

    // Handle Phantom deep-link callbacks
    useEffect(() => {
        const handleCallback = async () => {
            const search = location.search;
            const fullUrl = window.location.href;

            if (!fullUrl.includes('soltag://phantom/') && !search.includes('data=')) {
                return;
            }

            console.log('[Auth] [Callback] Handling callback. Search:', search, 'Full URL:', fullUrl);
            const urlParams = new URLSearchParams(search || fullUrl.split('?')[1] || '');

            try {
                setIsAuthenticating(true);
                setAuthMethod('deeplink');

                if (fullUrl.includes('phantom/connect')) {
                    const result = handleConnectCallback(urlParams);
                    console.log('[Auth] [Deeplink] Connected:', result.publicKey);

                    const nonce = `soltag_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                    localStorage.setItem(PENDING_NONCE_KEY, nonce);
                    localStorage.setItem(AUTH_STEP_KEY, 'signing');

                    setStatusMessage('Requesting signature via Phantom...');

                    setTimeout(() => {
                        signMessageWithPhantom(`Sign this message to authenticate with Soltag: ${nonce}`);
                    }, 800);

                } else if (fullUrl.includes('phantom/signMessage')) {
                    const signature = handleSignMessageCallback(urlParams);
                    const nonce = localStorage.getItem(PENDING_NONCE_KEY);
                    const walletAddress = getPhantomPublicKey();

                    if (!nonce || !walletAddress) {
                        throw new Error('Authentication state lost. Please try again.');
                    }

                    console.log('[Auth] [Deeplink] Signature received, verifying...');
                    setStatusMessage('Verifying signature...');

                    const result = await signInWithWallet(walletAddress, signature, nonce);

                    if (result.ok) {
                        await login(walletAddress, 'Explorer', result.token || 'deeplink_active');
                        localStorage.removeItem(PENDING_NONCE_KEY);
                        localStorage.removeItem(AUTH_STEP_KEY);
                        navigate('/home');
                    } else {
                        throw new Error(result.error || 'Server authentication failed');
                    }
                }
            } catch (error) {
                console.error('[Auth] [Error] Deep-link failure:', error);
                setAuthError(error instanceof Error ? error.message : 'Deep-link authentication failed');
                localStorage.removeItem(PENDING_NONCE_KEY);
                localStorage.removeItem(AUTH_STEP_KEY);
            } finally {
                setIsAuthenticating(false);
                setStatusMessage('');
                window.history.replaceState({}, '', '/connect');
            }
        };

        handleCallback();
    }, [location, navigate, login]);

    // Standard Wallet Adapter Auth (Desktop/iOS)
    const performAdapterAuth = useCallback(async () => {
        if (!connected || !publicKey || !signMessage || isAuthenticating) return;

        try {
            setIsAuthenticating(true);
            setAuthMethod('adapter');
            setAuthError(null);
            setStatusMessage('Awaiting signature...');

            const address = publicKey.toBase58();
            const nonce = `soltag_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const message = new TextEncoder().encode(`Sign this message to authenticate with Soltag: ${nonce}`);

            const signature = await signMessage(message);
            setStatusMessage('Verifying...');

            const result = await signInWithWallet(address, signature, nonce);

            if (result.ok) {
                await login(address, 'Explorer', result.token);
                navigate('/home');
            } else {
                setAuthError(result.error || 'Server verification failed');
            }
        } catch (err) {
            console.error('[Auth] [Error] Adapter path failed:', err);
            setAuthError('Signature request was cancelled.');
        } finally {
            setIsAuthenticating(false);
        }
    }, [connected, publicKey, signMessage, isAuthenticating, navigate, login]);

    // Trigger adapter auth when connected
    useEffect(() => {
        const checkConnection = async () => {
            if (connected && publicKey && !isMWASupported && !isAndroid && !isAuthenticating) {
                const sessionToken = await useAuthStore.getState().authToken;
                if (!sessionToken) {
                    performAdapterAuth();
                }
            }
        };
        checkConnection();
    }, [connected, publicKey, isMWASupported, isAndroid, performAdapterAuth, isAuthenticating]);

    const handleGuestLogin = useCallback(async () => {
        await login('guest_explorer_mode', 'Guest', 'guest_mode_active');
        navigate('/home');
    }, [navigate, login]);

    // Handle wallet selection - use MWA on Android, wallet adapter on desktop
    const handleWalletSelect = useCallback(async (walletId: string) => {
        try {
            setAuthError(null);
            setIsAuthenticating(true);

            // On Android, always use MWA - it will show the system wallet picker
            if (isAndroid && isMWASupported) {
                setAuthMethod('mwa');
                setStatusMessage('Opening wallet...');

                console.log('[Auth] Using MWA with SIWS for wallet connection');

                // Generate nonce for sign-in (SIWS uses this for replay protection)
                const nonce = `soltag_${Date.now()}_${Math.random().toString(36).substring(7)}`;

                // MWA will show the system wallet picker with SIWS UI
                const result = await authenticateWithMWA(nonce);

                if (result) {
                    console.log('[Auth] MWA SIWS authentication successful:', result.publicKey);
                    setStatusMessage('Verifying...');

                    // Verify with backend (uses SIWS signed message)
                    const apiResult = await signInWithWallet(result.publicKey, result.signature, nonce);

                    if (apiResult.ok) {
                        // Create/update profile in Supabase
                        try {
                            const { upsertProfile } = await import('../services/api');
                            await upsertProfile({ wallet_address: result.publicKey });
                            console.log('[Auth] Profile created/updated for:', result.publicKey);
                        } catch (profileError) {
                            console.warn('[Auth] Profile upsert failed (non-fatal):', profileError);
                        }

                        await login(result.publicKey, 'Explorer', apiResult.token || result.authToken);
                        navigate('/home');
                        return;
                    } else {
                        throw new Error(apiResult.error || 'Server verification failed');
                    }
                } else {
                    throw new Error('Wallet connection was cancelled');
                }
            }

            // On desktop/iOS, try wallet adapter
            const adapterWallet = wallets.find(
                w => w.adapter.name.toLowerCase().includes(walletId.toLowerCase()) &&
                    (w.readyState === 'Installed' || w.readyState === 'Loadable')
            );

            if (adapterWallet) {
                setStatusMessage('Connecting via wallet extension...');
                select(adapterWallet.adapter.name);
                setIsAuthenticating(false);
            } else {
                // Fallback: Try Phantom deep-link on Android if MWA failed
                if (walletId === 'phantom' && isAndroid) {
                    setAuthMethod('deeplink');
                    setStatusMessage('Opening Phantom...');
                    connectToPhantom();
                } else {
                    setAuthError(`${walletId.charAt(0).toUpperCase() + walletId.slice(1)} wallet not detected. Please install a Solana wallet.`);
                    setIsAuthenticating(false);
                }
            }
        } catch (err) {
            console.error('[Auth] Wallet selection failed:', err);
            setAuthError(err instanceof Error ? err.message : 'Failed to connect wallet');
            setIsAuthenticating(false);
        }
    }, [wallets, select, isAndroid, isMWASupported, login, navigate]);

    const isLoading = connecting || isAuthenticating;

    return (
        <div className="connect-wallet-screen">
            {/* Decorative stars */}
            <div className="stars-decoration">
                {[...Array(20)].map((_, i) => (
                    <span key={i} className="star" style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`
                    }}>✦</span>
                ))}
            </div>

            <div className="connect-content animate-slide-up">
                <h1 className="connect-title">Connect your wallet</h1>
                <p className="connect-subtitle">
                    Connect your Solana wallet to verify your identity and mint attendance credentials.
                </p>

                <div className="wallet-adapter-container">
                    {isLoading ? (
                        <div className="auth-loading">
                            <Loader2 className="animate-spin" size={32} />
                            <p>{statusMessage || 'Connecting...'}</p>
                            {authMethod === 'mwa' && (
                                <span className="auth-hint">Native Mobile Wallet Adapter</span>
                            )}
                            {authMethod === 'deeplink' && (
                                <span className="auth-hint">Phantom Deep Link Flow</span>
                            )}
                        </div>
                    ) : (
                        <div className="wallet-options">
                            {/* Wallet List */}
                            <div className="wallet-list">
                                {WALLET_OPTIONS.map((wallet) => (
                                    <button
                                        key={wallet.id}
                                        className="wallet-option-btn"
                                        onClick={() => handleWalletSelect(wallet.id)}
                                        disabled={isLoading}
                                    >
                                        <div className="wallet-icon-wrapper">
                                            <img
                                                src={wallet.icon}
                                                alt={wallet.name}
                                                className="wallet-icon"
                                                onError={(e) => {
                                                    // Fallback for missing icons
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                        <div className="wallet-info">
                                            <span className="wallet-name">{wallet.name}</span>
                                            <span className="wallet-description">{wallet.description}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Guest login */}
                            <button
                                className="guest-login-btn"
                                onClick={handleGuestLogin}
                                disabled={isLoading}
                            >
                                <User size={20} />
                                <span>Explore as Guest</span>
                            </button>
                        </div>
                    )}
                </div>

                {authError && (
                    <div className="auth-error animate-fade-in">
                        <AlertCircle size={16} />
                        <p>{authError}</p>
                    </div>
                )}

                <div className="security-note">
                    <p>Optimized for Solana Seeker & Phantom</p>
                </div>

                <button className="help-link" onClick={() => navigate('/help')}>
                    <HelpCircle size={16} />
                    <span>How wallets work</span>
                </button>
            </div>

            {/* Bottom decoration */}
            <div className="bottom-decoration">
                <span className="sparkle">✦</span>
            </div>
        </div>
    );
}
