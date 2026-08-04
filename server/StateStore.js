/**
 * StateStore.js
 *
 * Centralized, in-memory state store with atomic file fallback to aka_db.json.
 * Dispatches change events to registered listeners (e.g., WebSocket broadcasts).
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.resolve(__dirname, '../aka_db.json');
const PERSIST_TO_FILE = process.env.T13NE_PERSIST_TO_FILE === 'true';

class StateStore {
  constructor() {
    this.listeners = [];

    // Default system state
    this.state = {
      currentLocation: 'space_diner',
      activeScene: 'scene_0',
      tension: 0.1,
      yarnPoints: 0,
      resolutionStatus: 'unresolved',
      lastUpdated: new Date().toISOString()
    };

    // Default characters collection
    this.characters = {};

    this.load();
  }

  /**
   * Load state and characters from aka_db.json if persistence is enabled.
   */
  load() {
    if (!PERSIST_TO_FILE) {
      console.log('[StateStore] Running in-memory mode. File persistence is disabled.');
      return;
    }

    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);

        if (parsed.__t13ne_state) {
          this.state = { ...this.state, ...parsed.__t13ne_state };
        }
        if (parsed.__t13ne_characters) {
          this.characters = parsed.__t13ne_characters;
        }
        console.log(`[StateStore] Successfully loaded persisted state and ${Object.keys(this.characters).length} characters from ${DB_FILE}`);
      } else {
        console.log(`[StateStore] Persistence file ${DB_FILE} does not exist yet. Using defaults.`);
      }
    } catch (err) {
      console.error('[StateStore] Error loading from file, falling back to memory:', err);
    }
  }

  /**
   * Save the current state and characters to aka_db.json using an atomic write pattern.
   */
  save() {
    if (!PERSIST_TO_FILE) {
      return;
    }

    try {
      let mergedData = {};

      // Load existing aka_db.json to preserve synonyms and other keys
      if (fs.existsSync(DB_FILE)) {
        try {
          const raw = fs.readFileSync(DB_FILE, 'utf8');
          mergedData = JSON.parse(raw);
        } catch (e) {
          console.error('[StateStore] Failed parsing existing file. Re-creating base synonym list empty.');
        }
      }

      // Merge our state and character namespaces
      mergedData.__t13ne_state = this.state;
      mergedData.__t13ne_characters = this.characters;

      // Atomic write pattern: write to tmp file first, then rename
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(mergedData, null, 2), 'utf8');
      fs.renameSync(tmpFile, DB_FILE);

      console.log('[StateStore] Atomic write complete.');
    } catch (err) {
      console.error('[StateStore] Error writing state atomically:', err);
    }
  }

  /**
   * Subscribe to state / character modification events.
   * @param {Function} cb - Callback function: (type, data) => {}
   */
  addListener(cb) {
    if (typeof cb === 'function') {
      this.listeners.push(cb);
    }
  }

  /**
   * Notify all registered listeners of a change.
   */
  emit(type, data) {
    for (const listener of this.listeners) {
      try {
        listener(type, data);
      } catch (e) {
        console.error('[StateStore] Listener error:', e);
      }
    }
  }

  // --- State Accessors ---

  getState() {
    return this.state;
  }

  updateState(newState) {
    this.state = {
      ...this.state,
      ...newState,
      lastUpdated: new Date().toISOString()
    };
    this.save();
    this.emit('stateUpdated', this.state);
    return this.state;
  }

  // --- Character Accessors ---

  getCharacters() {
    return Object.values(this.characters);
  }

  getCharacter(id) {
    return this.characters[id] || null;
  }

  createCharacter(charData) {
    const id = charData.id || `char_${Math.floor(Math.random() * 1000000)}`;
    const character = {
      id,
      name: charData.name || 'Unnamed Wanderer',
      facets: charData.facets || [],
      proficiencies: charData.proficiencies || [],
      boons: charData.boons || [],
      hitches: charData.hitches || [],
      descendants: charData.descendants || [],
      plots: charData.plots || [],
      extras: charData.extras || {},
      created: new Date().toISOString()
    };

    this.characters[id] = character;
    this.save();
    this.emit('characterCreated', character);
    return character;
  }

  updateCharacter(id, charData) {
    if (!this.characters[id]) {
      return null;
    }

    this.characters[id] = {
      ...this.characters[id],
      ...charData,
      id, // Do not allow changing id
      updated: new Date().toISOString()
    };

    this.save();
    this.emit('characterUpdated', this.characters[id]);
    return this.characters[id];
  }

  deleteCharacter(id) {
    if (!this.characters[id]) {
      return false;
    }

    const character = this.characters[id];
    delete this.characters[id];
    this.save();
    this.emit('characterDeleted', character);
    return true;
  }
}

module.exports = new StateStore();
