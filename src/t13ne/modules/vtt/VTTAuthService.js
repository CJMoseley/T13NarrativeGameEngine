/**
 * @module Modules/VTT/VTTAuthService
 * @description Browser & Node Web Crypto authentication helpers for T13 VTT sessions:
 * - Ephemeral ECDSA P-256 (ES256) keypair generation and JWT signing/verification
 * - Salted PBKDF2-SHA256 passphrase verifier and single-use HMAC-SHA256 challenge-response
 */

function getCrypto() {
    const c = globalThis.crypto;
    if (!c || !c.subtle) {
        throw new Error('Web Crypto API (crypto.subtle) is required for VTTAuthService.');
    }
    return c;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function bytesToBase64Url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
        bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(str) {
    const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
}

function bytesToHex(bytes) {
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
    if (typeof hex !== 'string' || hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) {
        return null;
    }
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
}

function constantTimeEqualBytes(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a[i] ^ b[i];
    }
    return diff === 0;
}

function randomHex(byteCount = 16) {
    const c = getCrypto();
    const buf = new Uint8Array(byteCount);
    c.getRandomValues(buf);
    return bytesToHex(buf);
}

/**
 * Generates an ephemeral ECDSA P-256 signing keypair for a session authority.
 * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey, publicJwk: object, kid: string}>}
 */
export async function generateSessionKeyPair() {
    const { subtle } = getCrypto();
    const pair = await subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify']
    );
    const kid = `t13-ec-${randomHex(8)}`;
    const exported = await subtle.exportKey('jwk', pair.publicKey);
    const publicJwk = {
        ...exported,
        kid,
        alg: 'ES256',
        use: 'sig'
    };
    return {
        publicKey: pair.publicKey,
        privateKey: pair.privateKey,
        publicJwk,
        kid
    };
}

/**
 * Signs an ES256 compact JWT for a T13 session participant.
 */
export async function signSessionJWT(claims, privateKey, { kid = 't13-session-key', expiresInSec = 3600 } = {}) {
    const { subtle } = getCrypto();
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'ES256', typ: 'JWT', kid };
    const body = {
        ...claims,
        iat: claims.iat ?? now,
        exp: claims.exp ?? (now + expiresInSec),
        jti: claims.jti ?? randomHex(12)
    };
    const hB64 = bytesToBase64Url(enc.encode(JSON.stringify(header)));
    const pB64 = bytesToBase64Url(enc.encode(JSON.stringify(body)));
    const signingInput = `${hB64}.${pB64}`;
    const sigBuf = await subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        privateKey,
        enc.encode(signingInput)
    );
    const sB64 = bytesToBase64Url(new Uint8Array(sigBuf));
    return `${signingInput}.${sB64}`;
}

/**
 * Verifies an ES256 JWT against a CryptoKey or public JWK.
 * @returns {Promise<{valid: boolean, claims: object|null, reason?: string}>}
 */
export async function verifySessionJWT(token, publicKeyOrJwk, { expectedSessionId = null, nowSec = null } = {}) {
    try {
        if (typeof token !== 'string') {
            return { valid: false, claims: null, reason: 'Token must be a string.' };
        }
        const parts = token.split('.');
        if (parts.length !== 3) {
            return { valid: false, claims: null, reason: 'Malformed JWT structure.' };
        }
        const [hB64, pB64, sB64] = parts;
        const header = JSON.parse(dec.decode(base64UrlToBytes(hB64)));
        if (header.alg !== 'ES256') {
            return { valid: false, claims: null, reason: `Unsupported JWT alg '${header.alg}'.` };
        }
        const claims = JSON.parse(dec.decode(base64UrlToBytes(pB64)));
        const sigBytes = base64UrlToBytes(sB64);

        const { subtle } = getCrypto();
        const key = (typeof CryptoKey !== 'undefined' && publicKeyOrJwk instanceof CryptoKey)
            ? publicKeyOrJwk
            : await subtle.importKey(
                'jwk',
                publicKeyOrJwk,
                { name: 'ECDSA', namedCurve: 'P-256' },
                false,
                ['verify']
            );

        const ok = await subtle.verify(
            { name: 'ECDSA', hash: 'SHA-256' },
            key,
            sigBytes,
            enc.encode(`${hB64}.${pB64}`)
        );
        if (!ok) {
            return { valid: false, claims: null, reason: 'Invalid ES256 signature.' };
        }

        const now = nowSec ?? Math.floor(Date.now() / 1000);
        if (typeof claims.exp === 'number' && now >= claims.exp) {
            return { valid: false, claims: null, reason: 'JWT has expired.' };
        }
        if (expectedSessionId && claims.sid !== expectedSessionId) {
            return { valid: false, claims: null, reason: 'JWT session mismatch.' };
        }
        return { valid: true, claims };
    } catch (err) {
        return { valid: false, claims: null, reason: err?.message || 'JWT verification failed.' };
    }
}

async function derivePBKDF2Hex(passphrase, salt, iterations = 100000) {
    const { subtle } = getCrypto();
    const baseKey = await subtle.importKey(
        'raw',
        enc.encode(String(passphrase)),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const bits = await subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: enc.encode(String(salt)),
            iterations,
            hash: 'SHA-256'
        },
        baseKey,
        256
    );
    return bytesToHex(new Uint8Array(bits));
}

async function hmacSha256Hex(keyString, message) {
    const { subtle } = getCrypto();
    const key = await subtle.importKey(
        'raw',
        enc.encode(String(keyString)),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await subtle.sign('HMAC', key, enc.encode(String(message)));
    return bytesToHex(new Uint8Array(sig));
}

/**
 * Derives a salted PBKDF2-SHA256 verifier from a Referee-chosen passphrase.
 */
export async function createPassphraseVerifier(passphrase, { iterations = 100000, salt = null } = {}) {
    if (typeof passphrase !== 'string' || !passphrase.length) {
        throw new Error('Passphrase must be a non-empty string.');
    }
    const resolvedSalt = salt ?? randomHex(16);
    const hash = await derivePBKDF2Hex(passphrase, resolvedSalt, iterations);
    return { salt: resolvedSalt, iterations, hash };
}

/**
 * Creates a single-use challenge nonce.
 */
export function createAuthChallenge({ ttlMs = 60000 } = {}) {
    const now = Date.now();
    return {
        challengeId: randomHex(12),
        nonce: randomHex(16),
        createdAt: now,
        expiresAt: now + ttlMs
    };
}

/**
 * Computes the client proof HMAC-SHA256(PBKDF2(passphrase, salt), nonce) without sending the passphrase.
 */
export async function solveAuthChallenge(passphrase, { nonce, salt, iterations = 100000 }) {
    const derivedHex = await derivePBKDF2Hex(passphrase, salt, iterations);
    return hmacSha256Hex(derivedHex, nonce);
}

/**
 * Verifies a client challenge proof against a stored PBKDF2 verifier.
 */
export async function verifyAuthChallengeResponse(responseHex, { nonce, verifier }) {
    if (!verifier?.hash || !nonce || typeof responseHex !== 'string') return false;
    const expectedHex = await hmacSha256Hex(verifier.hash, nonce);
    const a = hexToBytes(expectedHex);
    const b = hexToBytes(responseHex);
    return constantTimeEqualBytes(a, b);
}
