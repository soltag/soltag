/**
 * Zone Privacy Service
 * 
 * Handles location-based zone verification with strong privacy guarantees:
 * - Never stores or transmits exact GPS coordinates
 * - Uses geohash with limited precision (1-5km accuracy)
 * - Hashes zone codes before any storage or transmission
 */

// Geohash precision levels (characters -> approximate cell size)
// 4: ~39km x 20km
// 5: ~5km x 5km  (recommended for privacy)
// 6: ~1.2km x 0.6km
// 7: ~150m x 150m
const DEFAULT_PRECISION = 5;

// Base32 alphabet for geohash
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encode coordinates to geohash
 * Implementation follows standard geohash algorithm
 */
export function encodeGeohash(
    latitude: number,
    longitude: number,
    precision: number = DEFAULT_PRECISION
): string {
    // Validate inputs
    if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
    }
    if (precision < 1 || precision > 12) {
        throw new Error('Precision must be between 1 and 12');
    }

    let latRange = { min: -90, max: 90 };
    let lonRange = { min: -180, max: 180 };
    let hash = '';
    let bit = 0;
    let ch = 0;
    let isLon = true;

    while (hash.length < precision) {
        if (isLon) {
            const mid = (lonRange.min + lonRange.max) / 2;
            if (longitude >= mid) {
                ch = (ch << 1) | 1;
                lonRange.min = mid;
            } else {
                ch = ch << 1;
                lonRange.max = mid;
            }
        } else {
            const mid = (latRange.min + latRange.max) / 2;
            if (latitude >= mid) {
                ch = (ch << 1) | 1;
                latRange.min = mid;
            } else {
                ch = ch << 1;
                latRange.max = mid;
            }
        }

        isLon = !isLon;
        bit++;

        if (bit === 5) {
            hash += BASE32[ch];
            bit = 0;
            ch = 0;
        }
    }

    return hash;
}

/**
 * Hash a zone code for privacy
 * Uses SHA-256 to create a one-way hash
 */
export async function hashZoneCode(zoneCode: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(zoneCode);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get user's current zone code (geohash) from coordinates
 * IMPORTANT: Raw coordinates should NEVER leave this function
 */
export async function getCurrentZone(
    latitude: number,
    longitude: number,
    precision: number = DEFAULT_PRECISION
): Promise<{ zoneCode: string; zoneHash: string }> {
    // Compute geohash
    const zoneCode = encodeGeohash(latitude, longitude, precision);

    // Hash the zone code for storage/transmission
    const zoneHash = await hashZoneCode(zoneCode);

    // Log for debugging (in production, remove or redact)
    console.log(`[Zone] Computed zone: ${zoneCode} (hash: ${zoneHash.slice(0, 8)}...)`);

    return { zoneCode, zoneHash };
}

/**
 * Check if user's zone matches allowed zones
 * Supports multiple allowed zones for flexibility (venue has multiple entrances)
 */
export function checkZoneMatch(
    userZone: string,
    allowedZones: string[],
    tolerance: number = 0
): { matches: boolean; matchedZone?: string } {
    // Direct match
    for (const zone of allowedZones) {
        if (userZone === zone) {
            return { matches: true, matchedZone: zone };
        }
    }

    // Tolerance check (compare prefix for nearby zones)
    if (tolerance > 0) {
        const prefixLength = Math.max(1, userZone.length - tolerance);
        const userPrefix = userZone.slice(0, prefixLength);

        for (const zone of allowedZones) {
            const zonePrefix = zone.slice(0, prefixLength);
            if (userPrefix === zonePrefix) {
                return { matches: true, matchedZone: zone };
            }
        }
    }

    return { matches: false };
}

/**
 * Request location permission and get current position
 * Returns null if permission denied or unavailable
 */
export async function requestLocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
} | null> {
    // Check if geolocation is available
    if (!navigator.geolocation) {
        console.warn('[Zone] Geolocation not available');
        return null;
    }

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                console.warn('[Zone] Location error:', error.message);
                resolve(null);
            },
            {
                enableHighAccuracy: false, // Coarse location is sufficient and more private
                timeout: 10000,
                maximumAge: 60000, // Allow cached position up to 1 minute
            }
        );
    });
}

/**
 * Full zone verification flow
 */
export async function verifyZone(
    allowedZones: string[],
    tolerance: number = 1
): Promise<{
    status: 'valid' | 'mismatch' | 'denied' | 'unavailable';
    zoneHash?: string;
    error?: string;
}> {
    // Get current location
    const location = await requestLocation();

    if (!location) {
        return { status: 'denied', error: 'Location permission denied or unavailable' };
    }

    // Compute zone
    const { zoneCode, zoneHash } = await getCurrentZone(
        location.latitude,
        location.longitude
    );

    // Check match
    const { matches } = checkZoneMatch(zoneCode, allowedZones, tolerance);

    if (matches) {
        return { status: 'valid', zoneHash };
    }

    return {
        status: 'mismatch',
        zoneHash,
        error: 'Your current zone does not match the event location'
    };
}

/**
 * Privacy-safe location data for analytics/logging
 * Only reveals city-level precision at most
 */
export function getPrivacySafeLocation(
    latitude: number,
    longitude: number
): { region: string } {
    // Use very low precision geohash (city level)
    const region = encodeGeohash(latitude, longitude, 3);
    return { region };
}
