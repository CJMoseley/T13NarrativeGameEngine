/**
 * Wormhole Racers Engineer's Console UI
 * Purpose: Provides the player interface for toggling ship components on/off and monitoring
 * the dynamic power balance (Generation vs. Drain). Will eventually be a surface inside the 3d environment of the ship
 * at the moment this is little more than a test that ship systems are functional.
 *
 *
 */
import { ComponentDefs } from '../procgen/ships/components/ComponentDefs.js';
import Logger from '../Logger.js';
import { ShipInteriorView } from './ShipInteriorView.js';

export class EngineersConsole {
	constructor(engine, ship) {
		const funcName = 'EngineersConsole.constructor';
		Logger.start(funcName);
		this.engine = engine;
		this.ship = ship;
		this.shipInteriorView = new ShipInteriorView(ship);
		this.uiElement = null;
        this.powerStatusElement = null;
        this.componentListElement = null;
		Logger.end(funcName);
	}

	init() {
		const funcName = 'EngineersConsole.init';
		Logger.start(funcName);
        this.uiElement = this.createUIContainer();
		this.uiElement.innerHTML = '<h3>Engineer\'s Console</h3><div id="powerStatus"></div><hr><h4>Components:</h4><div id="componentList"></div><button id="toggleInteriorView">Toggle Interior</button>';
		this.powerStatusElement = this.uiElement.querySelector('#powerStatus');
		this.componentListElement = this.uiElement.querySelector('#componentList');
		this.uiElement.querySelector('#toggleInteriorView').onclick = () => this.shipInteriorView.toggleVisibility();
        this.shipInteriorView.init(); // Initialize the child view as well
		Logger.end(funcName);
	}

	createUIContainer() {
		const funcName = 'EngineersConsole.createUIContainer';
		Logger.start(funcName);
		const container = document.createElement('div');
		container.id = 'engineerConsole';
		container.style.cssText = 'position: absolute; top: 10px; right: 10px; color: #0f0; background: #000000AA; padding: 10px; border: 1px solid #0f0; display: none;';
		document.body.appendChild(container);
		Logger.end(funcName);
		return container;
	}

	toggleVisibility() {
		const funcName = 'EngineersConsole.toggleVisibility';
		Logger.start(funcName);
        const isVisible = this.uiElement.style.display === 'block';
		this.uiElement.style.display = isVisible ? 'none' : 'block';
		this.shipInteriorView.toggleVisibility();
		Logger.end(funcName, `Visibility set to ${this.uiElement.style.display}`);
	}

	update() {
		if (this.uiElement.style.display !== 'block') return;

		const funcName = 'EngineersConsole.update';
		Logger.start(funcName);

		this.shipInteriorView.update();
		const status = this.ship.powerStatus;
		let color = status.balance >= 0 ? '#0f0' : '#f00';
		this.powerStatusElement.innerHTML = `
            <span style="color:${color};">BALANCE: ${status.balance}</span>
            (Gen: ${status.generation} / Drain: ${status.drain})
        `;

		this.componentListElement.innerHTML = '';
		this.ship.components.forEach(instance => {
			const definition = instance.definition;
			const item = document.createElement('div');
			if (definition) {
				item.innerHTML = `
                    <input type="checkbox" id="comp-${instance.instanceID}" ${instance.isActive ? 'checked' : ''}>
                    <label for="comp-${instance.instanceID}" style="color:${instance.isDamaged ? '#f90' : '#fff'};">
                        [${instance.isDamaged ? 'DAMAGED' : 'OK'}] ${definition.name}
                    </label>
                `;
			} else {
				item.innerHTML = `<div>Loading component...</div>`;
			}
			this.componentListElement.appendChild(item);
		});
		Logger.end(funcName);
	}
}
