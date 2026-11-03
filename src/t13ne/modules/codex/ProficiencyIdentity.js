export function isSafeProficiencyId(id) {
    return typeof id === 'string' && id.length <= 128 &&
        /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id) &&
        !Object.hasOwn(Object.prototype, id);
}
