/**
 * PermissionService.js
 *
 * Centralized gatekeeper and single source of truth for write access validation.
 * Enforces role-based permissions (Referee vs Player) on resources and actions.
 *
 * [SECURITY RESTRICTION] No hardcoded default secrets are allowed.
 */

const crypto = require('crypto');

// Load secret strictly from environment or generate a secure one-time session token
const REFREE_SECRET = process.env.REFREE_SECRET || (() => {
  console.warn('[SECURITY WARNING] REFREE_SECRET environment variable is not defined!');
  const fallback = crypto.randomBytes(32).toString('hex');
  console.info(`[SECURITY] Generated secure one-time session token: Bearer ${fallback}`);
  return fallback;
})();

class PermissionService {
  /**
   * Evaluates granular, role-based permission. Mandatory JULES API contract method.
   * @param {'player' | 'referee'} userRole
   * @param {string} resourceType
   * @param {string} action
   * @returns {boolean}
   */
  canWrite(userRole, resourceType, action) {
    if (userRole === 'referee') {
      return true;
    }

    const readActions = ['read', 'get', 'view', 'list'];
    if (readActions.includes(action.toLowerCase())) {
      return true;
    }

    return false;
  }

  /**
   * Identifies the role of a given HTTP request based on its Authorization header.
   * @param {import('express').Request} req
   * @returns {'player' | 'referee'}
   */
  getRole(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return 'player';
    }

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return 'player';
    }

    const token = match[1];
    if (token === REFREE_SECRET) {
      return 'referee';
    }

    return 'player';
  }

  /**
   * Returns true if the request is authorized as Referee (write access).
   * @param {import('express').Request} req
   * @returns {boolean}
   */
  isReferee(req) {
    return this.getRole(req) === 'referee';
  }

  /**
   * Express middleware to enforce Referee permissions utilizing the canWrite gate.
   * @param {string} resourceType
   * @param {string} action
   */
  refereeMiddleware(resourceType = 'state', action = 'update') {
    return (req, res, next) => {
      const role = this.getRole(req);

      if (this.canWrite(role, resourceType, action)) {
        next();
      } else {
        res.status(403).json({
          error: `Forbidden: Role '${role}' is not authorized to '${action}' on '${resourceType}'. Elevate credentials via PermissionService.`,
          requiresAuthorization: true
        });
      }
    };
  }

  /**
   * Validates if a WebSocket client registration has Referee privileges.
   * @param {object} registrationMsg
   * @returns {boolean}
   */
  isWSClientReferee(registrationMsg) {
    if (!registrationMsg || !registrationMsg.token) {
      return false;
    }
    return registrationMsg.token === REFREE_SECRET;
  }
}

module.exports = new PermissionService();
