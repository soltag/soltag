import { useEffect, useState, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import { HelpCircle, Wallet, Loader2, Smartphone } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { requestAuthNonce, signInWithWallet } from '../services/api';
import {
    isMWAAvailable,
    authenticateWithMWA,
    getStoredWalletPubkey
} from '../services/mwaService';

import './ConnectWalletScreen.css';

export default function ConnectWalletScreen() {
    const navigate = useNavigate();
    const { connected, publicKey, signMessage, connecting } = useWallet();
    const { setVisible } = useWalletModal();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [pendingAuth, setPendingAuth] = useState(false);
    const [isMWAMode, setIsMWAMode] = useState(false);

    // Check if we should use direct MWA (Android) or wallet-adapter
    const shouldUseMWA = isMWAAvailable();

    // Perform Sign-in-with-Solana after wallet is connected (wallet-adapter path)
    const performAuth = useCallback(async () => {
        if (!connected || !publicKey || !signMessage || isAuthenticating) {
            return;
        }

        // If we're already authenticated for this wallet, just move on
        const savedToken = localStorage.getItem('soltag_auth_token');
        const savedWallet = localStorage.getItem('soltag_wallet_pubkey');

        if (savedToken && savedWallet === publicKey.toBase58()) {
            navigate('/home');
            return;
        }

        try {
            setIsAuthenticating(true);
            setAuthError(null);

            // 1. Get Nonce
            const address = publicKey.toBase58();
            const nonce = await requestAuthNonce(address);

            // 2. Sign Message
            const message = new TextEncoder().encode(`Sign this message to authenticate with Soltag: ${nonce}`);
            const signature = await signMessage(message);

            // 3. Verify & Sign In
            const result = await signInWithWallet(address, signature, nonce);

            if (result.ok) {
                localStorage.setItem('soltag_wallet_pubkey', address);
                localStorage.setItem('soltag_username', 'Explorer');
                navigate('/home');
            } else {
                setAuthError(result.error);
            }
        } catch (err) {
            console.error('Authentication failed:', err);
            setAuthError('Signature request cancelled or failed.');
        } finally {
            setIsAuthenticating(false);
            setPendingAuth(false);
        }
    }, [connected, publicKey, signMessage, isAuthenticating, navigate]);

    // Perform MWA authentication (direct protocol path)
    // Uses single transact() for both authorize AND signMessage
    const performMWAAuth = useCallback(async () => {
        try {
            setIsAuthenticating(true);
            setIsMWAMode(true);
            setAuthError(null);

            // Step 1: Get nonce first (before opening wallet)
            // We'll use a temporary address for the nonce request
            console.log('[ConnectWallet] Getting auth nonce...');

            // For MWA, we do a combined flow:
            // 1. First get a generic nonce (or use timestamp-based)
            // 2. Open wallet, authorize, AND sign in single session

            // Use timestamp-based nonce for initial request
            const tempNonce = `soltag_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const messageToSign = `Sign this message to authenticate with Soltag: ${tempNonce}`;

            console.log('[ConnectWallet] Starting combined MWA auth + sign...');
            const mwaResult = await authenticateWithMWA(messageToSign);

            if (!mwaResult) {
                throw new Error('Wallet connection was cancelled or failed');
            }

            const { publicKey: walletAddress, signature } = mwaResult;
            console.log('[ConnectWallet] MWA connected and signed:', walletAddress);


            // Verify with server using the temp nonce (server accepts any valid nonce format)
            const result = await signInWithWallet(walletAddress, signature, tempNonce);

            if (result.ok) {
                localStorage.setItem('soltag_wallet_pubkey', walletAddress);
                localStorage.setItem('soltag_username', 'Explorer');
                navigate('/home');
            } else {
                // Server might reject temp nonce, that's expected in some cases
                console.log('[ConnectWallet] Server auth result:', result);
                setAuthError(result.error || 'Authentication failed. Please try again.');
            }
        } catch (err) {
            console.error('[ConnectWallet] MWA auth failed:', err);
            setAuthError(
                err instanceof Error
                    ? err.message
                    : 'Wallet connection failed. Please try again.'
            );
        } finally {
            setIsAuthenticating(false);
            setIsMWAMode(false);
        }
    }, [navigate]);

    // When wallet connects and we have a pending auth, perform it (wallet-adapter path)
    useEffect(() => {
        if (connected && publicKey && pendingAuth && !shouldUseMWA) {
            performAuth();
        }
    }, [connected, publicKey, pendingAuth, performAuth, shouldUseMWA]);

    // Check for existing auth on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('soltag_auth_token');
        const savedWallet = getStoredWalletPubkey();

        if (savedToken && savedWallet) {
            navigate('/home');
        }
    }, [navigate]);

    // Handle wallet connection
    const handleConnectWallet = useCallback(async () => {
        setAuthError(null);

        if (shouldUseMWA) {
            // Android: Use direct MWA protocol
            console.log('[ConnectWallet] Using direct MWA protocol');
            await performMWAAuth();
        } else {
            // Desktop/iOS: Use wallet-adapter modal
            console.log('[ConnectWallet] Using wallet-adapter modal');
            setVisible(true);
            setPendingAuth(true);
        }
    }, [shouldUseMWA, performMWAAuth, setVisible]);

    const handleHelpClick = () => {
        navigate('/help');
    };

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
                            <p>
                                {isMWAMode
                                    ? 'Opening wallet...'
                                    : connecting
                                        ? 'Connecting wallet...'
                                        : 'Authenticating with wallet...'}
                            </p>
                        </div>
                    ) : connected && !shouldUseMWA ? (
                        <div className="auth-loading">
                            <Loader2 className="animate-spin" size={32} />
                            <p>Completing authentication...</p>
                        </div>
                    ) : (
                        <button
                            className="solana-wallet-button custom-connect-btn"
                            onClick={handleConnectWallet}
                            disabled={isLoading}
                        >
                            {shouldUseMWA ? <Smartphone size={20} /> : <Wallet size={20} />}
                            <span>
                                {shouldUseMWA ? 'Connect Mobile Wallet' : 'Connect Wallet'}
                            </span>
                        </button>
                    )}
                </div>

                {authError && (
                    <div className="auth-error animate-fade-in">
                        <p>{authError}</p>
                    </div>
                )}


                <div className="security-note">
                    <p>Secured by Solana Mobile Wallet Adapter</p>
                </div>

                <button className="help-link" onClick={handleHelpClick}>
                    <HelpCircle size={16} />
                    <span>How wallets work</span>
                </button>
            </div>
        </div>
    );
}
