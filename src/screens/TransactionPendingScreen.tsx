import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { mintAttendanceNFT } from '../services/api';
import { ledgerService } from '../services/ledgerService';
import { mockEvents } from '../data/mockData';
import type { QRPayload } from '../types';
import './TransactionPendingScreen.css';

export default function TransactionPendingScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { publicKey } = useWallet();
    const qrPayload = location.state?.qrPayload as QRPayload | undefined;

    const [status, setStatus] = useState<'signing' | 'sending' | 'confirming' | 'done'>('signing');
    const [txSignature, setTxSignature] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Real transaction flow
    useEffect(() => {
        let isCancelled = false;

        const performMint = async () => {
            if (!qrPayload || !publicKey) {
                if (!publicKey && !isCancelled) setError('Wallet not connected');
                return;
            }

            try {
                // 1. Sign (Simulated or real if using adapter)
                setStatus('signing');
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (isCancelled) return;

                // 2. Send & Confirm (via Relay)
                setStatus('sending');
                const result = await mintAttendanceNFT(qrPayload, publicKey.toBase58());

                if (isCancelled) return;

                if (result.ok) {
                    setTxSignature(result.signature);

                    // Find the event to get the human-readable name if possible
                    const event = mockEvents.find(e => e.event_pubkey === qrPayload.event_pubkey);

                    // 3. Register in local ledger
                    await ledgerService.addCredential({
                        id: `cred-${Date.now()}`,
                        owner_pubkey: publicKey.toBase58(),
                        event_id: event?.id || qrPayload.event_pubkey,
                        event_name: event?.name || 'Verified Attendance',
                        zone_hash: qrPayload.zone_code,
                        issued_at: Date.now(),
                        tx_sig: result.signature,
                        category: 'conference',
                        transferable: false
                    });

                    if (isCancelled) return;
                    setStatus('confirming');
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    if (isCancelled) return;
                    setStatus('done');

                    // Navigate to success
                    setTimeout(() => {
                        if (!isCancelled) {
                            navigate('/success', { state: { qrPayload, txSignature: result.signature } });
                        }
                    }, 1000);
                } else {
                    setError(result.error);
                }
            } catch (err) {
                console.error('Minting failed:', err);
                if (!isCancelled) setError('Transaction failed. Please try again.');
            }
        };

        performMint();

        return () => {
            isCancelled = true;
        };
    }, [navigate, qrPayload, publicKey]);

    const handleCopy = async () => {
        if (!txSignature) return;
        await navigator.clipboard.writeText(txSignature);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const statusMessages = {
        signing: 'Waiting for wallet signature...',
        sending: 'Sending transaction...',
        confirming: 'Watching for finalization...',
        done: 'Transaction confirmed!'
    };

    if (error) {
        return (
            <div className="pending-screen">
                <div className="pending-content animate-fade-in">
                    <div className="error-container">
                        <AlertCircle size={64} className="text-error" />
                        <h2>Minting Failed</h2>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={() => navigate(-1)}>
                            Back to Confirm
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pending-screen">
            <div className="pending-content animate-fade-in">
                <div className="pending-animation">
                    {status !== 'done' ? (
                        <div className="loader-container">
                            <Loader2 size={64} className="animate-spin" />
                            <div className="loader-glow" />
                        </div>
                    ) : (
                        <div className="success-container">
                            <CheckCircle size={64} />
                        </div>
                    )}
                </div>

                <p className="pending-status">{statusMessages[status]}</p>

                {/* Transaction signature */}
                <div className="tx-signature">
                    <span className="tx-label">Transaction signature</span>
                    <div className="tx-value">
                        <code>
                            {txSignature
                                ? `${txSignature.slice(0, 8)}...${txSignature.slice(-8)}`
                                : 'Processing...'}
                        </code>
                        {txSignature && (
                            <button
                                className="copy-btn"
                                onClick={handleCopy}
                                aria-label="Copy signature"
                            >
                                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress steps */}
                <div className="progress-steps">
                    <div className={`step ${status !== 'signing' ? 'complete' : 'active'}`}>
                        <div className="step-dot" />
                        <span>Sign</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${status === 'confirming' || status === 'done' ? (status === 'done' ? 'complete' : 'active') : ''}`}>
                        <div className="step-dot" />
                        <span>Send</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${status === 'done' ? 'complete' : ''}`}>
                        <div className="step-dot" />
                        <span>Confirm</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
