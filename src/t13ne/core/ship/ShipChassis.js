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
    RING_HUB: 'ring_hub',
    WING_MOUNT: 'wing_mount'
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
            socket('edge_starboard', SOCKET_TYPES.WEAPON_MOUNT, -8.5, 0, 0),
            socket('wing_port', SOCKET_TYPES.WING_MOUNT, 9.0, 0, 0, 0, 0, 0),
            socket('wing_starboard', SOCKET_TYPES.WING_MOUNT, -9.0, 0, 0, 0, 0, 0, true)
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
            socket('phaser_strip', SOCKET_TYPES.WEAPON_MOUNT, 0, 0, 7),
            socket('wing_port', SOCKET_TYPES.WING_MOUNT, 6.0, 0, 0, 0, 0, 0),
            socket('wing_starboard', SOCKET_TYPES.WING_MOUNT, -6.0, 0, 0, 0, 0, 0, true)
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
            socket('neck', SOCKET_TYPES.SAUCER_VENTRAL, 0, -1.0, 2),
            socket('wing_port', SOCKET_TYPES.WING_MOUNT, 5.0, 0, 2, 0, 0, 0),
            socket('wing_starboard', SOCKET_TYPES.WING_MOUNT, -5.0, 0, 2, 0, 0, 0, true)
        ],
        tags: ['union', 'warship']
    },
    'saucer_radial': {
        id: 'saucer_radial',
        type: 'cylinder',
        dims: { radiusTop: 8, radiusBottom: 8, height: 2, radialSegments: 16 },
        pos: [0, 0, 0],
        rot: [0, 0, 0],
        usage: 'hull_primary',
        sockets: [
            socket('bridge', SOCKET_TYPES.BRIDGE_MOUNT, 0, 1.0, 0),
            socket('wing_1', SOCKET_TYPES.WING_MOUNT, 8, 0, 0, 0, 0, 0), // +X
            socket('wing_2', SOCKET_TYPES.WING_MOUNT, 0, 0, 8, 0, -Math.PI/2, 0), // +Z
            socket('wing_3', SOCKET_TYPES.WING_MOUNT, -8, 0, 0, 0, Math.PI, 0), // -X
            socket('wing_4', SOCKET_TYPES.WING_MOUNT, 0, 0, -8, 0, Math.PI/2, 0) // -Z
        ],
        tags: ['alien', 'spinning']
    },
    'hull_star': {
        id: 'hull_star',
        type: 'composite',
        usage: 'hull_primary',
        components: [
            { type: 'cylinder', dims: { radiusTop: 3, radiusBottom: 3, height: 4, radialSegments: 8 }, pos: [0,0,0], rot: [0,0,0] }
        ],
        sockets: [
            socket('bridge', SOCKET_TYPES.BRIDGE_MOUNT, 0, 2, 0),
            socket('arm_1', SOCKET_TYPES.WING_MOUNT, 2.5, 0, 1.5, 0, -Math.PI/6, 0),
            socket('arm_2', SOCKET_TYPES.WING_MOUNT, 0, 0, 3, 0, -Math.PI/2, 0),
            socket('arm_3', SOCKET_TYPES.WING_MOUNT, -2.5, 0, 1.5, 0, -5*Math.PI/6, 0),
            socket('arm_4', SOCKET_TYPES.WING_MOUNT, -2.5, 0, -1.5, 0, 5*Math.PI/6, 0),
            socket('arm_5', SOCKET_TYPES.WING_MOUNT, 0, 0, -3, 0, Math.PI/2, 0),
            socket('arm_6', SOCKET_TYPES.WING_MOUNT, 2.5, 0, -1.5, 0, Math.PI/6, 0)
        ],
        tags: ['station', 'spinning']
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
            socket('wing_port', SOCKET_TYPES.WING_MOUNT, 2.2, 0, 1, 0, 0, 0),
            socket('wing_starboard', SOCKET_TYPES.WING_MOUNT, -2.2, 0, 1, 0, 0, 0, true), // Mirror
            socket('deflector', SOCKET_TYPES.FUSELAGE_FRONT, 0, 0, 6),
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
            socket('cargo_starboard', SOCKET_TYPES.FUSELAGE_SIDE, -2, 0, 0, 0, 0, 0, true),
            socket('wing_port', SOCKET_TYPES.WING_MOUNT, 2, -1, 2, 0, 0, 0),
            socket('wing_starboard', SOCKET_TYPES.WING_MOUNT, -2, -1, 2, 0, 0, 0, true),
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

    // --- WINGS ---
    'wing_delta': {
        id: 'wing_delta',
        type: 'wedge',
        // Wedge is defined by span (x), rootChord (z), tipChord, sweep.
        dims: { span: 8, rootChord: 10, tipChord: 1, sweep: 6, depth: 0.5, centered: false },
        usage: 'wing',
        sockets: [
            socket('hardpoint_1', SOCKET_TYPES.WEAPON_MOUNT, 4, 0, 0)
        ],
        tags: ['atmospheric', 'fighter']
    },
    'wing_swept_back': {
        id: 'wing_swept_back',
        type: 'wedge',
        dims: { span: 12, rootChord: 6, tipChord: 3, sweep: 4, depth: 0.6, centered: false },
        usage: 'wing',
        sockets: [
            socket('engine_mount', SOCKET_TYPES.ENGINE_MOUNT, 6, -0.5, 0)
        ],
        tags: ['standard', 'cruiser']
    },
    'wing_forward_swept': {
        id: 'wing_forward_swept',
        type: 'wedge',
        dims: { span: 9, rootChord: 5, tipChord: 2, sweep: -3, depth: 0.4, centered: false },
        usage: 'wing',
        sockets: [
            socket('tip_weapon', SOCKET_TYPES.WEAPON_MOUNT, 8, 0, 2)
        ],
        tags: ['advanced', 'agile']
    },
    'wing_blocky': {
        id: 'wing_blocky',
        type: 'box',
        dims: { width: 6, height: 1, depth: 4 },
        usage: 'wing',
        tags: ['industrial']
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
