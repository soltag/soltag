import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Copy, CheckCircle } from 'lucide-react';
import type { QRPayload } from '../types';
import './TransactionPendingScreen.css';

export default function TransactionPendingScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const qrPayload = location.state?.qrPayload as QRPayload | undefined;

    const [status, setStatus] = useState<'signing' | 'sending' | 'confirming' | 'done'>('signing');
    const [txSignature] = useState('5wHu3mPq9X8kL2nV4bC7jR1dF6tY0sAqE3zI8uO9pN1c');
    const [copied, setCopied] = useState(false);

    // Simulate transaction flow
    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];

        timers.push(setTimeout(() => setStatus('sending'), 1000));
        timers.push(setTimeout(() => setStatus('confirming'), 2000));
        timers.push(setTimeout(() => {
            setStatus('done');
            navigate('/success', { state: { qrPayload, txSignature } });
        }, 4000));

        return () => timers.forEach(clearTimeout);
    }, [navigate, qrPayload, txSignature]);

    const handleCopy = async () => {
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
                        <code>{txSignature.slice(0, 8)}...{txSignature.slice(-8)}</code>
                        <button
                            className="copy-btn"
                            onClick={handleCopy}
                            aria-label="Copy signature"
                        >
                            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                        </button>
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
