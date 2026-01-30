/**
 * Wormhole Racers Colour Utility
 * Contains functions for converting between color formats and generating specific color types.
 * Source: [Documentation Sections: Colour Spectrum Mapping, Frequency-to-Colour]
 * Purpose: Provides a function to convert a given frequency (Hz) into a Hex Colour 
 * based on a Gaussian/Bell-shaped curve mapping to the visible spectrum.
 * Requirement: Components and environment must be coloured based on their dominant frequency.
 */
export const ColourUtils = {
    // Continuous, Non-Linear Frequency-to-Color Converter
    // Based on design doc specifications [cite: 360-413]
    curvedFrequencyToHex: (f_sound) => {
        // 1. Constants and Shift Calculation
        const C = 299792458; // Speed of Light in m/s
        const f_ref_sound = 440; // Hz (Reference A4)
        const f_ref_light_THz = 385; // THz (Reference A)
        const shift_factor = (f_ref_light_THz * 1e12) / f_ref_sound;

        const f_light_Hz = f_sound * shift_factor;
        // Wavelength (lambda) in nanometers (nm)
        const lambda = (C / f_light_Hz) * 1e9;

        // 2. Custom Boundary Conditions
        if (lambda > 780) {
            return "#000000"; // Black (Near-IR)
        } else if (lambda < 380) {
            return "#FFFFFF"; // White (Near-UV)
        }

        // 3. Non-Linear Sigmoid-Based RGB Calculation
        const lambda_min = 380;
        const lambda_max = 780;
        const normalized_lambda = (lambda - lambda_min) / (lambda_max - lambda_min);

        const R_center = 0.82;
        const G_center = 0.50;
        const B_center = 0.18;
        const width = 0.15; 

        const colour_curve = (center) => {
            const exponent = -0.5 * Math.pow((normalized_lambda - center) / width, 2);
            return Math.exp(exponent);
        };

        let R_raw = colour_curve(R_center);
        let G_raw = colour_curve(G_center);
        let B_raw = colour_curve(B_center);

        const scale = 255 / Math.max(R_raw, G_raw, B_raw);

        const r = Math.round(Math.min(255, R_raw * scale));
        const g = Math.round(Math.min(255, G_raw * scale));
        const b = Math.round(Math.min(255, B_raw * scale));

        const componentToHex = (c) => {
            const hex = c.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };

        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    },

    /**
     * Converts an {r, g, b} color object (where values are 0-1) to a hexadecimal number.
     * @param {object} color - The color object {r, g, b}.
     * @returns {number} The hexadecimal color value (e.g., 0xffffff).
     */
    colorObjectToHex(color) {
        const r = Math.min(255, Math.floor(color.r * 255));
        const g = Math.min(255, Math.floor(color.g * 255));
        const b = Math.min(255, Math.floor(color.b * 255));
        return (r << 16) | (g << 8) | b;
    },

    /**
     * Determines the color and spectral class of a star based on its age and position.
     * @param {boolean} isYoung - Whether the star is young.
     * @param {number} rNorm - The normalized radial distance from the galactic center (0-1).
     * @param {number} brightnessMultiplier - A multiplier for the star's brightness.
     * @param {function} randomSource - A PRNG function that returns a value between 0 and 1.
     * @returns {{color: {r: number, g: number, b: number}, starClass: string}}
     */
    getStarColorAndClassFromParams(isYoung, rNorm, brightnessMultiplier = 1.0, randomSource) {
        let color;
        const rand = randomSource();
        let starClass = "";

        // Young stars are typically found in star-forming regions (spiral arms) and are hotter/bluer.
        if (isYoung) {
            // O-type stars are extremely rare and hot.
            if (rand < 0.05) { 
                color = { r: 0.7, g: 0.8, b: 1.0 }; starClass = "O-Type Blue Supergiant";
                brightnessMultiplier *= 2.5;
            // B-type are also rare and very bright.
            } else if (rand < 0.2) { 
                color = { r: 0.8, g: 0.9, b: 1.0 }; starClass = "B-Type Blue Giant";
                brightnessMultiplier *= 2.0;
            // A-type are bright white.
            } else if (rand < 0.5) { 
                color = { r: 0.95, g: 0.98, b: 1.0 }; starClass = "A-Type White";
                brightnessMultiplier *= 1.5;
            // F-type are yellowish-white.
            } else {
                color = { r: 1.0, g: 1.0, b: 0.9 }; starClass = "F-Type Yellow-White";
                brightnessMultiplier *= 1.2;
            }
            starClass += " (Young)";
        } else {
            // Older, stable, or end-of-life stars.
            // Remnants like Neutron Stars or Black Holes are very rare and concentrated in the dense core.
            if (rNorm < 0.05 && rand < 0.02) {
                color = { r: 0.1, g: 0.1, b: 0.2 }; starClass = "Stellar Remnant (Neutron/BH)";
                brightnessMultiplier *= 0.1;
            // Red Giants are common in the bulge and older populations.
            } else if (rand < 0.1) {
                color = { r: 1.0, g: 0.6, b: 0.4 }; starClass = "K/M-Type Red Giant";
                brightnessMultiplier *= 1.8;
            // M-type Red Dwarfs are the most common type of star, but are very dim.
            } else if (rand < 0.55) {
                color = { r: 1.0, g: 0.7, b: 0.5 }; starClass = "M-Type Red Dwarf";
                brightnessMultiplier *= 0.6;
            // G/K types (like our Sun) are very common.
            } else if (rand < 0.9) {
                color = { r: 1.0, g: 0.9, b: 0.7 }; starClass = "G/K-Type Main Sequence";
            // White Dwarfs are small, dense, and relatively dim remnants.
            } else {
                color = { r: 0.9, g: 1.0, b: 1.0 }; starClass = "D-Type White Dwarf";
                brightnessMultiplier *= 0.8;
            }
            starClass += " (Stable/Evolved)";
        }

        color.r *= brightnessMultiplier;
        color.g *= brightnessMultiplier;
        color.b *= brightnessMultiplier;

        // Convert to Hex Number for consistency across engine
        const hexColor = this.colorObjectToHex(color);
        return { color: hexColor, starClass };
    }
};