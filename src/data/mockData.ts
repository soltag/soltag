import type { Event, Credential, QueueItem, Notification } from '../types';

// Mock Events
export const mockEvents: Event[] = [
    {
        id: 'evt-001',
        name: 'Solana Breakpoint 2025',
        description: 'The premier Solana conference bringing together builders, founders, and enthusiasts from around the world.',
        event_pubkey: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        start_ts: Date.now() + 86400000, // Tomorrow
        end_ts: Date.now() + 86400000 + 28800000, // Tomorrow + 8 hours
        zone_codes: ['dr5ru', 'dr5rv'],
        organizer: {
            name: 'Solana Foundation',
            contact: 'events@solana.org',
            pubkey: '9JK..abc'
        },
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
        location: 'Singapore',
        attended: false,
        bookmarked: true
    },
    {
        id: 'evt-002',
        name: 'Web3 Builders Night',
        description: 'Monthly meetup for Web3 developers and enthusiasts. Network, share ideas, and build together.',
        event_pubkey: '8yLXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgBsV',
        start_ts: Date.now() - 3600000, // Started 1 hour ago
        end_ts: Date.now() + 7200000, // Ends in 2 hours
        zone_codes: ['dr5ru'],
        organizer: {
            name: 'Superteam',
            contact: 'hello@superteam.fun'
        },
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop',
        location: 'Bangalore, India',
        attended: false,
        bookmarked: false
    },
    {
        id: 'evt-003',
        name: 'DeFi Summit 2025',
        description: 'Explore the future of decentralized finance with industry leaders and innovators.',
        event_pubkey: '6zMXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgCsW',
        start_ts: Date.now() - 604800000, // Last week
        end_ts: Date.now() - 604800000 + 28800000,
        zone_codes: ['9q8y'],
        organizer: {
            name: 'DeFi Alliance',
            pubkey: '5HJ..xyz'
        },
        image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop',
        location: 'San Francisco, USA',
        attended: true,
        bookmarked: false
    },
    {
        id: 'evt-004',
        name: 'NFT Art Exhibition',
        description: 'Experience the intersection of art and blockchain technology at this exclusive exhibition.',
        event_pubkey: '5aNXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgDsX',
        start_ts: Date.now() + 172800000, // In 2 days
        end_ts: Date.now() + 172800000 + 14400000,
        zone_codes: ['u4pr'],
        organizer: {
            name: 'Magic Eden Gallery'
        },
        image: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400&h=300&fit=crop',
        location: 'Tokyo, Japan',
        attended: false,
        bookmarked: true
    },
    {
        id: 'evt-005',
        name: 'Yoga & Wellness Session',
        description: 'Start your day with mindfulness. Check in to earn your wellness badge.',
        event_pubkey: '4bOXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgEsY',
        start_ts: Date.now() - 86400000 * 3, // 3 days ago
        end_ts: Date.now() - 86400000 * 3 + 7200000,
        zone_codes: ['dr5ru'],
        organizer: {
            name: 'Zen Studio'
        },
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
        location: 'Mumbai, India',
        attended: true,
        bookmarked: false
    }
];

// Mock Credentials
export const mockCredentials: Credential[] = [
    {
        id: 'cred-001',
        owner_pubkey: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
        event_id: 'evt-003',
        event_name: 'DeFi Summit 2025',
        zone_hash: 'a1b2c3d4e5f6789...',
        issued_at: Date.now() - 604800000,
        tx_sig: '5wHu...3mPq',
        transferable: false,
        image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop',
        category: 'conference'
    },
    {
        id: 'cred-002',
        owner_pubkey: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
        event_id: 'evt-005',
        event_name: 'Yoga & Wellness Session',
        zone_hash: 'f6e5d4c3b2a1098...',
        issued_at: Date.now() - 86400000 * 3,
        tx_sig: '3kJp...9qRt',
        transferable: false,
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
        category: 'gym'
    },
    {
        id: 'cred-003',
        owner_pubkey: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
        event_id: 'evt-006',
        event_name: 'Hacker House Berlin',
        zone_hash: 'c3d4e5f6a7b8901...',
        issued_at: Date.now() - 86400000 * 14,
        tx_sig: '8mNk...2pLs',
        transferable: false,
        category: 'conference'
    }
];

// Mock Queue Items
export const mockQueueItems: QueueItem[] = [
    {
        id: 'queue-001',
        signedTx: 'base64encodedtx...',
        eventId: 'evt-002',
        eventName: 'Web3 Builders Night',
        createdAt: Date.now() - 300000, // 5 min ago
        status: 'pending',
        retries: 1,
        durableNonceAccount: 'nonce123...'
    }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
    {
        id: 'notif-001',
        type: 'success',
        title: 'Attendance Recorded',
        message: 'Your DeFi Summit 2025 credential has been minted successfully.',
        timestamp: Date.now() - 604800000,
        read: true,
        credentialId: 'cred-001'
    },
    {
        id: 'notif-002',
        type: 'info',
        title: 'New Event Nearby',
        message: 'Web3 Builders Night is happening now near you!',
        timestamp: Date.now() - 3600000,
        read: false,
        eventId: 'evt-002'
    },
    {
        id: 'notif-003',
        type: 'warning',
        title: 'Transaction Pending',
        message: 'Your check-in is queued and will be submitted when connected.',
        timestamp: Date.now() - 300000,
        read: false
    }
];

// Format timestamp to readable date
export function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Format timestamp to readable time
export function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Format full date and time
export function formatDateTime(timestamp: number): string {
    return `${formatDate(timestamp)} · ${formatTime(timestamp)}`;
}

// Shorten wallet address
export function shortenAddress(address: string, chars = 4): string {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Get event status
export function getEventStatus(event: Event): 'upcoming' | 'active' | 'past' {
    const now = Date.now();
    if (now < event.start_ts) return 'upcoming';
    if (now > event.end_ts) return 'past';
    return 'active';
}

// Time remaining or ago
export function getTimeLabel(timestamp: number): string {
    const now = Date.now();
    const diff = timestamp - now;
    const absDiff = Math.abs(diff);

    const minutes = Math.floor(absDiff / 60000);
    const hours = Math.floor(absDiff / 3600000);
    const days = Math.floor(absDiff / 86400000);

    if (diff > 0) {
        // Future
        if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
        return `In ${minutes} min`;
    } else {
        // Past
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${minutes} min ago`;
    }
}
