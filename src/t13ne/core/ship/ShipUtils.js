import * as THREE from 'three';

export const COMPONENT_COLORS = {
    'fuselage': 0xffff00, // Structural Yellow
    'hull': 0x808080,
    'chassis': 0x808080,
    'engine': 0xff4500,   // OrangeRed
    'generator': 0x33ff33, // Lime Green
    'thruster': 0xffa500, // Orange
    'bridge': 0x00bfff,   // DeepSkyBlue
    'cockpit': 0x00bfff,
    'wing': 0xeeeeee,     // White
    'fin': 0xeeeeee,
    'weapon': 0xff0000,   // Red
    'sensor': 0x00ff00,   // Lime
    'shield': 0x0000ff,   // Blue
    'fuel': 0xffff00,     // Yellow
    'nose': 0xeeeeee,     // White
    'structural': 0xffff00, // Yellow
    'default': 0xaaaaaa
};

export const TECH_SPECS = ["High-Output", "High-Torque", "Phase-Shift", "Quantum", "Ion-Drive", "Fusion", "Zero-Point", "Tachyon"];
export const QUALITIES = ["Mk I", "Deluxe", "Elite", "Prime", "Alpha", "Prototype", "Custom", "Heavy Duty"];
export const FALLBACK_MANUFACTURERS = ["Zylex", "Komwrath", "Hyperion", "Vector", "Omni", "Apex", "Tyrell", "Yoyodyne"];

export const SHIP_PREFIXES = ["ISS", "HMS", "GSS", "X-", "Star", "Void", "Nebula", "Cosmic", "Galactic", "Stellar", "Solar", "Lunar", "Orbital", "Hyper", "Quantum", "Nano", "Bio", "Cyber", "Astro", "Flux", "Chrono", "Meta", "Omega", "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega"];
export const SHIP_ADJECTIVES = ["Red", "Blue", "Green", "Black", "White", "Silver", "Golden", "Iron", "Steel", "Crimson", "Azure", "Emerald", "Obsidian", "Ivory", "Argent", "Gilded", "Ferrous", "Adamant", "Silent", "Swift", "Brave", "Bold", "Mighty", "Grand", "Royal", "Imperial", "Noble", "Savage", "Fierce", "Wild", "Untamed", "Eternal", "Infinite", "Timeless", "Ancient", "Old", "New", "Young", "Modern", "Future", "Past", "Lost", "Found", "Hidden", "Secret", "Forbidden", "Dark", "Light", "Bright", "Dim", "Shadow", "Ghost", "Phantom", "Spirit", "Soul", "Heart", "Mind", "Body", "Blood", "Bone", "Flesh", "Skin", "Scale", "Feather", "Fur", "Claw", "Tooth", "Fang", "Horn", "Tusk", "Beak", "Wing", "Tail", "Fin", "Eye", "Ear", "Nose", "Mouth", "Tongue", "Lip", "Hand", "Foot", "Leg", "Arm", "Finger", "Toe", "Thumb", "Head", "Neck", "Chest", "Back", "Stomach", "Hip", "Waist", "Thigh", "Knee", "Calf", "Ankle", "Heel", "Sole"];
export const SHIP_NOUNS = ["Eagle", "Hawk", "Falcon", "Owl", "Raven", "Crow", "Sparrow", "Robin", "Bluejay", "Cardinal", "Stork", "Swan", "Heron", "Crane", "Flamingo", "Pelican", "Goose", "Duck", "Chicken", "Rooster", "Turkey", "Peacock", "Parrot", "Penguin", "Ostrich", "Emu", "Kiwi", "Dodo", "Moa", "Cassowary", "Rhea", "Lion", "Tiger", "Bear", "Wolf", "Fox", "Coyote", "Dog", "Cat", "Leopard", "Jaguar", "Cheetah", "Panther", "Cougar", "Lynx", "Bobcat", "Ocelot", "Serval", "Caracal", "Puma", "Mountain Lion", "Hyena", "Jackal", "Dingo", "Racoon", "Badger", "Wolverine", "Otter", "Weasel", "Mink", "Stoat", "Ferret", "Polecat", "Marten", "Fisher", "Sable", "Ermine", "Skunk", "Mongoose", "Meerkat", "Civet", "Genet", "Binturong", "Fossa", "Linsang", "Nandinia", "Oyian", "Poyian", "Kinkajou", "Olingo", "Coati", "Raccoon", "Ringtail", "Cacomistle", "Bassarisk", "Bassaricyon", "Nasuella", "Nasua", "Procyon", "Bassariscus", "Potos", "Mustela", "Vormela", "Martes", "Gulo", "Eira", "Galictis", "Lyncodon", "Ictonyx", "Poecilogale", "Mellivora", "Meles", "Arctonyx", "Taxidea", "Melogale", "Mydaus", "Lutra", "Hydrictis", "Lontra", "Pteronura", "Aonyx", "Enhydra", "Amblonyx", "Lutrogale"];

// Simple Seeded PRNG (Mulberry32)
export function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export function getCompProps(comp) {
    // Try to find the definition object. It might be 'definition', 'component', or the object itself.
    const def = comp.definition || comp.component || comp;
    
    // Extract type and dims, checking top-level first, then definition
    const type = comp.type || def.type || 'box';
    const dims = comp.dims || def.dims || {};
    
    // Extract position and rotation
    let pos = comp.pos || comp.position || def.position || [0, 0, 0];
    if (!Array.isArray(pos) && pos.isVector3) pos = [pos.x, pos.y, pos.z];
    
    let rot = comp.rot || comp.rotation || def.rotation || [0, 0, 0];
    if (!Array.isArray(rot) && rot.isEuler) rot = [rot.x, rot.y, rot.z];

    // Extract usage/name
    const usage = comp.usage || def.name || def.usage || '';

    return { type, dims, pos, rot, def, usage };
}

// Helper to find surface point via raycasting
export function getSurfacePoint(components, origin, direction, usageFilter = ['fuselage', 'hull', 'spine', 'block', 'monolith']) {
    const targets = components.filter(c => {
        if (!c.usage) return false;
        const u = c.usage.toLowerCase();
        if (Array.isArray(usageFilter)) {
            return usageFilter.some(f => u.includes(f));
        }
        return u.includes(usageFilter);
    });
    if (targets.length === 0) return null;

    const raycaster = new THREE.Raycaster(
        new THREE.Vector3(...origin),
        new THREE.Vector3(...direction).normalize()
    );

    let closestPoint = null;
    let minDistance = Infinity;

    for (const c of targets) {
        try {
            let geo;
            const d = c.dims;
            
            switch (c.type) {
                case 'box': geo = new THREE.BoxGeometry(d.width, d.height, d.depth); break;
                case 'cylinder': geo = new THREE.CylinderGeometry(d.radiusTop, d.radiusBottom, d.height, d.radialSegments || 16); break;
                case 'prism': geo = new THREE.CylinderGeometry(d.radius || d.radiusTop, d.radius || d.radiusBottom, d.height, d.segments || 3); break;
                case 'tetrahedron': geo = new THREE.TetrahedronGeometry(d.radius); break;
                case 'sphere': geo = new THREE.SphereGeometry(d.radius, 16, 16); break;
                case 'torus': geo = new THREE.TorusGeometry(d.radius, d.tube, 16, 32); break;
                case 'cone': geo = new THREE.ConeGeometry(d.radius, d.height, 16); break;
                default: continue;
            }

            if (!geo) continue;

            const mesh = new THREE.Mesh(geo);
            mesh.position.set(...c.pos);
            mesh.rotation.set(...c.rot);
            if (c.scale) mesh.scale.set(...c.scale);
            mesh.updateMatrixWorld();

            const intersects = raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                if (intersects[0].distance < minDistance) {
                    minDistance = intersects[0].distance;
                    closestPoint = intersects[0].point;
                }
            }
            
            geo.dispose();
        } catch (e) { continue; }
    }

    return closestPoint;
}
