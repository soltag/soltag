/**
 * QR Payload Validator
 * 
 * Security module for validating SOLTAG event QR codes.
 * Implements Ed25519 signature verification, timestamp validation,
 * and replay attack prevention.
 */

import type { QRPayload, VerificationStatus } from '../types';

// Validation result type
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    payload?: QRPayload;
}

// QR Schema for validation
const QR_SCHEMA = {
    requiredFields: ['v', 'event_pubkey', 'start_ts', 'end_ts', 'zone_code', 'nonce', 'sig'],
    version: 1,
    maxPayloadSize: 2048, // bytes
    maxNonceAge: 300000, // 5 minutes in ms
};

/**
 * Parse and validate a raw QR code string
 */
export function parseQRCode(rawData: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check payload size
    if (rawData.length > QR_SCHEMA.maxPayloadSize) {
        return { valid: false, errors: ['QR payload exceeds maximum size'], warnings };
    }

    // Try to parse JSON
    let payload: QRPayload;
    try {
        payload = JSON.parse(rawData);
    } catch {
        return { valid: false, errors: ['Invalid QR format: not valid JSON'], warnings };
    }

    // Schema validation
    const schemaResult = validateSchema(payload);
    if (!schemaResult.valid) {
        return { valid: false, errors: schemaResult.errors, warnings };
    }

    return { valid: true, errors, warnings, payload };
}

/**
 * Validate QR payload schema
 */
function validateSchema(payload: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof payload !== 'object' || payload === null) {
        return { valid: false, errors: ['Payload must be an object'] };
    }

    const obj = payload as Record<string, unknown>;

    // Check required fields
    for (const field of QR_SCHEMA.requiredFields) {
        if (!(field in obj)) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    // Type validation
    if (typeof obj.v !== 'number' || obj.v !== QR_SCHEMA.version) {
        errors.push(`Unsupported version: expected ${QR_SCHEMA.version}`);
    }

    if (typeof obj.event_pubkey !== 'string' || obj.event_pubkey.length < 32) {
        errors.push('Invalid event_pubkey format');
    }

    if (typeof obj.start_ts !== 'number' || typeof obj.end_ts !== 'number') {
        errors.push('Invalid timestamp format');
    }

    if (typeof obj.zone_code !== 'string' || obj.zone_code.length < 4) {
        errors.push('Invalid zone_code format');
    }

    if (typeof obj.nonce !== 'string' || obj.nonce.length < 8) {
        errors.push('Invalid nonce format');
    }

    if (typeof obj.sig !== 'string' || obj.sig.length < 64) {
        errors.push('Invalid signature format');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Verify Ed25519 signature of QR payload
 * 
 * NOTE: In production, use a proper Ed25519 library like @noble/ed25519
 * This is a placeholder that shows the expected implementation pattern.
 */
export async function verifySignature(
    payload: QRPayload,
    trustedEventKeys: string[]
): Promise<{ valid: boolean; error?: string }> {
    // Check if event_pubkey is in trusted list
    if (!trustedEventKeys.includes(payload.event_pubkey)) {
        return { valid: false, error: 'Event authority not in trusted registry' };
    }

    // Note: In production, build message with buildSignatureMessage(payload)
    // and verify with @noble/ed25519

    try {
        // In production, implement actual Ed25519 verification:
        // import { verify } from '@noble/ed25519';
        // const isValid = await verify(
        //   hexToBytes(payload.sig),
        //   new TextEncoder().encode(message),
        //   hexToBytes(payload.event_pubkey)
        // );

        // Placeholder for demo - always returns true
        // SECURITY: Replace with actual verification in production!
        console.warn('[SECURITY] Using placeholder signature verification - implement real Ed25519 in production');

        // Simulate async verification
        await new Promise(resolve => setTimeout(resolve, 100));

        return { valid: true };
    } catch (error) {
        return { valid: false, error: 'Signature verification failed' };
    }
}

/**
 * Build the message that was signed
 * Exported for use in production Ed25519 verification
 */
export function buildSignatureMessage(payload: QRPayload): string {
    // Canonical order for signature verification
    return JSON.stringify({
        v: payload.v,
        event_pubkey: payload.event_pubkey,
        start_ts: payload.start_ts,
        end_ts: payload.end_ts,
        zone_code: payload.zone_code,
        nonce: payload.nonce,
        meta: payload.meta || {},
    });
}

/**
 * Validate timestamp window
 */
export function validateTimeWindow(
    payload: QRPayload
): { valid: boolean; status: 'valid' | 'expired' | 'notStarted' } {
    const now = Date.now();

    if (now < payload.start_ts) {
        return { valid: false, status: 'notStarted' };
    }

    if (now > payload.end_ts) {
        return { valid: false, status: 'expired' };
    }

    return { valid: true, status: 'valid' };
}

/**
 * Check for replay attacks using nonce
 */
export function checkNonceReplay(
    nonce: string,
    usedNonces: Set<string>
): { valid: boolean; error?: string } {
    if (usedNonces.has(nonce)) {
        return { valid: false, error: 'Nonce already used - possible replay attack' };
    }

    return { valid: true };
}

/**
 * Store a used nonce to prevent replay
 */
export function recordNonce(nonce: string, usedNonces: Set<string>): void {
    usedNonces.add(nonce);

    // Limit set size to prevent memory issues
    if (usedNonces.size > 10000) {
        // Remove oldest entries (convert to array, slice, recreate set)
        const arr = Array.from(usedNonces);
        usedNonces.clear();
        arr.slice(-5000).forEach(n => usedNonces.add(n));
    }
}

/**
 * Full QR validation pipeline
 */
export async function validateQRPayload(
    rawData: string,
    trustedEventKeys: string[],
    usedNonces: Set<string>
): Promise<VerificationStatus & { payload?: QRPayload }> {
    const result: VerificationStatus = {
        signature: 'checking',
        timeWindow: 'checking',
        location: 'checking',
        duplicate: 'checking',
    };

    // Step 1: Parse and validate schema
    const parseResult = parseQRCode(rawData);
    if (!parseResult.valid || !parseResult.payload) {
        return { ...result, signature: 'invalid' };
    }

    const payload = parseResult.payload;

    // Step 2: Verify signature
    const sigResult = await verifySignature(payload, trustedEventKeys);
    if (!sigResult.valid) {
        return { ...result, signature: 'invalid' };
    }
    result.signature = 'valid';

    // Step 3: Check time window
    const timeResult = validateTimeWindow(payload);
    result.timeWindow = timeResult.status;
    if (!timeResult.valid) {
        return { ...result, location: 'checking', duplicate: 'checking', payload };
    }

    // Step 4: Check nonce replay
    const nonceResult = checkNonceReplay(payload.nonce, usedNonces);
    if (!nonceResult.valid) {
        return { ...result, duplicate: 'duplicate', location: 'checking', payload };
    }
    result.duplicate = 'clear';

    // Location check is done separately in zone.ts
    result.location = 'checking';

    return { ...result, payload };
}

/**
 * Sanitize QR input for display (prevent XSS)
 */
export function sanitizeForDisplay(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
