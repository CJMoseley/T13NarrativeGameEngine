import * as THREE from 'three';
import Logger from '/src/t13ne/core/Logger.js';
import { T13Scene } from '/src/t13ne/core/T13Scene.js';
import T13NE_SocialOrdeals from '/src/t13ne/modules/systems/ordeals/t13ne-social-ordeals.js';
import T13NE from '/src/t13ne/T13NE.js';

/**
 * DialogueScene
 * Handles social interactions and dialogue trees using T13 Social Ordeal rules.
 */
export class DialogueScene extends T13Scene {
    constructor(viewManager, sceneData) {
        super(viewManager, { ...sceneData, renderMode: '2d' });
        
        this.plot = sceneData.plot;
        this.participants = this.plot?.characters || [];
        this.currentActor = this.participants[0]; // Player usually
        this.currentTarget = this.participants[1]; // NPC usually
        
        this.dialogueHistory = [];
        this.ui = {
            container: null,
            textDisplay: null,
            optionsContainer: null,
            participantInfo: null
        };

        this.dialogueTree = {};

        // Initialize Psychosocial spaces if not present
        if (this.currentActor && !this.currentActor.psychosocialSpace) {
            this.currentActor.psychosocialSpace = T13NE_SocialOrdeals.createHexagonalMap(this.currentActor);
        }
        if (this.currentTarget && !this.currentTarget.psychosocialSpace) {
            this.currentTarget.psychosocialSpace = T13NE_SocialOrdeals.createHexagonalMap(this.currentTarget);
        }
    }

    async _prepare(onProgress) {
        await super.prepare(onProgress);
        
        // Ensure Social Ordeals module is initialized
        if (!T13NE_SocialOrdeals.initialized) {
            await T13NE_SocialOrdeals.initialize();
        }

        if (onProgress) onProgress({ status: 'Building Dialogue Tree...', percent: 0.5 });
        await this.generateDialogueTree();

        if (onProgress) onProgress({ status: 'Dialogue Ready', percent: 1.0 });
    }

    async generateDialogueTree() {
        const actions = T13NE_SocialOrdeals.actions;
        const aiService = T13NE.getModule('AIService');
        
        Logger.message(`DialogueScene: Generating full dialogue tree for ${this.participants.length} characters.`);

        // Pregenerate for all possible interactions
        for (const actor of this.participants) {
            this.dialogueTree[actor.id] = {};
            for (const target of this.participants) {
                if (actor.id === target.id) continue;
                
                this.dialogueTree[actor.id][target.id] = {};
                
                // For each action, generate multiple options
                for (const action of actions) {
                    this.dialogueTree[actor.id][target.id][action.Type] = await this.generateOptionsForAction(actor, target, action, aiService);
                }
            }
        }
        
        Logger.message("DialogueScene: Dialogue tree pregeneration complete.");
    }

    async generateOptionsForAction(actor, target, action, aiService) {
        const options = [];
        const numOptions = 3;

        // Try AI first
        if (aiService && aiService.config.provider !== 'mock') {
            const prompt = `Generate ${numOptions} dialogue options for ${actor.name} performing the T13 Ordeal Action: "${action.Type}" towards ${target.name}.
            Description: ${action.Description}
            
            Format as JSON array: [{"text": "Dialogue line", "flavor": "Style (e.g. Sincere, Aggressive)"}]`;
            
            try {
                const response = await aiService.generateText(prompt);
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return parsed.map(o => ({ ...o, actionType: action.Type }));
                }
            } catch (e) {
                Logger.warn(`DialogueScene: AI failed for action ${action.Type} from ${actor.name} to ${target.name}.`);
            }
        }

        // Fallback / Procedural generation
        const flavors = ['Direct', 'Nuanced', 'Intense'];
        for (let i = 0; i < numOptions; i++) {
            options.push({
                text: `${action.Type} line ${i + 1} from ${actor.name} to ${target.name}.`,
                flavor: flavors[i % flavors.length],
                actionType: action.Type
            });
        }
        return options;
    }

    onLoad() {
        super.onLoad();
        this.createDialogueUI();
        this.refreshDialogueOptions();
    }

    createDialogueUI() {
        const container = document.createElement('div');
        container.id = 'dialogue-scene-ui';
        Object.assign(container.style, {
            position: 'absolute',
            bottom: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            border: '2px solid #00ffff',
            padding: '20px',
            color: 'white',
            fontFamily: 'Orbitron, sans-serif',
            zIndex: '1000',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
        });

        const info = document.createElement('div');
        info.id = 'dialogue-info';
        info.style.fontSize = '0.9em';
        info.style.color = '#aaffaa';
        container.appendChild(info);
        this.ui.participantInfo = info;

        const textDisplay = document.createElement('div');
        textDisplay.id = 'dialogue-text';
        textDisplay.style.minHeight = '60px';
        textDisplay.style.fontSize = '1.1em';
        textDisplay.style.lineHeight = '1.4';
        container.appendChild(textDisplay);
        this.ui.textDisplay = textDisplay;

        const options = document.createElement('div');
        options.id = 'dialogue-options';
        options.style.display = 'flex';
        options.style.flexDirection = 'column';
        options.style.gap = '8px';
        container.appendChild(options);
        this.ui.optionsContainer = options;

        document.body.appendChild(container);
        this.ui.container = container;
        
        this.updateInfoDisplay();
    }

    updateInfoDisplay() {
        if (!this.currentTarget || !this.currentActor) return;
        
        const impression = this.currentTarget.impressions?.[this.currentActor.id]?.current || 0;
        const levelData = T13NE_SocialOrdeals.getSocialLevel(impression);
        
        const actorState = this.currentActor.psychosocialSpace?.currentState || 'None';
        const targetState = this.currentTarget.psychosocialSpace?.currentState || 'None';

        this.ui.participantInfo.innerHTML = `
            <strong>${this.currentActor.name}</strong> [${actorState}] speaking to <strong>${this.currentTarget.name}</strong> [${targetState}]<br>
            ${this.currentTarget.name}'s Impression of you: ${impression} (${levelData?.Impression || 'Neutral'})
        `;
    }

    async refreshDialogueOptions() {
        this.ui.optionsContainer.innerHTML = '';
        
        const allActions = T13NE_SocialOrdeals.actions;
        const availableActions = this.filterActions(allActions);

        // Limit number of action types shown
        const typeLimit = 4;
        const selectedTypes = availableActions.slice(0, typeLimit);

        selectedTypes.forEach(action => {
            const actionOptions = this.dialogueTree[this.currentActor.id]?.[this.currentTarget.id]?.[action.Type] || [];
            
            actionOptions.forEach(opt => {
                const btn = document.createElement('button');
                btn.innerHTML = `<span style="font-size:0.8em; color:#00ffff;">[${opt.flavor}]</span> ${opt.text}`;
                Object.assign(btn.style, {
                    backgroundColor: 'rgba(0, 50, 100, 0.8)',
                    border: '1px solid #00aaff',
                    color: 'white',
                    padding: '8px 15px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                    marginBottom: '5px'
                });
                btn.onmouseover = () => btn.style.backgroundColor = 'rgba(0, 100, 200, 0.8)';
                btn.onmouseout = () => btn.style.backgroundColor = 'rgba(0, 50, 100, 0.8)';
                btn.onclick = () => this.handleActionSelect(action, opt);
                this.ui.optionsContainer.appendChild(btn);
            });
        });
    }

    filterActions(actions) {
        // Dialogue tree extrapolation: 
        // 1. Check current Impression. Some actions might be unavailable if too low.
        const impression = this.currentTarget.impressions?.[this.currentActor.id]?.current || 0;
        const actorState = this.currentActor.psychosocialSpace?.currentState;
        const targetState = this.currentTarget.psychosocialSpace?.currentState;

        return actions.filter(action => {
            // Filter by Impression thresholds
            if (action.Type === 'Seduce' && impression < -2) return false;
            if (action.Type === 'Befriend' && impression < -5) return false;
            if (action.Type === 'Ask a Favour' && impression < 0) return false;
            if (action.Type === 'Command' && impression < 2) return false;

            // Filter by Psychosocial Space alignment
            // e.g. If target is 'Focused', 'Chat' might be less available or harder (but here we just filter visibility)
            if (targetState === 'Focused' && action.Type === 'Chat') return false;
            if (targetState === 'Mood' && action.Type === 'Explain') return false;
            
            // Geometry Harmony check (optional: filter out dissonant actions or just let them be hard)
            // For now, let's keep it simple.

            return true;
        });
    }

    async handleActionSelect(action, option) {
        this.ui.optionsContainer.innerHTML = '<em>Processing...</em>';
        
        // Perform invisible test
        const result = await T13NE_SocialOrdeals.performSocialAction(this.currentActor, this.currentTarget, action.Type);
        
        // Narrate result
        let responseText = `<div style="color:#00ffff; margin-bottom:5px;">&gt; ${option.text}</div>`;
        if (result.success) {
            responseText += `<strong>Success!</strong> ${this.currentTarget.name} reacted positively.`;
        } else {
            responseText += `<strong>Failure.</strong> ${this.currentTarget.name} was not impressed.`;
        }
        
        if (result.details && result.details.length > 0) {
            responseText += `<br><small style="color:#aaa">${result.details.join(' | ')}</small>`;
        }

        this.ui.textDisplay.innerHTML = responseText;
        
        // Narrative movement in Psychosocial space
        this.handlePsychosocialMovement(action, result);

        // Apply Emotional effects if applicable
        this.applyEmotionalEffects(result);

        this.updateInfoDisplay();
        
        // Check for resolution
        if (this.checkResolution()) {
             this.ui.optionsContainer.innerHTML = '';
             const resolveBtn = document.createElement('button');
             resolveBtn.innerText = "Resolution Reached";
             resolveBtn.onclick = () => this.resolveScene();
             this.ui.optionsContainer.appendChild(resolveBtn);
        } else {
            setTimeout(() => this.refreshDialogueOptions(), 1500);
        }
    }

    handlePsychosocialMovement(action, result) {
        if (!this.currentActor.psychosocialSpace || !this.currentTarget.psychosocialSpace) return;

        // Simplified movement logic
        if (action.Type === 'Argue' || action.Type === 'Convince') {
            this.currentActor.psychosocialSpace.moveToState(this.currentActor, 'Focused');
            this.currentTarget.psychosocialSpace.moveToState(this.currentTarget, 'Considering');
        } else if (action.Type === 'Chat' || action.Type === 'Befriend') {
            this.currentActor.psychosocialSpace.moveToState(this.currentActor, 'Socializing');
            this.currentTarget.psychosocialSpace.moveToState(this.currentTarget, 'Socializing');
        } else if (action.Type === 'Assess' || action.Type === 'Observe') {
            this.currentActor.psychosocialSpace.moveToState(this.currentActor, 'Aware');
        }

        Logger.message(`DialogueScene: Movement in psychosocial space due to '${action.Type}'.`);
    }

    applyEmotionalEffects(result) {
        if (!result.success) return;

        const impression = this.currentTarget.impressions?.[this.currentActor.id]?.current || 0;
        const levelData = T13NE_SocialOrdeals.getSocialLevel(impression);
        
        if (levelData && levelData.Response.includes('Positive Psych Effect')) {
             Logger.message(`DialogueScene: Gaining Positive Emotional Effect due to ${levelData.Type} impression.`);
             // Logic to add effect to actor
             if (!this.currentActor.effects) this.currentActor.effects = [];
             this.currentActor.effects.push({ type: 'Emotional', flavor: 'Confident', duration: 1 });
        }
    }

    checkResolution() {
        // Resolve if impression hits a threshold or goal achieved
        const impression = this.currentTarget.impressions?.[this.currentActor.id]?.current || 0;
        
        // Target goal check (from Plot)
        if (this.plot?.goal && impression >= 3) {
            // Assume if goal exists and they like us enough, we win
            return true;
        }

        if (impression >= 5) return true; // High Friendship
        if (impression <= -8) return true; // Violent Enmity
        
        return false;
    }

    async resolveScene() {
        Logger.message("DialogueScene: Resolving Scene Plot.");
        if (this.plot) {
            await this.plot.resolve('Resolution');
        }
        // Transition back to previous or next scene
        this.viewManager.showMainMenu(); // Fallback
    }

    onUnload() {
        super.onUnload();
        if (this.ui.container && this.ui.container.parentNode) {
            this.ui.container.parentNode.removeChild(this.ui.container);
        }
    }
}
