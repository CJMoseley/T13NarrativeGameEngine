/**
 * NarrativeWriteFlowHandler.js
 *
 * Intercepts raw player narrative intent, translates it into structured payloads,
 * validates it against the PermissionService gatekeeper, and performs the state mutations.
 *
 * Flow: Raw Intent -> Structured Payload -> PermissionCheck -> State Mutation.
 */

const PermissionService = require('./PermissionService');
const StateStore = require('./StateStore');

class NarrativeWriteFlowHandler {
  /**
   * Main entry point to process narrative writes safely.
   * @param {'player' | 'referee'} userRole - Role requesting the mutation
   * @param {object | string} rawIntent - Raw narrative input or request payload
   * @returns {object} Result of the flow
   */
  handleNarrativeIntent(userRole, rawIntent) {
    // 1. Raw Intent -> Translate into Structured Payload (Safe Extracted Input)
    const structuredPayload = this.translateIntentToPayload(rawIntent, userRole);

    // 2. PermissionCheck via central PermissionService
    let isAuthorized = true;
    for (const execution of structuredPayload.actionsToExecute) {
      const permitted = PermissionService.canWrite(
        userRole,
        execution.targetResource,
        execution.action
      );
      if (!permitted) {
        isAuthorized = false;
        break;
      }
    }

    // 3. State Mutation (only executed if permitted)
    if (isAuthorized) {
      const mutationsResult = {};
      for (const execution of structuredPayload.actionsToExecute) {
        if (execution.targetResource === 'state') {
          mutationsResult.state = StateStore.updateState(execution.payload);
        } else if (execution.targetResource === 'characters' && execution.action === 'create') {
          mutationsResult.character = StateStore.createCharacter(execution.payload);
        }
      }

      return {
        success: true,
        message: 'Narrative write flow executed successfully.',
        structuredPayload,
        authorized: true,
        mutationsResult
      };
    } else {
      return {
        success: false,
        error: `PermissionService blocked raw narrative intent from role: '${userRole}'. Direct state mutations are prohibited.`,
        structuredPayload,
        authorized: false
      };
    }
  }

  /**
   * Safe property extractor that filters and sanitizes unvalidated objects.
   * Prevents blind JSON stringification or nested object reference leak.
   * @param {any} input
   * @returns {object | string}
   */
  extractSafeProperties(input) {
    if (!input) {
      return '';
    }

    if (typeof input !== 'object') {
      return typeof input === 'string' ? input.slice(0, 500) : String(input);
    }

    const safeObj = {};
    const allowedStringKeys = ['currentLocation', 'activeScene', 'resolutionStatus', 'name', 'id', 'charType'];
    const allowedNumberKeys = ['tension', 'yarnPoints', 'scaleModifier'];
    const allowedArrayKeys = ['facets', 'proficiencies', 'boons', 'hitches'];

    for (const key of allowedStringKeys) {
      if (typeof input[key] === 'string') {
        safeObj[key] = input[key].slice(0, 250);
      }
    }

    for (const key of allowedNumberKeys) {
      if (typeof input[key] === 'number' && !isNaN(input[key])) {
        safeObj[key] = input[key];
      }
    }

    for (const key of allowedArrayKeys) {
      if (Array.isArray(input[key])) {
        safeObj[key] = input[key].map(item => {
          if (typeof item === 'string') {
            return item.slice(0, 100);
          }
          if (typeof item === 'number') {
            return item;
          }
          if (item && typeof item === 'object') {
            return {
              name: typeof item.name === 'string' ? item.name.slice(0, 100) : undefined,
              facet: typeof item.facet === 'string' ? item.facet.slice(0, 100) : undefined,
              value: typeof item.value === 'number' ? item.value : undefined
            };
          }
          return null;
        }).filter(item => item !== null);
      }
    }

    return safeObj;
  }

  /**
   * Translates raw, unvalidated input/intent into a clean structured payload.
   * @param {any} rawIntent
   * @param {string} userRole
   * @returns {object}
   */
  translateIntentToPayload(rawIntent, userRole) {
    // Sanitize and extract only explicitly allowed properties
    const safeData = this.extractSafeProperties(rawIntent);

    // Create standard structured payload containing explicit target resources and actions
    const payload = {
      timestamp: new Date().toISOString(),
      metadata: {
        sourceRole: userRole,
        analyzerType: 'NarrativeWriteFlowHandler_V2_Safe'
      },
      actionsToExecute: []
    };

    if (typeof safeData === 'object' && safeData !== null) {
      payload.originalIntent = safeData;

      if (safeData.currentLocation || safeData.tension || safeData.activeScene) {
        payload.actionsToExecute.push({
          targetResource: 'state',
          action: 'update',
          payload: {
            currentLocation: safeData.currentLocation || undefined,
            activeScene: safeData.activeScene || undefined,
            tension: typeof safeData.tension === 'number' ? safeData.tension : undefined,
            yarnPoints: typeof safeData.yarnPoints === 'number' ? safeData.yarnPoints : undefined,
            resolutionStatus: safeData.resolutionStatus || undefined
          }
        });
      }

      if (safeData.name && (safeData.facets || safeData.proficiencies)) {
        payload.actionsToExecute.push({
          targetResource: 'characters',
          action: 'create',
          payload: safeData
        });
      }
    } else if (typeof safeData === 'string' && safeData.length > 0) {
      payload.originalIntent = safeData;

      // String fallbacks - progress tension or active scenes
      payload.actionsToExecute.push({
        targetResource: 'state',
        action: 'update',
        payload: {
          activeScene: `scene_progressed_by_${userRole}`,
          tension: 0.25 // small increase for raw narrative prompt
        }
      });
    }

    // Default action to execute if empty
    if (payload.actionsToExecute.length === 0) {
      payload.actionsToExecute.push({
        targetResource: 'state',
        action: 'update',
        payload: {
          lastNarrativeLog: `Raw intent logged cleanly.`
        }
      });
    }

    return payload;
  }
}

module.exports = new NarrativeWriteFlowHandler();
