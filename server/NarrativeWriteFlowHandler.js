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
    // 1. Raw Intent -> Translate into Structured Payload
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
   * Translates raw, unvalidated input/intent into a clean structured payload.
   * @param {any} rawIntent
   * @param {string} userRole
   * @returns {object}
   */
  translateIntentToPayload(rawIntent, userRole) {
    const rawString = typeof rawIntent === 'string' ? rawIntent : JSON.stringify(rawIntent);

    // Create standard structured payload containing explicit target resources and actions
    const payload = {
      timestamp: new Date().toISOString(),
      originalIntent: rawIntent,
      metadata: {
        sourceRole: userRole,
        analyzerType: 'NarrativeWriteFlowHandler_V1'
      },
      actionsToExecute: []
    };

    // Determine targeted mutations based on properties of the intent
    if (typeof rawIntent === 'object') {
      if (rawIntent.currentLocation || rawIntent.tension || rawIntent.activeScene) {
        payload.actionsToExecute.push({
          targetResource: 'state',
          action: 'update',
          payload: {
            currentLocation: rawIntent.currentLocation || undefined,
            activeScene: rawIntent.activeScene || undefined,
            tension: typeof rawIntent.tension === 'number' ? rawIntent.tension : undefined,
            yarnPoints: typeof rawIntent.yarnPoints === 'number' ? rawIntent.yarnPoints : undefined,
            resolutionStatus: rawIntent.resolutionStatus || undefined
          }
        });
      }

      if (rawIntent.name && (rawIntent.facets || rawIntent.proficiencies)) {
        payload.actionsToExecute.push({
          targetResource: 'characters',
          action: 'create',
          payload: rawIntent
        });
      }
    } else if (typeof rawIntent === 'string') {
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
          lastNarrativeLog: `Raw intent logged: ${rawString.slice(0, 100)}`
        }
      });
    }

    return payload;
  }
}

module.exports = new NarrativeWriteFlowHandler();
