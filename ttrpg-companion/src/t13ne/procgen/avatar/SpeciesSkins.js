import * as THREE from 'three';
import { hashSeed, mulberry32 } from './avatarRandom.js';

const HUMAN_TONES = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0x5c3a1e, 0xffdbac];

/**
 * Resolve a species' authored skin, or a deterministic default when none is authored.
 * Authored entries are { id, skinTone, hairColor?, clothing?, clothingCoverage? }.
 * skinTone and hairColor are 24-bit RGB integers. The first entry is the default.
 */
export function speciesSkin(species, skinId) {
    if (!species || typeof species !== 'object' || Array.isArray(species)) {
        throw new TypeError('Species skin requires a species object.');
    }
    if (species.avatarSkins != null) {
        if (!Array.isArray(species.avatarSkins) || species.avatarSkins.length === 0) {
            throw new TypeError('species.avatarSkins must be a non-empty array.');
        }
        const ids = new Set();
        for (const skin of species.avatarSkins) {
            if (!skin || typeof skin.id !== 'string' || !skin.id || ids.has(skin.id) ||
                !Number.isInteger(skin.skinTone) || skin.skinTone < 0 || skin.skinTone > 0xffffff ||
                (skin.hairColor != null && (!Number.isInteger(skin.hairColor) || skin.hairColor < 0 || skin.hairColor > 0xffffff))) {
                throw new TypeError('Each species skin needs a unique id and valid RGB colours.');
            }
            ids.add(skin.id);
        }
        const selected = skinId == null ? species.avatarSkins[0] : species.avatarSkins.find(skin => skin.id === skinId);
        if (!selected) throw new RangeError(`Unknown species skin "${skinId}".`);
        const { id, skinTone, hairColor, clothing, clothingCoverage } = selected;
        return {
            id, skinTone,
            ...(hairColor != null ? { hairColor } : {}),
            ...(clothing != null ? { clothing } : {}),
            ...(clothingCoverage != null ? { clothingCoverage } : {})
        };
    }
    if (skinId != null && skinId !== 'default') throw new RangeError(`Unknown species skin "${skinId}".`);
    if (species.color != null) {
        const colour = species.color;
        const validNumber = Number.isInteger(colour) && colour >= 0 && colour <= 0xffffff;
        const validString = typeof colour === 'string' && (
            /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(colour) ||
            Object.hasOwn(THREE.Color.NAMES, colour.toLowerCase()) ||
            /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*\d*\.?\d+\s*)?\)$/.test(colour) ||
            /^rgba?\(\s*\d+%\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*\d*\.?\d+\s*)?\)$/.test(colour) ||
            /^hsla?\(\s*\d*\.?\d+\s*,\s*\d*\.?\d+%\s*,\s*\d*\.?\d+%\s*(?:,\s*\d*\.?\d+\s*)?\)$/.test(colour)
        );
        if (!validNumber && !validString) throw new TypeError('Species color must be a valid RGB colour.');
        return { id: 'default', skinTone: new THREE.Color(colour).getHex() };
    }
    const identity = species.id ?? species.scientificName ?? species.commonName ?? species.name;
    if (typeof identity !== 'string' || !identity.trim()) {
        throw new TypeError('Species needs an id or name to generate its default skin.');
    }
    const rand = mulberry32(hashSeed(`species-skin:${identity.trim().toLowerCase()}`));
    const skinTone = identity.trim().toLowerCase() === 'human'
        ? HUMAN_TONES[Math.floor(rand() * HUMAN_TONES.length)]
        : new THREE.Color().setHSL(rand(), 0.6, 0.5).getHex();
    return { id: 'default', skinTone };
}
