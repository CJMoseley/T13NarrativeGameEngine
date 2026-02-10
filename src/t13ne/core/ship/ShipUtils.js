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
