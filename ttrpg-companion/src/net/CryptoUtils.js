/**
 * CryptoUtils.js
 * Cryptographic utility functions for room isolation, challenge-response verification,
 * and SDP package encryption using Web Crypto APIs.
 */

/**
 * Computes a SHA-256 hash of "roomName:password" to identify the room uniquely.
 * @param {string} roomName 
 * @param {string} password 
 * @returns {Promise<string>} Hex representation of the hash.
 */
export async function hashRoom(roomName, password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${roomName}:${password}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Encrypts an SDP string symmetrically using AES-GCM (key derived via PBKDF2).
 * @param {string} sdpText 
 * @param {string} password 
 * @returns {Promise<string>} Base64-encoded payload containing salt, iv, and ciphertext.
 */
export async function encryptSDP(sdpText, password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const baseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoder.encode(sdpText)
    );

    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

    // Convert to binary string before btoa to support browser standards
    let binary = '';
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
}

/**
 * Decrypts an SDP payload using AES-GCM.
 * @param {string} encryptedBase64 
 * @param {string} password 
 * @returns {Promise<string>} The decrypted original SDP string.
 */
export async function decryptSDP(encryptedBase64, password) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const binaryString = atob(encryptedBase64);
    const len = binaryString.length;
    const combined = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        combined[i] = binaryString.charCodeAt(i);
    }

    if (combined.length < 28) {
        throw new Error("Invalid connection key.");
    }

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const baseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
    );

    return decoder.decode(decrypted);
}

/**
 * Generates a unique 32-character random hex string for challenge-response authentication.
 * @returns {string}
 */
export function generateChallenge() {
    const arr = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes the response to an authentication challenge.
 * @param {string} challenge 
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function solveChallenge(challenge, password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${challenge}:${password}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Verifies the response to an authentication challenge.
 * @param {string} challenge 
 * @param {string} response 
 * @param {string} password 
 * @returns {Promise<boolean>}
 */
export async function verifyChallenge(challenge, response, password) {
    const expected = await solveChallenge(challenge, password);
    return expected === response;
}
