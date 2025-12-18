import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { ArrowLeft, Award, Shield, Clock, Hash, Wallet, Loader2 } from 'lucide-react';
import { buildCheckInTransaction, isSeekerDevice } from '../services/solanaService';
import { syncAttendanceFromChain } from '../services/syncService';
import { supabase } from '../services/supabaseClient';
import { PublicKey } from '@solana/web3.js';

import type { QRPayload } from '../types';

import './ConfirmMintScreen.css';

export default function ConfirmMintScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const qrPayload = location.state?.qrPayload as QRPayload | undefined;
    const [isSeekerVerified, setIsSeekerVerified] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [statusText, setStatusText] = useState('');


    // Navigation Guard
    useEffect(() => {
        if (!publicKey && !localStorage.getItem('soltag_wallet_pubkey')) {
            navigate('/connect');
        }
    }, [publicKey, navigate]);

    const eventName = qrPayload?.meta?.name || 'Event';

    useEffect(() => {
        const checkSeekerStatus = async () => {
            const verified = await isSeekerDevice();
            setIsSeekerVerified(verified);
        };
        checkSeekerStatus();
    }, []);


    const handleConfirm = async () => {
        if (!qrPayload || !publicKey) return;

        try {
            setIsSigning(true);
            setStatusText('Building transaction...');

            // Step 4: Build transaction
            const eventPubkey = new PublicKey(qrPayload.event_pubkey);
            const transaction = await buildCheckInTransaction(
                publicKey,
                eventPubkey,
                qrPayload.zone_code
            );

            // Step 5: Wallet signing flow
            setStatusText('Please sign in your wallet');
            const signature = await sendTransaction(transaction, connection);

            // Step 7: Confirmation & finality
            setStatusText('Confirming on blockchain...');
            await connection.confirmTransaction(signature, 'confirmed');

            // Step 8: Sync with Supabase for indexer-verified record
            setStatusText('Verifying on-chain state...');

            // Get event UUID from Supabase (needed for relational mapping)
            const { data: eventData } = await supabase
                .from('events')
                .select('id')
                .eq('event_pubkey', qrPayload.event_pubkey)
                .single();

            if (eventData) {
                const syncResult = await syncAttendanceFromChain(
                    signature,
                    publicKey.toBase58(),
                    eventData.id,
                    qrPayload.zone_code
                );

                if (!syncResult.ok) {
                    console.error('Sync failed, but on-chain TX succeeded:', syncResult.error);
                    // We don't block the UI here since TX succeeded; the backfill indexer will catch it
                }
            }

            // Navigate to success screen

            navigate('/success', {
                state: {
                    qrPayload,
                    txSignature: signature,
                    isSeeker: isSeekerVerified
                }
            });

        } catch (error) {
            console.error('Check-in failed:', error);
            setStatusText('Transaction failed. Check your wallet.');
            setIsSigning(false);
        }
    };


    return (
        <div className="confirm-screen">
            <header className="confirm-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>Confirm Attendance</h1>
            </header>

            <div className="confirm-content animate-slide-up">
                {/* Credential preview */}
                <div className="credential-preview">
                    <div className="credential-preview-header">
                        <Award size={32} />
                        <span>SOLTAG CREDENTIAL</span>
                    </div>
                    <h2 className="credential-preview-title">{eventName}</h2>
                    <div className="credential-preview-badge">
                        <span>NON-TRANSFERABLE</span>
                    </div>
                </div>

                {/* What will be minted */}
                <div className="mint-details">
                    <h3>Data included on-chain</h3>
                    <ul className="mint-details-list">
                        <li>
                            <Hash size={16} />
                            <span>Event ID</span>
                            <code>{qrPayload?.event_pubkey?.slice(0, 8)}...</code>
                        </li>
                        <li>
                            <Shield size={16} />
                            <span>Zone hash (privacy-preserving)</span>
                        </li>
                        <li>
                            <Clock size={16} />
                            <span>Issued timestamp</span>
                        </li>
                        {isSeekerVerified && (
                            <li className="seeker-verified-item">
                                <Shield size={16} className="seeker-shield-icon" />
                                <span>Seeker hardware verified</span>
                                <span className="seeker-badge">SEEKER_ID_ATTESTED</span>
                            </li>
                        )}

                    </ul>
                </div>

                {/* Gas estimate */}
                <div className="gas-estimate">
                    <Wallet size={18} />
                    <span>Estimated fee:</span>
                    <span className="gas-amount">~0.0001 SOL</span>
                    <span className="gas-label">Low fee (compressed mint)</span>
                </div>

                {/* Privacy reminder */}
                <div className="confirm-notice">
                    <Shield size={18} />
                    <p>
                        This action will mint a privacy-preserving attendance credential to your wallet.
                        It is <strong>non-transferable</strong>. Proceed?
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="confirm-actions">
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                    disabled={isSigning}
                >
                    Cancel
                </button>

                <button
                    className="btn btn-primary"
                    onClick={handleConfirm}
                    disabled={!publicKey || isSigning}
                >
                    {isSigning ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>{statusText || 'Processing...'}</span>
                        </>
                    ) : (
                        publicKey ? 'Confirm & Sign' : 'Connect Wallet to Sign'
                    )}
                </button>

            </div>
        </div>
    );
}
