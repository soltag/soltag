import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HelpCircle, Loader2, AlertCircle, User, ExternalLink } from 'lucide-react';
import { useWallet, Wallet as WalletType } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { signInWithWallet } from '../services/api';
import {
    isMWAAvailable,
} from '../services/mwaService';
import { useAuthStore } from '../stores/authStore';
import {
    signMessageWithPhantom,
    handleConnectCallback,
    handleSignMessageCallback,
    getPhantomPublicKey,
    isAndroidDevice,
} from '../services/phantomDeeplink';

import './ConnectWalletScreen.css';

// Storage keys for auth flow state
const PENDING_NONCE_KEY = 'soltag_pending_nonce';
const AUTH_STEP_KEY = 'soltag_auth_step';

export default function ConnectWalletScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { connected, publicKey, signMessage, connecting, wallets, select } = useWallet();
    useWalletModal(); // Keep provider active but don't use setVisible

    // We'll use a local ref or state if needed for pending, but currently redundant
    // because App root handles auth navigation.

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

            // Check if this is a Phantom callback (either in search or full URL)
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

                    // Small delay for UI smoothness
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
                // Use history API to clean URL without triggerring re-navigation if possible
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

    // Trigger adapter auth when connected and pending
    useEffect(() => {
        const checkConnection = async () => {
            if (connected && publicKey && !isMWASupported && !isAndroid && !isAuthenticating) {
                // Check if we already have a session to avoid double-triggers
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

    // Handle individual wallet selection
    const handleWalletSelect = useCallback(async (wallet: WalletType) => {
        try {
            setAuthError(null);
            select(wallet.adapter.name);
            // The useEffect for connected will handle the auth flow
        } catch (err) {
            console.error('[Auth] Wallet selection failed:', err);
            setAuthError('Failed to select wallet');
        }
    }, [select]);

    const isLoading = connecting || isAuthenticating;

    return (
        <div className="connect-wallet-screen">
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
                            {/* Multi-Wallet Selector */}
                            <div className="wallet-list">
                                {wallets.filter(w => w.readyState === 'Installed' || w.readyState === 'Loadable').length > 0 ? (
                                    wallets
                                        .filter(w => w.readyState === 'Installed' || w.readyState === 'Loadable')
                                        .map((wallet) => (
                                            <button
                                                key={wallet.adapter.name}
                                                className="wallet-option-btn"
                                                onClick={() => handleWalletSelect(wallet)}
                                                disabled={isLoading}
                                            >
                                                <img
                                                    src={wallet.adapter.icon}
                                                    alt={wallet.adapter.name}
                                                    className="wallet-icon"
                                                />
                                                <span>{wallet.adapter.name}</span>
                                                <ExternalLink size={16} className="wallet-arrow" />
                                            </button>
                                        ))
                                ) : (
                                    <div className="no-wallets-message">
                                        <p>No wallets detected.</p>
                                        <p className="small">Install Phantom, Solflare, or Backpack to continue.</p>
                                        <a
                                            href="https://phantom.app/download"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="install-wallet-link"
                                        >
                                            <ExternalLink size={16} />
                                            Install Phantom
                                        </a>
                                    </div>
                                )}
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
                    <p>
                        {isAndroid
                            ? "Optimized for Solana Seeker & Phantom"
                            : "Secured by Solana Mobile Stack"}
                    </p>
                </div>

                <button className="help-link" onClick={() => navigate('/help')}>
                    <HelpCircle size={16} />
                    <span>How wallets work</span>
                </button>
            </div>
        </div>
    );
}
