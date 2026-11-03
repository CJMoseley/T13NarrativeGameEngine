export function validateProficiency(record) {
    const data = record?.prof ?? record;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Proficiency must be an object.');
    }
    const name = data.name ?? data.Name;
    const names = Array.isArray(name) ? name : [name];
    if (!names.some(value => typeof value === 'string' && value.trim())) {
        throw new Error('Proficiency requires a name.');
    }
    const description = data.description ?? data.Description;
    if (typeof description !== 'string' || !description.trim()) {
        throw new Error('Proficiency requires a description.');
    }
    const tags = data.tags ?? data.Tags;
    const facets = tags?.facets ?? tags?.Facets;
    if (!Array.isArray(facets) || facets.length === 0 ||
        !facets.every(value => (typeof value === 'string' && value.trim()) ||
            (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0))) {
        throw new Error('Proficiency requires tags with at least one Facet.');
    }
}
