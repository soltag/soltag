import { useEffect, useState, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import { HelpCircle, Wallet, Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { requestAuthNonce, signInWithWallet } from '../services/api';

import './ConnectWalletScreen.css';

export default function ConnectWalletScreen() {
    const navigate = useNavigate();
    const { connected, publicKey, signMessage, connect, select, wallets, connecting } = useWallet();
    const { setVisible } = useWalletModal();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [pendingAuth, setPendingAuth] = useState(false);

    // Perform Sign-in-with-Solana after wallet is connected
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

    // When wallet connects and we have a pending auth, perform it
    useEffect(() => {
        if (connected && publicKey && pendingAuth) {
            performAuth();
        }
    }, [connected, publicKey, pendingAuth, performAuth]);

    // Handle wallet connection - single user action for MWA compliance
    const handleConnectWallet = useCallback(async () => {
        setAuthError(null);

        // Check if there's already a wallet adapter selected/ready
        const mwaWallet = wallets.find(w => w.adapter.name === 'Mobile Wallet Adapter');

        if (mwaWallet && mwaWallet.readyState === 'Installed') {
            // MWA is available - use it directly
            try {
                select(mwaWallet.adapter.name);
                setPendingAuth(true);
                await connect();
            } catch (err) {
                console.error('MWA connection failed:', err);
                // Fallback to wallet modal
                setVisible(true);
                setPendingAuth(true);
            }
        } else {
            // No MWA or not installed - show wallet modal
            setVisible(true);
            setPendingAuth(true);
        }
    }, [wallets, select, connect, setVisible]);

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
                            <p>{connecting ? 'Connecting wallet...' : 'Authenticating with wallet...'}</p>
                        </div>
                    ) : connected ? (
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
                            <Wallet size={20} />
                            <span>Connect Wallet</span>
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
