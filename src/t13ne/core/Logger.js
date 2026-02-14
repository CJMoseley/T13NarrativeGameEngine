class Logger {
  constructor() {
    this.isEnabled = true;
    this.level = 1; // 0: DEBUG, 1: INFO, 2: WARN, 3: ERROR
    this.timers = new Map();
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  setLevel(level) {
    // Accepts string 'DEBUG', 'INFO', etc. or number
    const levels = { 'DEBUG': 0, 'INFO': 1, 'WARN': 2, 'ERROR': 3 };
    if (typeof level === 'string' && levels[level.toUpperCase()] !== undefined) {
      this.level = levels[level.toUpperCase()];
    } else if (typeof level === 'number') {
      this.level = level;
    }
  }

  _ts() {
    const now = new Date();
    return now.toISOString().split('T')[1].slice(0, -1); // HH:mm:ss.sss
  }

  start(funcName, data) {
    if (!this.isEnabled || this.level > 0) return;
    this.timers.set(funcName, performance.now());
    if (data !== undefined) {
      console.log(`[${this._ts()}] [STARTED] ${funcName}`, data);
    } else {
      console.log(`[${this._ts()}] [STARTED] ${funcName}`);
    }
  }

  end(funcName, result) {
    if (!this.isEnabled || this.level > 0) return;
    const startTime = this.timers.get(funcName);
    let duration = '';
    if (startTime) {
      const diff = performance.now() - startTime;
      duration = ` (${diff.toFixed(2)}ms)`;
      this.timers.delete(funcName);
    }
    console.log(`[${this._ts()}] [ENDED] ${funcName}${duration} - Result:`, result === undefined ? 'undefined' : result);
  }

  logVariables(variables) {
    if (!this.isEnabled || this.level > 0) return;
    console.log(`[${this._ts()}] [VARIABLE]`, variables);
  }

  message(...args) {
    if (!this.isEnabled || this.level > 1) return;
    console.log(`[${this._ts()}] [MESSAGE]`, ...args);
  }

  error(message, ...args) {
    if (!this.isEnabled) return;
    console.error(`[${this._ts()}] [ERROR] ${message}`, ...args);
  }

  warn(message, ...args) {
    if (!this.isEnabled || this.level > 2) return;
    console.warn(`[${this._ts()}] [WARN] ${message}`, ...args);
  }
}

export default new Logger();
