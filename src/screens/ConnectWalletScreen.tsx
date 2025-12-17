import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import './ConnectWalletScreen.css';

export default function ConnectWalletScreen() {
    const navigate = useNavigate();
    const { connected, publicKey } = useWallet();

    useEffect(() => {
        if (connected && publicKey) {
            // Retrieve existing profile or set defaults
            const savedUsername = localStorage.getItem('soltag_username');
            if (!savedUsername) {
                localStorage.setItem('soltag_username', 'Explorer');
            }

            // Sync with local storage for legacy components (if any)
            localStorage.setItem('soltag_wallet_connected', 'true');
            localStorage.setItem('soltag_wallet_pubkey', publicKey.toBase58());

            // Navigate to home
            navigate('/home');
        }
    }, [connected, publicKey, navigate]);

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
                    <WalletMultiButton className="solana-wallet-button" />
                </div>

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
