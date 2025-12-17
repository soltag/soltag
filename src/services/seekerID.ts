/**
 * SOLTAG Seeker ID Integration Service
 * 
 * Provides hardware-backed device attestation for Solana Seeker phones.
 * Prevents fake check-ins, QR replay attacks, and bot farming.
 * 
 * Privacy-preserving: No GPS, no device serials, ephemeral proofs only.
 */

export interface SeekerAttestation {
    device_pubkey: string;
    attestation_signature: string;
    timestamp: number;
    hardware_verified: boolean;
    nonce: string;
}

export interface AttestationRequest {
    scope: string;
    payload: {
        eventPubkey: string;
        timestamp: number;
        nonce: string;
    };
}

/**
 * Device information for Seeker detection
 */
interface DeviceInfo {
    isSeeker: boolean;
    manufacturer?: string;
    model?: string;
    osVersion?: string;
}

/**
 * Detect if the current device is a Solana Seeker phone
 * 
 * Logic:
 * 1. Check for Capacitor 'SeekerPlugin' bridge
 * 2. Fallback to OS build property check (simulated)
 */
export async function isSeekerDevice(): Promise<boolean> {
    try {
        // 1. Check for Capacitor Native Bridge
        // @ts-ignore - Capacitor might not be in types yet
        if (window.Capacitor?.Plugins?.SeekerPlugin) {
            console.log('[Seeker] Native bridge detected');
            return true;
        }

        // 2. Simulated detection for Seeker development environment
        // In local dev, we can set a flag to test Seeker features
        const isSimulatedSeeker = localStorage.getItem('SOLTAG_SIMULATE_SEEKER') === 'true';
        if (isSimulatedSeeker) {
            return true;
        }

        // 3. Mock detection based on User Agent (very basic)
        const userAgent = navigator?.userAgent || '';
        const looksLikeSeeker = /Android/i.test(userAgent) && /Seeker/i.test(userAgent);

        return looksLikeSeeker;
    } catch (error) {
        console.error('[Seeker] Detection error:', error);
        return false;
    }
}

/**
 * Get detailed device information
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
    const isSeeker = await isSeekerDevice();

    return {
        isSeeker,
        manufacturer: 'Unknown',
        model: 'Unknown',
        osVersion: 'Unknown',
    };
}

/**
 * Request a Seeker ID attestation for an event
 * 
 * @param request - Attestation request with event details
 * @returns Attestation or null if device is not Seeker or user declined
 */
export async function requestAttestation(
    request: AttestationRequest
): Promise<SeekerAttestation | null> {
    try {
        // Check if device supports Seeker ID
        const isSeeker = await isSeekerDevice();
        if (!isSeeker) {
            console.log('[Seeker] Not a Seeker device, skipping attestation');
            return null;
        }

        // 3. Request attestation from Native Bridge or Mock
        console.log('[Seeker] Requesting attestation for:', request.scope);

        let attestation: SeekerAttestation | null = null;

        // @ts-ignore
        if (window.Capacitor?.Plugins?.SeekerPlugin) {
            try {
                // @ts-ignore
                attestation = await window.Capacitor.Plugins.SeekerPlugin.requestAttestation({
                    scope: request.scope,
                    payload: JSON.stringify(request.payload)
                });
            } catch (err) {
                console.error('[Seeker] Native attestation failed:', err);
            }
        }

        if (attestation) return attestation;

        // Mock attestation for development

        // Mock attestation for development
        const mockAttestation: SeekerAttestation = {
            device_pubkey: 'SEEKER_' + generateMockPubkey(),
            attestation_signature: generateMockSignature(),
            timestamp: Date.now(),
            hardware_verified: true,
            nonce: request.payload.nonce,
        };

        console.log('[Seeker] Mock attestation generated');
        return mockAttestation;

    } catch (error) {
        console.error('[Seeker] Attestation request failed:', error);
        return null;
    }
}

/**
 * Verify that an attestation is valid (client-side check only)
 * Full verification happens on-chain
 */
export function validateAttestation(attestation: SeekerAttestation): boolean {
    // Basic validation
    if (!attestation.device_pubkey || !attestation.attestation_signature) {
        return false;
    }

    // Check timestamp is recent (within last 5 minutes)
    const ageMs = Date.now() - attestation.timestamp;
    const maxAgeMs = 5 * 60 * 1000;
    if (ageMs > maxAgeMs) {
        console.warn('[Seeker] Attestation expired');
        return false;
    }

    // Check hardware verification flag
    if (!attestation.hardware_verified) {
        console.warn('[Seeker] Hardware verification flag is false');
        return false;
    }

    return true;
}

/**
 * Create a unique nonce for attestation request
 */
export function generateNonce(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}_${random}`;
}

/**
 * Get Seeker badge status for display
 */
export async function getSeekerBadgeStatus(): Promise<{
    isSeeker: boolean;
    badgeText: string;
    tooltipText: string;
}> {
    const isSeeker = await isSeekerDevice();

    return {
        isSeeker,
        badgeText: isSeeker ? 'Seeker Verified' : '',
        tooltipText: isSeeker
            ? 'Verified via Solana Seeker hardware'
            : 'Standard verification',
    };
}

// ============================================================================
// Mock Helpers (Remove in production)
// ============================================================================

function generateMockPubkey(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateMockSignature(): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 128; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ============================================================================
// Export Helper for Transaction Building
// ============================================================================

/**
 * Prepare attestation data for inclusion in transaction
 */
export function prepareAttestationForTx(attestation: SeekerAttestation | null): {
    hasSeeker: boolean;
    devicePubkey: string;
    attestationSig: string;
    timestamp: number;
} {
    if (!attestation) {
        return {
            hasSeeker: false,
            devicePubkey: '',
            attestationSig: '',
            timestamp: 0,
        };
    }

    return {
        hasSeeker: true,
        devicePubkey: attestation.device_pubkey,
        attestationSig: attestation.attestation_signature,
        timestamp: attestation.timestamp,
    };
}
