import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { requestAuthNonce, signInWithWallet } from '../services/api';
import { Loader2 } from 'lucide-react';

import './ConnectWalletScreen.css';

export default function ConnectWalletScreen() {
    const navigate = useNavigate();
    const { connected, publicKey, signMessage } = useWallet();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);


    useEffect(() => {
        const performAuth = async () => {
            if (connected && publicKey && !isAuthenticating) {
                // If we're already authenticated for this wallet, just move on
                const savedToken = localStorage.getItem('soltag_auth_token');
                const savedWallet = localStorage.getItem('soltag_wallet_pubkey');

                if (savedToken && savedWallet === publicKey.toBase58()) {
                    navigate('/home');
                    return;
                }

                // Otherwise, perform Sign-in-with-Solana
                if (!signMessage) {
                    setAuthError('Your wallet does not support message signing.');
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
                }
            }
        };

        performAuth();
    }, [connected, publicKey, navigate, signMessage]);


    const handleHelpClick = () => {
        navigate('/help');
    };

    return (
        <div className="connect-wallet-screen">
            <div className="connect-content animate-slide-up">
                <h1 className="connect-title">Connect your wallet</h1>
                <p className="connect-subtitle">
                    Connect your Solana wallet to verify your identity and mint attendance credentials.
                </p>

                <div className="wallet-adapter-container">
                    {isAuthenticating ? (
                        <div className="auth-loading">
                            <Loader2 className="animate-spin" size={32} />
                            <p>Authenticating with wallet...</p>
                        </div>
                    ) : (
                        <WalletMultiButton className="solana-wallet-button" />
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
