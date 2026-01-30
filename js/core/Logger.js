/* LEGACY CODE - MOVED TO src/t13ne/core/

class Logger {
  constructor() {
    this.isEnabled = true;
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  start(funcName, data) {
    if (!this.isEnabled) return;
    if (data !== undefined) {
      console.log(`[STARTED] ${funcName}`, data);
    } else {
      console.log(`[STARTED] ${funcName}`);
    }
  }

  end(funcName, result) {
    if (!this.isEnabled) return;
    console.log(`[ENDED] ${funcName} - Result:`, result === undefined ? 'undefined' : result);
  }

  logVariables(variables) {
    if (!this.isEnabled) return;
    console.log(`[VARIABLE]`, variables);
  }

  message(...args) {
    if (!this.isEnabled) return;
    console.log(`[MESSAGE]`, ...args);
  }

  error(message, ...args) {
    if (!this.isEnabled) return;
    console.error(`[ERROR] ${message}`, ...args);
  }

  warn(message, ...args) {
    if (!this.isEnabled) return;
    console.warn(`[WARN] ${message}`, ...args);
  }
}

export default new Logger();

*/