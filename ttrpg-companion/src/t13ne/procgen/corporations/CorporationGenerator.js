import { GalacticHistory } from '../galaxy/GalacticHistory.js';

export class CorporationGenerator {
    constructor() {}

    determineCorporatePresence(star, n4) {
        let corporatePresence = null;
        const activeCorporations = (GalacticHistory.getCorporations() || []).filter(c => c.status === 'Active');

        if (activeCorporations.length > 0) {
            const systemPos = { r: star.r, theta: star.angle };
            let corporatePressures = activeCorporations.map(corp => {
                const homePos = corp.homeRegion;
                const deltaTheta = Math.abs(systemPos.theta - homePos.theta);
                const angularDist = Math.min(deltaTheta, 2 * Math.PI - deltaTheta);
                const radialDist = Math.abs(systemPos.r - homePos.r);
                const distance = Math.sqrt(Math.pow(radialDist, 2) + Math.pow(angularDist / (2 * Math.PI), 2));

                let pressure = 1 / (distance + 0.1);

                if (corp.archetype === 'ShippingHauler' || corp.archetype === 'Megacorp') {
                    pressure *= 1.5;
                } else if (corp.archetype === 'TechInnovator') {
                    pressure *= 0.7;
                }

                return { corp, pressure };
            });

            corporatePressures.sort((a, b) => b.pressure - a.pressure);

            const totalPressure = corporatePressures.reduce((sum, p) => sum + p.pressure, 0);
            const influenceThreshold = 5.0;

            if (totalPressure > influenceThreshold && (corporatePressures[0].pressure / totalPressure) > n4) {
                corporatePresence = corporatePressures[0].corp;
            }
        }
        return corporatePresence;
    }
}
