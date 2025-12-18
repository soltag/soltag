// Event data model
export interface Event {
    id: string;
    name: string;
    description?: string;
    event_pubkey: string;
    start_ts: number;
    end_ts: number;
    zone_codes: string[];
    organizer: {
        name: string;
        contact?: string;
        pubkey?: string;
    };
    metadata_uri?: string;
    qr_template?: string;
    rotation_period_secs?: number;
    image?: string;
    location?: string;
    attended?: boolean;
    bookmarked?: boolean;
}

// QR Payload (canonical scanned object)
export interface QRPayload {
    v: number;
    event_id: string;      // Matches Supabase events.id
    asset: string;         // Mint address of the attendee asset (NFT)
    nonce: string;         // Random 128-bit challenge
    issued_at: number;     // Timestamp (Unix secs)
    expires_at: number;    // Timestamp (Unix secs)
    zone: string;          // Human-readable zone string
    sig: string;           // Ed25519 signature from organizer
}

// Credential (SBT - Soulbound Token)
export interface Credential {
    id: string;
    owner_pubkey: string;
    event_id: string;
    event_name: string;
    zone_hash: string;
    issued_at: number;
    tx_sig?: string;
    metadata_uri?: string;
    transferable: false;
    image?: string;
    category?: 'conference' | 'gym' | 'ticket' | 'meetup' | 'other';
}

// Offline Queue Item
export interface QueueItem {
    id: string;
    signedTx: string;
    eventId: string;
    eventName: string;
    createdAt: number;
    status: 'signed' | 'pending' | 'needsResign' | 'failed';
    retries: number;
    durableNonceAccount?: string;
}

// Wallet state
export interface WalletState {
    connected: boolean;
    connecting: boolean;
    publicKey: string | null;
    displayName?: string;
    error?: string;
}

// Notification
export interface Notification {
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    credentialId?: string;
    eventId?: string;
}

// Verification status for scan flow
export interface VerificationStatus {
    signature: 'checking' | 'valid' | 'invalid';
    timeWindow: 'checking' | 'valid' | 'expired' | 'notStarted';
    location: 'checking' | 'valid' | 'mismatch' | 'denied';
    duplicate: 'checking' | 'clear' | 'duplicate';
    onChain: 'waiting' | 'signing' | 'confirming' | 'finalized' | 'failed';
}


// Settings
export interface Settings {
    publicVisibility: boolean;
    autoResubmitQueue: boolean;
    cameraPermission: boolean;
    locationPermission: boolean;
    rpcEndpoint: string;
}

// Navigation tabs
export type TabName = 'home' | 'events' | 'profile' | 'queue' | 'settings';
