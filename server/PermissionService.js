/**
 * PermissionService.js
 *
 * Centralized gatekeeper and single source of truth for write access validation.
 * Implements asymmetric ECDSA P-256 (ES256) signed JWT verification and salted
 * PBKDF2-SHA256 + HMAC-SHA256 challenge-response Referee elevation.
 *
 * [SECURITY RESTRICTION] No hardcoded default secrets are allowed.
 */

const crypto = require('crypto');

const PBKDF2_ITERATIONS = 100000;
const CHALLENGE_TTL_MS = 60000;
const JWT_TTL_SECONDS = 3600 * 12;

// Ephemeral ECDSA P-256 signing keypair for issuing & verifying ES256 session JWTs
const { publicKey: jwtPublicKey, privateKey: jwtPrivateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1'
});
const jwtKid = `t13-srv-${crypto.randomBytes(6).toString('hex')}`;
const jwtPublicJwk = {
  ...jwtPublicKey.export({ format: 'jwk' }),
  kid: jwtKid,
  alg: 'ES256',
  use: 'sig'
};

// Load secret strictly from environment or generate a secure one-time session secret
const REFREE_SECRET = process.env.REFREE_SECRET || (() => {
  console.warn('[SECURITY WARNING] REFREE_SECRET environment variable is not defined!');
  const fallback = crypto.randomBytes(32).toString('hex');
  console.info(`[SECURITY] Generated secure one-time session token: Bearer ${fallback}`);
  return fallback;
})();

const passphraseSalt = crypto.randomBytes(16).toString('hex');
const passphraseHashHex = crypto
  .pbkdf2Sync(REFREE_SECRET, passphraseSalt, PBKDF2_ITERATIONS, 32, 'sha256')
  .toString('hex');

// Single-use nonces for challenge-response authentication
const pendingChallenges = new Map();

function base64UrlEncode(bufOrStr) {
  const buf = Buffer.isBuffer(bufOrStr) ? bufOrStr : Buffer.from(String(bufOrStr), 'utf8');
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

function timingSafeStringMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

class PermissionService {
  getPublicJWKS() {
    return { keys: [jwtPublicJwk] };
  }

  getPublicJwk() {
    return jwtPublicJwk;
  }

  /**
   * Signs an ES256 JWT using IEEE P1363 signature encoding (compatible with Web Crypto).
   */
  signJWT(claims, expiresInSec = JWT_TTL_SECONDS) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'ES256', typ: 'JWT', kid: jwtKid };
    const payload = {
      ...claims,
      iat: claims.iat ?? now,
      exp: claims.exp ?? (now + expiresInSec),
      jti: claims.jti ?? crypto.randomBytes(12).toString('hex')
    };
    const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
    const sig = crypto.sign('sha256', Buffer.from(signingInput, 'utf8'), {
      key: jwtPrivateKey,
      dsaEncoding: 'ieee-p1363'
    });
    return `${signingInput}.${base64UrlEncode(sig)}`;
  }

  /**
   * Verifies an ES256 JWT issued by this server.
   */
  verifyJWT(token) {
    try {
      if (typeof token !== 'string') return { valid: false, claims: null };
      const parts = token.split('.');
      if (parts.length !== 3) return { valid: false, claims: null };
      const [hB64, pB64, sB64] = parts;
      const header = JSON.parse(base64UrlDecode(hB64).toString('utf8'));
      if (header.alg !== 'ES256') return { valid: false, claims: null };
      const sig = base64UrlDecode(sB64);
      const ok = crypto.verify(
        'sha256',
        Buffer.from(`${hB64}.${pB64}`, 'utf8'),
        { key: jwtPublicKey, dsaEncoding: 'ieee-p1363' },
        sig
      );
      if (!ok) return { valid: false, claims: null };
      const claims = JSON.parse(base64UrlDecode(pB64).toString('utf8'));
      const now = Math.floor(Date.now() / 1000);
      if (typeof claims.exp === 'number' && now >= claims.exp) {
        return { valid: false, claims: null, reason: 'expired' };
      }
      return { valid: true, claims };
    } catch (e) {
      return { valid: false, claims: null };
    }
  }

  /**
   * Issues a single-use challenge for Referee passphrase elevation.
   */
  createChallenge() {
    const now = Date.now();
    for (const [id, entry] of pendingChallenges.entries()) {
      if (entry.expiresAt <= now) pendingChallenges.delete(id);
    }
    const challengeId = crypto.randomBytes(12).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiresAt = now + CHALLENGE_TTL_MS;
    pendingChallenges.set(challengeId, { nonce, expiresAt });
    return {
      challengeId,
      nonce,
      salt: passphraseSalt,
      iterations: PBKDF2_ITERATIONS,
      expiresAt
    };
  }

  /**
   * Verifies a challenge-response HMAC proof and issues a Referee ES256 JWT.
   */
  verifyChallengeAndIssueJWT({ challengeId, response, actorId = 'referee', sessionId = 'default' } = {}) {
    const entry = pendingChallenges.get(challengeId);
    if (!entry) return { ok: false, error: 'Invalid or already consumed challenge.' };
    pendingChallenges.delete(challengeId);
    if (entry.expiresAt <= Date.now()) return { ok: false, error: 'Challenge expired.' };
    if (typeof response !== 'string' || !response.length) return { ok: false, error: 'Missing challenge response.' };

    const expectedHex = crypto
      .createHmac('sha256', passphraseHashHex)
      .update(entry.nonce)
      .digest('hex');

    if (!timingSafeStringMatch(expectedHex, response.toLowerCase())) {
      return { ok: false, error: 'Invalid Referee credentials.' };
    }

    const token = this.signJWT({
      sub: String(actorId || 'referee'),
      sid: String(sessionId || 'default'),
      role: 'referee'
    });
    return {
      ok: true,
      token,
      role: 'referee',
      actorId: String(actorId || 'referee'),
      sessionId: String(sessionId || 'default'),
      publicJwk: jwtPublicJwk
    };
  }

  /**
   * Issues a signed player JWT (cannot self-elevate to referee).
   */
  issuePlayerJWT({ actorId, sessionId = 'default' } = {}) {
    const sub = String(actorId || `player_${crypto.randomBytes(4).toString('hex')}`);
    const sid = String(sessionId || 'default');
    const token = this.signJWT({ sub, sid, role: 'player' });
    return { token, role: 'player', actorId: sub, sessionId: sid, publicJwk: jwtPublicJwk };
  }

  /**
   * Resolves a bearer/WS token to { role, actorId, sessionId, authMethod }.
   */
  resolveTokenAuth(token) {
    if (!token || typeof token !== 'string') {
      return { role: 'player', actorId: null, sessionId: null, authMethod: 'anonymous' };
    }
    const jwtCheck = this.verifyJWT(token);
    if (jwtCheck.valid && jwtCheck.claims) {
      const role = jwtCheck.claims.role === 'referee' ? 'referee' : 'player';
      return {
        role,
        actorId: jwtCheck.claims.sub ?? null,
        sessionId: jwtCheck.claims.sid ?? null,
        authMethod: 'jwt-es256'
      };
    }
    if (timingSafeStringMatch(token, REFREE_SECRET)) {
      return { role: 'referee', actorId: 'referee', sessionId: null, authMethod: 'bearer-secret' };
    }
    return { role: 'player', actorId: null, sessionId: null, authMethod: 'invalid-token' };
  }

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
    return this.getAuthContext(req).role;
  }

  getAuthContext(req) {
    const authHeader = req?.headers?.['authorization'];
    if (!authHeader) {
      return { role: 'player', actorId: null, sessionId: null, authMethod: 'anonymous' };
    }
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return { role: 'player', actorId: null, sessionId: null, authMethod: 'anonymous' };
    }
    return this.resolveTokenAuth(match[1]);
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
    return this.resolveTokenAuth(registrationMsg.token).role === 'referee';
  }
}

module.exports = new PermissionService();
