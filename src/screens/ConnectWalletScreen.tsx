import { useEffect, useState, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import { HelpCircle, Wallet, Loader2, Smartphone } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { requestAuthNonce, signInWithWallet } from '../services/api';
import {
    isMWAAvailable,
    connectWithMWA,
    signMessageWithMWA,
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
    const performMWAAuth = useCallback(async () => {
        try {
            setIsAuthenticating(true);
            setIsMWAMode(true);
            setAuthError(null);

            // Step 1: Connect with MWA
            console.log('[ConnectWallet] Starting MWA connection...');
            const mwaResult = await connectWithMWA();

            if (!mwaResult) {
                throw new Error('MWA connection cancelled or failed');
            }

            const { publicKey: walletAddress } = mwaResult;
            console.log('[ConnectWallet] MWA connected:', walletAddress);

            // Step 2: Get nonce for SIWS
            const nonce = await requestAuthNonce(walletAddress);

            // Step 3: Sign message with MWA
            const message = new TextEncoder().encode(
                `Sign this message to authenticate with Soltag: ${nonce}`
            );
            const signature = await signMessageWithMWA(message);

            if (!signature) {
                throw new Error('Message signing cancelled or failed');
            }

            // Step 4: Verify & Sign In
            const result = await signInWithWallet(walletAddress, signature, nonce);

            if (result.ok) {
                localStorage.setItem('soltag_wallet_pubkey', walletAddress);
                localStorage.setItem('soltag_username', 'Explorer');
                navigate('/home');
            } else {
                setAuthError(result.error || 'Authentication failed');
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
