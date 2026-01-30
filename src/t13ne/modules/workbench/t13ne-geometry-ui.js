import T13NE from '@/src/t13ne/T13NE.js';

/**
 * T13NE Geometry UI Module
 * Handles the display of Geometry data (Gematria) for entities.
 */
class GeometryUI {
    /**
     * Renders the full Geometry block for a given name input.
     * @param {string|Array} nameInput - The name(s) to calculate geometry for.
     * @returns {string} HTML string of the geometry display.
     */
    render(nameInput) {
        const T13Geometry = T13NE.getModule('T13Geometry');
        if (!T13Geometry || !nameInput) return '';

        // Calculate full geometry
        const geoData = T13Geometry.calculateFullGeo(nameInput);
        if (!geoData || !geoData.Geo) return '';

        const geo = geoData.Geo;
        const num = geoData.GeometryNumber;
        const className = `t13ne-geo-${num}`;

        const renderContentBox = (cls, title, content) => {
            if (!content || content === 'Not Applicable') return '';
            return `
                <div class="${cls}" style="margin-bottom: 0.25rem;">
                    <strong>${title}:</strong> <span style="color: var(--text-dim);">${content}</span>
                </div>
            `;
        };

        const renderSubGeo = (type, num) => {
            if (!num) return '';
            const subGeo = T13Geometry.Geometries[num];
            if (!subGeo) return '';
            return `
                <details class="t13ne-${type.toLowerCase()} t13ne-geo-${num}" style="margin-top: 0.5rem;">
                    <summary style="cursor: pointer; font-weight: bold; color: var(--accent-blue);">${type} Number: ${num} (${subGeo.Name})</summary>
                    <div class="t13ne-subgeo-content" style="padding-left: 0.5rem; border-left: 1px solid var(--glass-border); margin-top: 0.25rem;">
                        <p class="t13ne-description" style="margin-bottom: 0.25rem;">${subGeo.Geometry_Description}</p>
                        ${renderContentBox(`t13ne-stress`, 'Stress', subGeo.Stress_Description)}
                        ${type === 'Soul' ? renderContentBox(`t13ne-gift`, 'Soul Gift', subGeo.Gift_Description) : ''}
                        ${type === 'Facade' ? renderContentBox(`t13ne-gain`, 'Facade Effect', subGeo.Chi) : ''}
                    </div>
                </details>
            `;
        };

        const harmonics = geoData.GeoHarmonics;
        let harmonicsDisplay = '';
        if (harmonics) {
            const keyData = T13Geometry.getKey(harmonics.key);
            const k = keyData?.Key || {};
            harmonicsDisplay = `
                <details class="t13ne-harmony" style="margin-top: 0.5rem;">
                    <summary style="cursor: pointer; font-weight: bold; color: var(--accent-blue);">Harmonics & Key</summary>
                    <div style="padding-left: 0.5rem; border-left: 1px solid var(--glass-border); margin-top: 0.25rem;">
                        <div class="t13ne-tooltip t13ne-key" style="margin-bottom: 0.5rem;">
                            <strong>Key: </strong> <span>${k.Key || 'Unknown'}</span>
                            ${k.Description ? `<div style="margin-top: 0.25rem; font-size: 0.75rem; color: var(--text-dim);">${k.Description}</div>` : ''}
                        </div>
                        <div class="t13ne-tooltip t13ne-scale">
                            <strong>Scale / Mode: </strong> <span>${T13Geometry.tonalModes[harmonics.ModalTone]?.Type || 'Unknown'}</span>
                        </div>
                        <div class="t13ne-tooltip t13ne-harmonics">
                            <strong>Harmonic Numbers: </strong> <span>${(harmonics.Harmonic || []).join(", ")}</span>
                        </div>
                        <div class="t13ne-tooltip t13ne-harmonics">
                            <strong>"Perfect" Harmonic: </strong> <span>${harmonics.Perfect}</span>
                        </div>
                        <div class="t13ne-tooltip t13ne-harmonics">
                            <strong>"Wolf" Harmonic: </strong> <span>${harmonics.Wolf}</span>
                        </div>
                        <div class="t13ne-dissonant" style="margin-top: 0.5rem;">
                            <div class="t13ne-tooltip t13ne-dissonants">
                                <strong>Dissonant Numbers: </strong> <span>${(harmonics.Dissonant || []).join(", ")}</span>
                            </div>
                            <div class="t13ne-tooltip t13ne-dissonants">
                                <strong>"Sustained" Dissonant: </strong> <span>${harmonics.Sustained}</span>
                            </div>
                            <div class="t13ne-tooltip t13ne-dissonants">
                                <strong>"Nemesis" Dissonant: </strong> <span>${harmonics.Nemesis}</span>
                            </div>
                        </div>
                    </div>
                </details>
            `;
        }

        return `
            <div class="t13ne-geometry-block" style="font-size: 0.8rem;">
                <details class="t13ne-details t13ne-geometry ${className}">
                    <summary class="t13ne-summary" style="cursor: pointer; margin-bottom: 0.25rem;">
                        <strong>Geometry:</strong> <span class="t13ne-geonum">${num}</span> <span class="t13ne-geoname">${geo.Name}</span>
                    </summary>
                    
                    <div style="padding-left: 0.5rem; border-left: 2px solid var(--glass-border);">
                        <details style="margin-bottom: 0.5rem;">
                            <summary style="cursor: pointer; font-weight: bold; color: var(--accent-blue);">Description</summary>
                            <div style="padding-left: 0.5rem; border-left: 1px solid var(--glass-border); margin-top: 0.25rem;">
                                <p class="t13ne-description" style="margin-bottom: 0.5rem;">${geo.Geometry_Description}</p>
                                ${renderContentBox(`t13ne-goal ${className}`, 'Goal', geo.Goal_Description)}
                                ${renderContentBox(`t13ne-gain ${className}`, 'Gain Chi', geo.Chi)}
                                ${renderContentBox(`t13ne-yang ${className}`, 'Gain Yang', geo.Yang)}
                                ${renderContentBox(`t13ne-yin ${className}`, 'Gain Yin', geo.Yin)}
                                ${renderContentBox(`t13ne-stress ${className}`, 'Stress', geo.Stress_Description)}
                                ${renderContentBox(`t13ne-gift ${className}`, 'Gift', geo.Gift_Description)}
                            </div>
                        </details>
                        
                        ${renderSubGeo('Nascent', geoData.Nascent)}
                        ${renderSubGeo('Soul', geoData.Soul)}
                        ${renderSubGeo('Facade', geoData.Facade)}
                        
                        ${harmonicsDisplay}
                    </div>
                </details>
            </div>
        `;
    }
}

export default new GeometryUI();





