import * as THREE from 'three';

export const SOCKET_TYPES = {
    NECK_TOP: 'neck_top',
    NECK_BOTTOM: 'neck_bottom',
    SAUCER_VENTRAL: 'saucer_ventral', // Bottom of saucer
    FUSELAGE_FRONT: 'fuselage_forward',
    FUSELAGE_AFT: 'fuselage_aft',
    FUSELAGE_DORSAL: 'fuselage_dorsal', // Top
    FUSELAGE_VENTRAL: 'fuselage_ventral', // Bottom
    FUSELAGE_SIDE: 'fuselage_side',
    PYLON_MOUNT: 'pylon_mount',
    NACELLE_MOUNT: 'nacelle_mount',
    BRIDGE_MOUNT: 'bridge_mount',
    WEAPON_MOUNT: 'weapon_mount',
    ENGINE_MOUNT: 'engine_mount',
    RING_HUB: 'ring_hub'
};

// Helper to define a socket
const socket = (id, type, x, y, z, rx=0, ry=0, rz=0, mirror=false) => ({
    id, type, pos: [x, y, z], rot: [rx, ry, rz], mirror
});

export const SHIP_PARTS = {
    // --- SAUCERS ---
    'saucer_classic': {
        id: 'saucer_classic',
        type: 'composite', // Made of multiple primitives
        usage: 'hull_primary',
        components: [
            { type: 'cylinder', dims: { radiusTop: 9, radiusBottom: 9, height: 1.5, radialSegments: 32 }, pos: [0, 0, 0], rot: [0,0,0] },
            { type: 'cylinder', dims: { radiusTop: 4, radiusBottom: 9, height: 1.0, radialSegments: 32 }, pos: [0, 1.25, 0], rot: [0,0,0] }, // Top slope
            { type: 'cylinder', dims: { radiusTop: 9, radiusBottom: 2, height: 1.5, radialSegments: 32 }, pos: [0, -1.5, 0], rot: [0,0,0] } // Bottom slope
        ],
        sockets: [
            socket('bridge', SOCKET_TYPES.BRIDGE_MOUNT, 0, 1.75, 0),
            socket('neck', SOCKET_TYPES.SAUCER_VENTRAL, 0, -2.25, 0),
            socket('edge_port', SOCKET_TYPES.WEAPON_MOUNT, 8.5, 0, 0),
            socket('edge_starboard', SOCKET_TYPES.WEAPON_MOUNT, -8.5, 0, 0)
        ],
        tags: ['union', 'standard']
    },
    'saucer_elliptical': {
        id: 'saucer_elliptical',
        type: 'composite',
        usage: 'hull_primary',
        components: [
            // Elliptical main hull (Squashed sphere/ellipsoid logic handled by scale in synthesizer or here)
            { type: 'ellipsoid', dims: { width: 12, height: 3, length: 16 }, pos: [0, 0, 0], rot: [0,0,0] }
        ],
        sockets: [
            socket('bridge', SOCKET_TYPES.BRIDGE_MOUNT, 0, 1.5, 0),
            socket('neck', SOCKET_TYPES.SAUCER_VENTRAL, 0, -1.5, 4), // Further back
            socket('phaser_strip', SOCKET_TYPES.WEAPON_MOUNT, 0, 0, 7)
        ],
        tags: ['union', 'advanced', 'organic']
    },
    'saucer_wedge': {
        id: 'saucer_wedge',
        type: 'composite',
        usage: 'hull_primary',
        components: [
            { type: 'wedge', dims: { span: 10, rootChord: 18, tipChord: 2, sweep: 8, depth: 2, centered: true }, pos: [0, 0, 0], rot: [0,0,0] }
        ],
        sockets: [
            socket('bridge', SOCKET_TYPES.BRIDGE_MOUNT, 0, 1.0, -2),
            socket('neck', SOCKET_TYPES.SAUCER_VENTRAL, 0, -1.0, 2)
        ],
        tags: ['union', 'warship']
    },

    // --- SECONDARY HULLS ---
    'hull_cylindrical_standard': {
        id: 'hull_cylindrical_standard',
        type: 'cylinder',
        dims: { radiusTop: 2.5, radiusBottom: 2.5, height: 12, radialSegments: 16 },
        rot: [Math.PI/2, 0, 0], // Lay flat
        usage: 'hull_secondary',
        sockets: [
            socket('neck', SOCKET_TYPES.NECK_TOP, 0, 2.5, 4), // Forward top
            socket('pylon_port', SOCKET_TYPES.PYLON_MOUNT, 2.0, 0, -2, 0, 0, -0.2), // Angled up slightly
            socket('pylon_starboard', SOCKET_TYPES.PYLON_MOUNT, -2.0, 0, -2, 0, 0, 0.2),
            socket('deflector', SOCKET_TYPES.DEFLECTOR, 0, 0, 6),
            socket('shuttlebay', SOCKET_TYPES.FUSELAGE_AFT, 0, 1, -6)
        ],
        tags: ['union', 'standard']
    },
    'hull_box_cargo': {
        id: 'hull_box_cargo',
        type: 'box',
        dims: { width: 4, height: 4, depth: 16 },
        usage: 'hull_secondary',
        sockets: [
            socket('bridge', SOCKET_TYPES.BRIDGE_MOUNT, 0, 2, 7),
            socket('cargo_port', SOCKET_TYPES.FUSELAGE_SIDE, 2, 0, 0),
            socket('cargo_starboard', SOCKET_TYPES.FUSELAGE_SIDE, -2, 0, 0),
            socket('engine', SOCKET_TYPES.ENGINE_MOUNT, 0, 0, -8)
        ],
        tags: ['industrial', 'freighter']
    },

    // --- NECKS ---
    'neck_upright': {
        id: 'neck_upright',
        type: 'box',
        dims: { width: 1.5, height: 4, depth: 3 },
        usage: 'fuselage_neck',
        sockets: [
            socket('top', SOCKET_TYPES.NECK_TOP, 0, 2, 0),
            socket('bottom', SOCKET_TYPES.NECK_BOTTOM, 0, -2, 0)
        ],
        tags: ['standard']
    },
    'neck_swept': {
        id: 'neck_swept',
        type: 'wedge',
        dims: { span: 2, rootChord: 6, tipChord: 4, sweep: 2, depth: 2, centered: true },
        rot: [0, 0, Math.PI/2], // Rotate to stand up
        usage: 'fuselage_neck',
        sockets: [
            socket('top', SOCKET_TYPES.NECK_TOP, 0, 1, -1), // Offset due to sweep
            socket('bottom', SOCKET_TYPES.NECK_BOTTOM, 0, -1, 1)
        ],
        tags: ['advanced', 'fast']
    },

    // --- NACELLES ---
    'nacelle_cylindrical': {
        id: 'nacelle_cylindrical',
        type: 'cylinder',
        dims: { radiusTop: 1.2, radiusBottom: 1.2, height: 14, radialSegments: 16 },
        rot: [Math.PI/2, 0, 0],
        usage: 'warp_nacelle',
        sockets: [
            socket('pylon', SOCKET_TYPES.PYLON_MOUNT, 0, -1.2, 0),
            socket('bussard', SOCKET_TYPES.FORWARD, 0, 0, 7)
        ],
        tags: ['union', 'standard']
    },
    'nacelle_rectangular': {
        id: 'nacelle_rectangular',
        type: 'box',
        dims: { width: 1.5, height: 2, depth: 12 },
        usage: 'warp_nacelle',
        sockets: [
            socket('pylon', SOCKET_TYPES.PYLON_MOUNT, -0.75, 0, 0) // Side mount
        ],
        tags: ['industrial', 'boxy']
    },

    // --- PYLONS ---
    'pylon_straight': {
        id: 'pylon_straight',
        type: 'box',
        dims: { width: 6, height: 0.5, depth: 2 },
        usage: 'pylon',
        sockets: [
            socket('root', SOCKET_TYPES.PYLON_MOUNT, -3, 0, 0),
            socket('tip', SOCKET_TYPES.NACELLE_MOUNT, 3, 0, 0)
        ],
        tags: ['standard']
    },
    'pylon_angled': {
        id: 'pylon_angled',
        type: 'box',
        dims: { width: 6, height: 0.5, depth: 2 },
        rot: [0, 0, Math.PI/6], // 30 deg up
        usage: 'pylon',
        sockets: [
            socket('root', SOCKET_TYPES.PYLON_MOUNT, -2.5, -1.5, 0),
            socket('tip', SOCKET_TYPES.NACELLE_MOUNT, 2.5, 1.5, 0)
        ],
        tags: ['union']
    },

    // --- BRIDGES ---
    'bridge_dome': {
        id: 'bridge_dome',
        type: 'sphere',
        dims: { radius: 1.5 },
        scale: [1, 0.6, 1], // Flattened
        usage: 'bridge',
        sockets: [],
        tags: ['standard']
    },
    'bridge_block': {
        id: 'bridge_block',
        type: 'box',
        dims: { width: 3, height: 1.5, depth: 2 },
        usage: 'bridge',
        sockets: [],
        tags: ['industrial']
    },

    // --- EXOTIC ---
    'ring_habitat': {
        id: 'ring_habitat',
        type: 'torus',
        dims: { radius: 10, tube: 1.5 },
        rot: [Math.PI/2, 0, 0],
        usage: 'hull_ring',
        sockets: [
            socket('spoke_1', SOCKET_TYPES.RING_SPOKE, 10, 0, 0),
            socket('spoke_2', SOCKET_TYPES.RING_SPOKE, -10, 0, 0),
            socket('spoke_3', SOCKET_TYPES.RING_SPOKE, 0, 0, 10),
            socket('spoke_4', SOCKET_TYPES.RING_SPOKE, 0, 0, -10)
        ],
        tags: ['station', 'alien_logic']
    }
};
