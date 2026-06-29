/* LEGACY CODE - MOVED TO src/t13ne/core/ui/

/**
 * Ship Interior View
 *
 * Renders a 2D grid representing the ship's interior and the components placed within it.
 */
import Logger from '../core/Logger.js';

export class ShipInteriorView {
    constructor(ship) {
        const funcName = 'ShipInteriorView.constructor';
        Logger.start(funcName);
        this.ship = ship;
        this.uiElement = this.createUIContainer();
        Logger.end(funcName);
    }

    createUIContainer() {
        const funcName = 'ShipInteriorView.createUIContainer';
        Logger.start(funcName);
        const container = document.createElement('div');
        container.id = 'shipInteriorView';
        container.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 10px;
            width: 200px;
            height: 200px;
            background: #000000AA;
            border: 1px solid #0f0;
            display: grid;
            grid-template-columns: repeat(${this.ship.interior.width}, 1fr);
            grid-template-rows: repeat(${this.ship.interior.height}, 1fr);
        `;
        document.body.appendChild(container);
        Logger.end(funcName);
        return container;
    }

    init() {
        const funcName = 'ShipInteriorView.init';
		Logger.start(funcName);
        this.update();
        Logger.end(funcName);
    }

    update() {
        this.uiElement.innerHTML = ''; // Clear the view
        for (let i = 0; i < this.ship.interior.grid.length; i++) {
            const tile = document.createElement('div');
            tile.style.cssText = `
                border: 1px solid #0f0;
                box-sizing: border-box;
            `;
            const componentId = this.ship.interior.grid[i];
            if (componentId) {
                const component = this.ship.components.find(c => c.instanceID === componentId);
                tile.style.background = '#0f0';
                tile.title = component.definition.name;
            }
            this.uiElement.appendChild(tile);
        }
    }

    toggleVisibility() {
        const funcName = 'ShipInteriorView.toggleVisibility';
        Logger.start(funcName);
        const isVisible = this.uiElement.style.display !== 'none';
        this.uiElement.style.display = isVisible ? 'none' : 'block';
        Logger.message(`ShipInteriorView visibility set to ${this.uiElement.style.display}`);
        Logger.end(funcName);
    }
}

*/