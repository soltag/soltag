/**
 * TypeScript type definitions for Seeker ID integration
 */

export interface SeekerAttestation {
    device_pubkey: string;
    attestation_signature: string;
    timestamp: number;
    hardware_verified: boolean;
    nonce: string;
}

export interface SeekerCredentialMetadata {
    verified_device: boolean;
    verification_type: 'seeker' | 'standard';
    issued_at: number;
    trust_level: 'hardware_verified' | 'standard' | 'offline';
    device_attestation_hash?: string;
}

export interface SeekerBadgeStatus {
    isSeeker: boolean;
    badgeText: string;
    tooltipText: string;
    trustBoost: number; // Multiplier for reputation (1.0 = none, 1.5 = Seeker boost)
}

export type VerificationType = 'seeker' | 'standard';
export type TrustLevel = 'hardware_verified' | 'standard' | 'offline';
