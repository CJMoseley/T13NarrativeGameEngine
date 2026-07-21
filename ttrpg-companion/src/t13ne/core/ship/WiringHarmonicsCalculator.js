import WiringConfigs from './wiring_configs.js';

/**
 * Calculates "harmonics" based on the ship's internal wiring network.
 * The concept is that the total length and configuration of wiring,
 * and the components it connects, influence a ship's performance characteristics.
 */
class WiringHarmonicsCalculator {
    constructor() {
        console.log("WiringHarmonicsCalculator initialized.");
    }

    /**
     * Calculates the harmonics of a ship based on its wiring graph and components.
     * @param {object} wiringGraph - An adjacency list representing the wiring connections between components.
     *                                e.g., { "compA": [{targetId: "compB", wiringType: "electrical", length: 10}], ... }
     *                                Note: The wiringGraph structure has changed to include wiringType and length.
     * @param {Map<string, object>} components - A map of component IDs to their respective objects,
     *                                           each containing its config.
     * @returns {object} An object containing various calculated harmonic values and audio cues.
     */
    calculate(wiringGraph, components) {
        let totalEffectiveLength = 0; // Weighted by wiring type properties
        let numConnections = 0;
        const componentTypes = new Set();
        const wiringTypesUsed = new Set();

        // Detailed harmonic contributions from each wiring type
        const harmonicContributions = {};
        for (const type in WiringConfigs) {
            harmonicContributions[type] = {
                resistance: 0,
                capacitance: 0,
                inductance: 0,
                totalLength: 0,
                weightedLength: 0
            };
        }

        const visitedEdges = new Set(); // To prevent double-counting bidirectional edges

        // --- NEW: Component Resonance Calculation ---
        let totalComponentResonance = 0;
        let totalComponentDamping = 0;
        let componentCount = 0;

        components.forEach((comp) => {
            if (comp.harmonics) {
                totalComponentResonance += comp.harmonics.resonanceFrequency || 0;
                totalComponentDamping += comp.harmonics.damping || 0;
                componentCount++;
            }
        });
        
        const avgComponentResonance = componentCount > 0 ? totalComponentResonance / componentCount : 0;
        const avgComponentDamping = componentCount > 0 ? totalComponentDamping / componentCount : 0;
        // --- END NEW ---

        for (const [sourceId, connections] of Object.entries(wiringGraph)) {
            const sourceComp = components.get(sourceId);
            if (sourceComp && sourceComp.config && sourceComp.config.component_type) {
                componentTypes.add(sourceComp.config.component_type);
            }

            connections.forEach(conn => {
                const { targetId, wiringType, length } = conn;

                const targetComp = components.get(targetId);
                if (targetComp && targetComp.config && targetComp.config.component_type) {
                    componentTypes.add(targetComp.config.component_type);
                }

                if (!WiringConfigs[wiringType]) {
                    console.warn(`Unknown wiring type: ${wiringType}. Skipping harmonic calculation for this connection.`);
                    return;
                }
                wiringTypesUsed.add(wiringType);

                const edgeKey1 = `${sourceId}-${targetId}-${wiringType}`;
                const edgeKey2 = `${targetId}-${sourceId}-${wiringType}`;

                if (!visitedEdges.has(edgeKey1) && !visitedEdges.has(edgeKey2)) {
                    numConnections++;
                    const config = WiringConfigs[wiringType];

                    harmonicContributions[wiringType].resistance += config.baseResistancePerUnitLength * length;
                    harmonicContributions[wiringType].capacitance += config.baseCapacitancePerUnitLength * length;
                    harmonicContributions[wiringType].inductance += config.baseInductancePerUnitLength * length;
                    harmonicContributions[wiringType].totalLength += length;
                    harmonicContributions[wiringType].weightedLength += length * config.harmonicMultiplier;

                    totalEffectiveLength += length * config.harmonicMultiplier;
                    visitedEdges.add(edgeKey1);
                }
            });
        }

        // Aggregate and calculate overall ship properties
        let totalResistance = 0;
        let totalCapacitance = 0;
        let totalInductance = 0;
        for (const type in harmonicContributions) {
            totalResistance += harmonicContributions[type].resistance;
            totalCapacitance += harmonicContributions[type].capacitance;
            totalInductance += harmonicContributions[type].inductance;
        }

        // Placeholder for more complex harmonic calculations
        // Scientific accuracy is a good place to start, but simplified for ease of implementation.
        // These values would ideally influence game mechanics (e.g., power efficiency, shield recharge rate, weapon cooldowns)
        const overallHarmonicComplexity = totalEffectiveLength * 0.1 + numConnections * 0.5;
        const powerEfficiency = 1.0 - (totalResistance * 0.05); // Higher resistance = lower efficiency
        const signalClarity = 1.0 - ((totalCapacitance * totalInductance) * 1e9); // LC product influences signal integrity
        
        // --- UPDATED: Resonance Frequency Calculation ---
        // Combine wiring resonance (LC) with component resonance
        const wiringResonance = 1 / (2 * Math.PI * Math.sqrt(totalInductance * totalCapacitance));
        const resonanceFrequency = (wiringResonance + avgComponentResonance) / 2; 
        // --- END UPDATED ---

        // Apply frequency response characteristics based on dominant wiring type or average
        let dominantFreqResponseFactor = 1.0;
        if (wiringTypesUsed.size > 0) {
            // Simple average for now, could be more sophisticated
            let sumLow = 0, sumMid = 0, sumHigh = 0;
            wiringTypesUsed.forEach(type => {
                sumLow += WiringConfigs[type].frequencyResponse.low;
                sumMid += WiringConfigs[type].frequencyResponse.mid;
                sumHigh += WiringConfigs[type].frequencyResponse.high;
            });
            dominantFreqResponseFactor = (sumLow + sumMid + sumHigh) / (wiringTypesUsed.size * 3);
        }

        const harmonicsResult = {
            totalWiringLength: totalEffectiveLength,
            numConnections: numConnections,
            overallHarmonicComplexity: overallHarmonicComplexity,
            powerEfficiency: Math.max(0.1, powerEfficiency), // Ensure efficiency doesn't drop below a threshold
            signalClarity: Math.max(0.1, signalClarity),    // Ensure clarity doesn't drop below a threshold
            resonanceFrequency: isNaN(resonanceFrequency) || !isFinite(resonanceFrequency) ? 0 : resonanceFrequency,
            componentTypes: Array.from(componentTypes),
            wiringTypesUsed: Array.from(wiringTypesUsed),
            detailedContributions: harmonicContributions, // For debugging or very fine-grained effects
            dominantFreqResponseFactor: dominantFreqResponseFactor,
            avgComponentDamping: avgComponentDamping, // New property

            // Dummy hooks for audio integration
            audioCues: {
                // Examples of potential audio cues based on harmonic values
                oscillationFrequency: resonanceFrequency * 100, // Scale frequency for audio
                distortionAmount: 1 - signalClarity,
                humVolume: powerEfficiency < 0.5 ? 0.8 : 0.2, // Louder hum if inefficient
                pulseRate: overallHarmonicComplexity / 5, // Faster pulse for complex wiring
                environmentalFeedbackSeverity: 0 // Placeholder for external impact
            },
            // Hook for external events to modify audio feedback
            updateEnvironmentalFeedback: function(severity) {
                this.audioCues.environmentalFeedbackSeverity = severity;
                console.log(`Audio hook: Environmental feedback severity updated to ${severity}`);
                // In a real implementation, this would trigger sound engine adjustments
            }
        };

        console.log("Calculated harmonics:", harmonicsResult);
        return harmonicsResult;
    }
}

export default WiringHarmonicsCalculator;
