/* LEGACY CODE - MOVED TO src/t13ne/core/ui/

import Logger from '../../core/Logger.js';
import { EventBus } from '../../core/EventBus.js';

/**
 * ShipyardPanel Component
 *
 * This UI panel displays a list of available ship components
 * that the user can select to place in the shipyard.
 */
export class ShipyardPanel {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.viewManager = uiManager.viewManager;
        this.element = document.createElement('div');
        this.element.id = 'shipyardPanel';
        this.element.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            width: 250px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid #0f0;
            color: #0f0;
            padding: 10px;
            display: none; /* Initially hidden */
        `;

        this.availableComponents = [];

        this.init();
        document.getElementById('ui-layer').appendChild(this.element);
    }

    async init() {
        // Generate a list of procedural components to offer
        const mockCorporation = { name: "Star Systems Inc." };
        const componentTemplates = [
            { name: 'small_chassis' },
            { name: 'medium_chassis' },
            { name: 'basic_engine' },
            { name: 'basic_generator' },
        ];

        for (const template of componentTemplates) {
            const component = await this.viewManager.gameEngine.componentGenerator.generateComponent(template, mockCorporation, 'Human', 1);
            this.availableComponents.push(component);
        }

        this.render();
        this.addEventListeners();

        // Listen for when a component is placed to clear the selection
        EventBus.on('component:placed', () => {
            this.clearSelection();
        });
    }

    render() {
        let content = `
            <h2>Available Components</h2>
            <p style="font-size: 0.8em; color: #999; margin-top: -10px;">Select a component, then click on the floor to place it.</p>
            <ul>`;
        this.availableComponents.forEach((comp, index) => {
            content += `<li class="component-item" data-index="${index}" style="cursor: pointer;">${comp.name}</li>`;
        });
        content += '</ul>';
        this.element.innerHTML = content;
    }

    addEventListeners() {
        this.element.querySelectorAll('.component-item').forEach(item => {
            item.addEventListener('click', (event) => {
                const componentIndex = event.target.dataset.index;
                const component = this.availableComponents[componentIndex];
                this.viewManager.setActiveComponent(component);

                // Visual feedback for selection
                this.clearSelection();
                event.target.classList.add('selected');
                event.target.style.backgroundColor = '#0f0';
                event.target.style.color = '#000';
            });
        });
    }

    clearSelection() {
        this.element.querySelectorAll('.component-item').forEach(item => {
            item.classList.remove('selected');
            item.style.backgroundColor = '';
            item.style.color = '';
        });
    }

    show() {
        this.element.style.display = 'block';
        Logger.message("ShipyardPanel shown.");
    }

    hide() {
        this.element.style.display = 'none';
        Logger.message("ShipyardPanel hidden.");
    }
}

*/