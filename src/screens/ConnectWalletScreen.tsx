import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HelpCircle, Wallet, Loader2, Smartphone, AlertCircle, User } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { signInWithWallet } from '../services/api';
import {
    isMWAAvailable,
    authenticateWithMWA,
} from '../services/mwaService';
import { useAuthStore } from '../stores/authStore';
import {
    connectToPhantom,
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
const AUTH_METHOD_KEY = 'soltag_auth_method'; // 'mwa' or 'deeplink'

export default function ConnectWalletScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { connected, publicKey, signMessage, connecting } = useWallet();
    const { setVisible } = useWalletModal();

    // We'll use a local ref or state if needed for pending, but currently redundant
    // because App root handles auth navigation.

    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [authMethod, setAuthMethod] = useState<'mwa' | 'deeplink' | 'adapter' | null>(null);

    const isMWASupported = isMWAAvailable();
    const isAndroid = isAndroidDevice();

    // Ref to prevent double-initialization of MWA flow
    const mwaInProgress = useRef(false);

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

    // Perform MWA authentication (Primary Path)
    const performMWAAuth = useCallback(async () => {
        if (mwaInProgress.current) return;

        try {
            mwaInProgress.current = true;
            setIsAuthenticating(true);
            setAuthMethod('mwa');
            setAuthError(null);
            setStatusMessage('Opening mobile wallet...');

            const nonce = `soltag_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const messageToSign = `Sign this message to authenticate with Soltag: ${nonce}`;

            console.log('[Auth] [MWA] Initiating native MWA transact...');
            const mwaResult = await authenticateWithMWA(messageToSign);

            if (!mwaResult) {
                // If MWA fails or is cancelled, we fall back to deep-link on Android
                if (isAndroid) {
                    console.log('[Auth] [MWA] Failed or unsupported. Falling back to deep-link...');
                    handleDeepLinkFallback();
                } else {
                    throw new Error('Mobile wallet adapter interaction failed');
                }
                return;
            }

            setStatusMessage('Verifying credentials...');
            const { publicKey: walletAddress, signature } = mwaResult;

            const result = await signInWithWallet(walletAddress, signature, nonce);

            if (result.ok) {
                await login(walletAddress, 'Explorer', result.token || 'mwa_active');
                navigate('/home');
            } else {
                setAuthError(result.error || 'Identity verification failed');
            }
        } catch (err) {
            console.error('[Auth] [Error] MWA path failed:', err);
            setAuthError(err instanceof Error ? err.message : 'Wallet connection failed');
        } finally {
            setIsAuthenticating(false);
            mwaInProgress.current = false;
        }
    }, [navigate, isAndroid, login]);

    const handleDeepLinkFallback = () => {
        console.log('[Auth] [Fallback] Starting Phantom deep-link flow');
        localStorage.setItem(AUTH_STEP_KEY, 'connecting');
        localStorage.setItem(AUTH_METHOD_KEY, 'deeplink');
        setIsAuthenticating(true);
        setAuthMethod('deeplink');
        setStatusMessage('Redirecting to Phantom...');
        connectToPhantom();
    };

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
    const handleConnectClick = useCallback(() => {
        setAuthError(null);

        if (isMWASupported) {
            performMWAAuth();
        } else if (isAndroid) {
            handleDeepLinkFallback();
        } else {
            // Desktop/iOS
            setVisible(true);
        }
    }, [isMWASupported, isAndroid, performMWAAuth, setVisible]);

    const handleGuestLogin = useCallback(async () => {
        await login('guest_explorer_mode', 'Guest', 'guest_mode_active');
        navigate('/home');
    }, [navigate, login]);

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
                            <button
                                className="solana-wallet-button custom-connect-btn"
                                onClick={handleConnectClick}
                                disabled={isLoading}
                            >
                                {isAndroid ? <Smartphone size={20} /> : <Wallet size={20} />}
                                <span>
                                    {isAndroid ? 'Connect Mobile Wallet' : 'Connect Wallet'}
                                </span>
                            </button>

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
