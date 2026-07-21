﻿import Logger from "/src/t13ne/core/Logger.js";
import T13NE from '/src/t13ne/T13NE.js';

/**
 * T13NE NPC Handler
 * Prepares character data for AI consumption, breaking it down into
 * descriptors, capabilities, and motivation triggers (Gains).
 */
export class NPCController {
    constructor(character) {
        this.character = character;
    }

    /**
     * Generates a system-agnostic profile for AI agents.
     * @returns {Promise<object>}
     */
    async getAIProfile() {
        const funcName = 'NPCController.getAIProfile';
        Logger.start(funcName, { name: this.character?.name });
        if (!this.character) {
            Logger.warn(`${funcName}: No character attached.`);
            return null;
        }

        const profile = {
            identity: this._getIdentity(),
            descriptors: await this._getDescriptors(),
            capabilities: this._getCapabilities(),
            geometry: await this._getGeometryProfile(),
            gains: await this._getGains(), // Gain Chis, Yins, Yangs
            ichingAdvice: await this._getIChingAdvice(),
            shadows: await this._getShadows(),
            catalysts: this._getCatalysts(),
            state: this._getCurrentState()
        };

        Logger.end(funcName);
        return profile;
    }

    _getIdentity() {
        return {
            name: this.character.name,
            type: this.character.charType,
            archetype: this.character.personaDetails?.Name || 'Unknown'
        };
    }

    async _getDescriptors() {
        const descriptors = [];
        if (this.character.description) descriptors.push(this.character.description);
        const Facets = T13NE.getModule('Facets');
        
        // Persona Details (including Shadow)
        if (this.character.personaDetails) {
            if (this.character.personaDetails.Name) descriptors.push(`Archetype: ${this.character.personaDetails.Name}`);
            if (this.character.personaDetails.Motivation) descriptors.push(`Motivation: ${this.character.personaDetails.Motivation}`);
            if (this.character.personaDetails.Avoid) descriptors.push(`Avoids: ${this.character.personaDetails.Avoid}`);
        }

        // Additional Personas from Personality Annex
        if (this.character.personalityAnnex && this.character.personalityAnnex.personas && Facets) {
             for (const pName of this.character.personalityAnnex.personas) {
                 // Avoid duplicating the primary persona if listed
                 if (pName !== this.character.personaDetails?.Name) {
                     const facet = await Facets.getFacet(pName);
                     const desc = facet && facet.Persona ? ` (Motivation: ${facet.Persona.Motivation})` : '';
                     descriptors.push(`Secondary Persona: ${pName}${desc}`);
                 }
             }
        }

        // Add hitches as descriptors (Flaws/Quirks) with Triggers
        if (this.character.hitches) {
            for (const h of this.character.hitches) {
                let desc = `${h.name}: ${h.description}`;
                // Try to get trigger info from tags or facet if Facets module is available
                if (h.tags && h.tags.facets && h.tags.facets.length > 0 && Facets) {
                     const f = await Facets.getFacet(h.tags.facets[0]);
                     if (f && f.Hitch_Rules) {
                         // Determine tier based on Bane (approximate)
                         let tier = 'Quirk';
                         if (h.bane >= 10) tier = 'Flaw';
                         if (h.bane >= 20) tier = 'Woe';
                         
                         if (f.Hitch_Rules[tier]) {
                             desc += ` (Trigger: ${f.Hitch_Rules[tier]})`;
                         }
                     }
                }
                descriptors.push(desc);
            }
        }

        // Add Facet tags if available
        if (this.character.tags && this.character.tags.facets) {
            descriptors.push(`Thematic Facets: ${this.character.tags.facets.join(', ')}`);
        }

        return descriptors;
    }

    _getCapabilities() {
        const capabilities = [];

        // Master Annex (for Extras)
        if (this.character.masterAnnex) {
            capabilities.push({
                name: this.character.masterAnnex.name,
                description: this.character.masterAnnex.description,
                type: 'Primary Ability'
            });
        }

        // Sub Annexes
        if (this.character.subAnnexes) {
            this.character.subAnnexes.forEach(a => {
                capabilities.push({
                    name: a.name,
                    description: a.description,
                    type: a.annexType || 'Skill'
                });
            });
        }

        return capabilities;
    }

    async _getShadows() {
        const shadows = [];
        const Facets = T13NE.getModule('Facets');

        // Primary Persona Shadow
        if (this.character.personaDetails && this.character.personaDetails.Shadow) {
            shadows.push(`Primary Shadow (${this.character.personaDetails.Name}): ${this.character.personaDetails.Shadow}`);
        }
        
        // Additional Personas
        if (this.character.personalityAnnex && this.character.personalityAnnex.personas && Facets) {
             for (const pName of this.character.personalityAnnex.personas) {
                 if (pName === this.character.personaDetails?.Name) continue;
                 const facet = await Facets.getFacet(pName);
                 if (facet && facet.Persona && facet.Persona.Shadow) {
                     shadows.push(`${pName} Shadow: ${facet.Persona.Shadow}`);
                 }
             }
        }
        return shadows;
    }

    async _getGeometryProfile() {
        if (!this.character.geometry || !this.character.geometry.Geo) return null;
        
        const geo = this.character.geometry.Geo;
        const harmonics = this.character.geometry.GeoHarmonics || {};
        
        return {
            name: geo.Name,
            description: geo.Geometry_Description,
            gift: {
                name: geo.Gift,
                description: geo.Gift_Description
            },
            goal: {
                name: geo.Goal,
                description: geo.Goal_Description
            },
            social: {
                harmonics: harmonics.Harmonic || [],
                dissonants: harmonics.Dissonant || [],
                perfect: harmonics.Perfect, // Soul Number / Perfect Harmony
                nemesis: harmonics.Nemesis,
                wolf: harmonics.Wolf,
                sustained: harmonics.Sustained
            }
        };
    }

    async _getGains() {
        const gains = {
            chi: [],
            yin: [],
            yang: [],
            stress: [],
            storage: []
        };
        const strip = (s) => s ? s.replace(/<[^>]*>?/gm, '') : '';
        const Facets = T13NE.getModule('Facets');
        const T13Geometry = T13NE.getModule('T13Geometry');
        const Resources = T13NE.getModule('Resources');

        // 1. Geometry Gains (Primary Source)
        if (this.character.geometry && this.character.geometry.Geo) {
            const geo = this.character.geometry.Geo;
            if (geo.Chi) gains.chi.push(`Geometry (${geo.Name}): ${strip(geo.Chi)}`);
            if (geo.Yang) gains.yang.push(`Geometry (${geo.Name}): ${strip(geo.Yang)}`);
            if (geo.Yin) gains.yin.push(`Geometry (${geo.Name}): ${strip(geo.Yin)}`);
        }

        // 2. Facade Gains (Chi)
        if (this.character.geometry && T13Geometry) {
             const facadeGeo = T13Geometry.Geometries[this.character.geometry.Facade];
             if (facadeGeo && facadeGeo.Chi) {
                 gains.chi.push(`Facade (${facadeGeo.Name}): ${strip(facadeGeo.Chi)}`);
             }
        }

        // 3. Chi Gains (Persona/Core)
        if (this.character.personaDetails && this.character.personaDetails.Gain_Chi) {
            gains.chi.push(`Persona (${this.character.personaDetails.Name}): ${strip(this.character.personaDetails.Gain_Chi)}`);
        }
        
        // Additional Personas
        if (this.character.personalityAnnex && this.character.personalityAnnex.personas && Facets) {
             for (const pName of this.character.personalityAnnex.personas) {
                 if (pName === this.character.personaDetails?.Name) continue;
                 const facet = await Facets.getFacet(pName);
                 if (facet && facet.Persona && facet.Persona.Gain_Chi) {
                     gains.chi.push(`Persona (${pName}): ${strip(facet.Persona.Gain_Chi)}`);
                 }
             }
        }

        // Core Gains
        if (this.character.personalityAnnex && this.character.personalityAnnex.cores && Facets) {
             for (const cName of this.character.personalityAnnex.cores) {
                 const facet = await Facets.getFacet(cName);
                 if (facet && facet.Core_Text) {
                     gains.chi.push(`Core (${cName}): ${strip(facet.Core_Text)}`);
                 }
             }
        }

        // Hitches (Triggering gains Chi)
        if (this.character.hitches && this.character.hitches.length > 0) {
            gains.chi.push("Hitches: Gain Chi whenever a Hitch is Triggered.");
        }

        // I-Ching Gains
        if (this.character.iching && Array.isArray(this.character.iching)) {
            const IChing = T13NE.getModule('IChing');
            if (IChing) {
                const [hex1, hex2] = this.character.iching;
                const hexData = await IChing.getHexagramData(hex1 + 1);

                if (hexData) {
                    // Global Hexagram Gains
                    if (hexData.Hexagram_Character.Gains) {
                        for (const g of hexData.Hexagram_Character.Gains) {
                            const target = g.Type.toLowerCase();
                            if (gains[target]) {
                                gains[target].push(`I-Ching (${hexData.Hexagram.Name}): ${g.Condition}`);
                            }
                        }
                    }

                    // Changing Line Gains
                    if (hex1 !== hex2) {
                        const changingMask = IChing.binXor(hex1, hex2);
                        for (let i = 0; i < 6; i++) {
                            if ((changingMask >> i) & 1) {
                                const lineNum = i + 1;
                                const lineGain = hexData.Hexagram_Character.LineGains.find(lg => lg.Line === lineNum);
                                if (lineGain) {
                                    const target = lineGain.Type.toLowerCase();
                                    if (gains[target]) {
                                        gains[target].push(`I-Ching Line ${lineNum}: ${lineGain.Condition}`);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Lite Character Specifics - Storage
        if (this.character.charType === 'Lite') {
            if (this.character.hitches) {
                for (const h of this.character.hitches) {
                    gains.storage.push(`Yin Storage: ${h.name} (Capacity based on Bane)`);
                }
            }
            if (this.character.subAnnexes) {
                for (const a of this.character.subAnnexes) {
                    gains.storage.push(`Yang Storage: ${a.name} (Capacity based on Boon)`);
                }
            }
        }

        return gains;
    }

    _getCatalysts() {
        if (!this.character.catalysts) return [];
        return this.character.catalysts.map(c => ({
            type: c.type,
            factor: c.factor,
            incentive: c.carrot,
            consequence: c.stick
        }));
    }

    _getCurrentState() {
        return {
            stress: this.character.stressState || {},
            sway: this.character.swayAccount ? this.character.swayAccount.getAllBalances() : {}
        };
    }

    async _getIChingAdvice() {
        if (!this.character.iching || !Array.isArray(this.character.iching)) return null;

        const IChing = T13NE.getModule('IChing');
        if (!IChing) return null;

        const [hex1, hex2] = this.character.iching;
        const hexData = await IChing.getHexagramData(hex1 + 1);
        if (!hexData) return null;

        const advice = {
            hexagram: hexData.Hexagram.Name,
            advice: hexData.Hexagram_AI?.Roleplaying_Guidance,
            philosophy: hexData.Hexagram_Wilhelm?.Philosophy,
            judgment: hexData.Hexagram_Wilhelm?.The_Judgment?.comments,
            plotAdvice: hexData.Hexagram_AI?.Plot_Complication_Guidance,
            changingLines: []
        };

        // Handle Changing Lines
        if (hex1 !== hex2) {
            const changingMask = IChing.binXor(hex1, hex2);
            for (let i = 0; i < 6; i++) {
                if ((changingMask >> i) & 1) {
                    const lineNum = i + 1;
                    const lineAI = hexData.Hexagram_AI?.Line_Advice?.[lineNum];
                    if (lineAI) {
                        advice.changingLines.push({
                            line: lineNum,
                            advice: lineAI.Roleplaying,
                            plotAdvice: lineAI.Plot
                        });
                    }
                }
            }
        }

        return advice;
    }
}
