/**
 * T13Name Class
 * A helper class to parse and standardize name formats into a consistent object.
 * It accepts strings, arrays `['common', 'full', 'aliases']`, or objects.
 */
export default class T13Name {
  constructor(input) {
    this.common = '';
    this.full = '';
    this.aliases = '';
    if (Array.isArray(input)) {
      this.common = input[0] || 'Unnamed';
      this.full = input[1] || this.common;
      this.aliases = input[2] || this.common;
    } else if (typeof input === 'object' && input !== null) {
      this.common = input.common || input.name || 'Unnamed';
      this.full = input.full || input.fullName || this.common;
      this.aliases = input.aliases || input.altName || input.akas || this.common;
    } else {
      this.common = String(input || 'Unnamed');
      this.full = this.common;
      this.aliases = '';
    }
  }
  get asArray() { return [this.common, this.full, this.aliases]; }
}