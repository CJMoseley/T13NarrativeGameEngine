export const ShipLayouts = {
    "ROOKIE_CHASSIS": {
        components: [
            { usage: 'fuselage', pos: [0, 0, 0] },
            { usage: 'engine', pos: [0, 0, -3] },
            { usage: 'wing', pos: [-3, 0, -1], rot: [0, 0, 0] },
            { usage: 'wing', pos: [3, 0, -1], rot: [0, Math.PI, 0] },
        ],
        interior: [
            { type: 'ellipsoid', dims: { width: 1, height: 1, length: 1.5 }, pos: [0, 0.5, 2] }, // Cockpit
            { type: 'box', dims: { width: 0.5, height: 0.5, depth: 4 }, pos: [0, 0, -1] } // Corridor
        ]
    }
};
