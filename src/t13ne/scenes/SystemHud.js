export function systemBodyCount(system, planets) {
    const stars = Array.isArray(system?.stars) && system.stars.length ? system.stars.length : 1;
    return stars + planets.length + planets.reduce((total, planet) =>
        total + (Array.isArray(planet.moons) ? planet.moons.length : 0), 0);
}

export function systemHudText(system, planets) {
    const names = Array.isArray(system?.systemNameFull) ? system.systemNameFull.filter(Boolean) : [];
    const name = [...new Set(names)].join(' | ') || system?.name || 'Unknown';
    return `SYSTEM: ${name} (${systemBodyCount(system, planets)} Bodies)`;
}
