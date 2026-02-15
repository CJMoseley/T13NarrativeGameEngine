import Logger from "/src/t13ne/core/Logger.js";
import { PsychosocialSpace } from './ActionSpaces/PsychosocialSpace.js';

/**
 * Module for handling T13NE Psychosocial Spaces.
 * Manages Mindscapes, Social Maps, and Abstract Territories.
 */
class T13NE_PsychosocialSpaces {
    constructor() {
        this.spaces = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        this.initialized = true;
        Logger.message('T13NE_PsychosocialSpaces: Initialized.');
    }

    /**
     * Creates a new Psychosocial Space.
     * @param {object} config 
     * @returns {PsychosocialSpace}
     */
    createSpace(config) {
        const space = new PsychosocialSpace(config);
        this.spaces.set(space.id, space);
        return space;
    }

    /**
     * Creates a standard Triangular Empathic Map for simple characters.
     * @param {object} character 
     */
    createTriangularMap(character) {
        const space = this.createSpace({
            name: `${character.name}'s Empathic Map`,
            subType: 'Private',
            owner: character.id
        });

        // Define States (Positions are abstract coordinates)
        space.addState({
            id: 'thoughts_feelings',
            name: 'Thoughts and Feelings',
            description: 'Internal state of processing emotions and logic.',
            facets: ['Temperament', 'Humour', 'Thoughts', 'Dreamscape'],
            position: { x: 0, y: 10, z: 0 }
        });

        space.addState({
            id: 'intentions_reactions',
            name: 'Intentions and Reactions',
            description: 'Acting and reacting towards goals.',
            facets: ['Wishes', 'Muscle-Memory', 'Secrets', 'Drives'],
            position: { x: -10, y: -10, z: 0 }
        });

        space.addState({
            id: 'beliefs_education',
            name: 'Beliefs and Education',
            description: 'Communicating beliefs or learning.',
            facets: ['Supernature', 'Folk', 'Masks', 'Knowledge'],
            position: { x: 10, y: -10, z: 0 }
        });

        // Connect them all
        space.connectStates('thoughts_feelings', 'intentions_reactions');
        space.connectStates('intentions_reactions', 'beliefs_education');
        space.connectStates('beliefs_education', 'thoughts_feelings');

        return space;
    }

    /**
     * Creates a Hexagonal Empathic Map for complex characters.
     * @param {object} character 
     */
    createHexagonalMap(character) {
        const space = this.createSpace({
            name: `${character.name}'s Mindscape`,
            subType: 'Private',
            owner: character.id
        });

        const radius = 10;
        const states = [
            { id: 'socializing', name: 'Socializing', facets: ['Folk', 'Masks', 'Secrets', 'Language'] },
            { id: 'mood', name: 'Mood', facets: ['Temperament', 'Humour', 'Sickness', 'Darkness'] },
            { id: 'considering', name: 'Considering', facets: ['Thoughts', 'Mental Defences', 'Judgement', 'Principles'] },
            { id: 'aware', name: 'Aware', facets: ['Perception', 'Supernature', 'Dreamscape', 'Arsenal'] },
            { id: 'focused', name: 'Focused', facets: ['Knowledge', 'Muscle-Memories', 'Memories', 'Broadness'] },
            { id: 'yearning', name: 'Yearning', facets: ['Urges', 'Wishes', 'Drives', 'Passions'] }
        ];

        states.forEach((s, i) => {
            const angle = (i / 6) * Math.PI * 2;
            space.addState({
                ...s,
                position: {
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius,
                    z: 0
                }
            });
        });

        // Connect adjacent states (Ring)
        for (let i = 0; i < states.length; i++) {
            const next = (i + 1) % states.length;
            space.connectStates(states[i].id, states[next].id);
        }

        // Add cross connections (Internal logic paths)
        space.connectStates('considering', 'focused');
        space.connectStates('yearning', 'socializing');
        space.connectStates('mood', 'aware');

        return space;
    }
}

export default new T13NE_PsychosocialSpaces();






