import Logger from "/src/t13ne/core/Logger.js";

/**
 * Visualizer for T13NE Action Spaces and Psychosocial Spaces.
 * Renders a graph representation using SVG.
 */
class T13NE_SpaceVisualizer {
    constructor() {
        this.container = null;
        this.svg = null;
        this.width = 800;
        this.height = 600;
        this.currentSpace = null;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.initialized = false;
        this.unitScale = 20; // Pixels per space unit
    }

    /**
     * Initializes the visualizer, creating DOM elements if necessary.
     * @param {string} [containerId] - Optional ID of an existing container.
     */
    initialize(containerId) {
        if (this.initialized) return;

        if (containerId) {
            this.container = document.getElementById(containerId);
        }
        
        if (!this.container) {
            // Create a default overlay container
            this.container = document.createElement('div');
            this.container.id = 't13ne-space-visualizer';
            this.container.style.position = 'absolute';
            this.container.style.top = '0';
            this.container.style.left = '0';
            this.container.style.width = '100%';
            this.container.style.height = '100%';
            this.container.style.pointerEvents = 'none'; // Allow clicks through
            this.container.style.zIndex = '9999';
            this.container.style.display = 'none'; // Hidden by default
            document.body.appendChild(this.container);
        }

        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;

        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("width", "100%");
        this.svg.setAttribute("height", "100%");
        this.svg.style.pointerEvents = 'none'; // Allow clicks through background
        this.container.appendChild(this.svg);

        this.initialized = true;
        Logger.message('T13NE_SpaceVisualizer: Initialized.');
    }

    /**
     * Sets the current space to visualize.
     * @param {object} space - An ActionSpace or PsychosocialSpace instance.
     */
    setSpace(space) {
        this.currentSpace = space;
        this.render();
        this.show();
    }

    /**
     * Shows the visualizer container.
     */
    show() {
        if (this.container) this.container.style.display = 'block';
    }

    /**
     * Hides the visualizer container.
     */
    hide() {
        if (this.container) this.container.style.display = 'none';
    }

    /**
     * Clears the SVG content.
     */
    clear() {
        if (this.svg) {
            while (this.svg.firstChild) {
                this.svg.removeChild(this.svg.firstChild);
            }
        }
    }

    /**
     * Renders the current space.
     */
    render() {
        if (!this.currentSpace || !this.svg) return;

        this.clear();

        // Center the graph
        const centerX = this.width / 2 + this.offsetX;
        const centerY = this.height / 2 + this.offsetY;

        const mapGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        mapGroup.setAttribute("transform", `translate(${centerX}, ${centerY}) scale(${this.scale})`);
        mapGroup.style.pointerEvents = 'all'; // Enable interaction on elements
        this.svg.appendChild(mapGroup);

        // 1. Render Links (Connections)
        if (this.currentSpace.type === 'Psychosocial' && this.currentSpace.links) {
            this.currentSpace.links.forEach(link => {
                this._renderLink(mapGroup, link);
            });
        }

        // 2. Render States/Nodes
        if (this.currentSpace.type === 'Psychosocial' && this.currentSpace.states) {
            this.currentSpace.states.forEach(state => {
                this._renderState(mapGroup, state);
            });
        }

        // 3. Render Entities (Characters)
        if (this.currentSpace.entities) {
            this.currentSpace.entities.forEach((data, id) => {
                // Skip states if they are stored in entities (PsychosocialSpace does this)
                if (data.entity.type !== 'PsychosocialState') {
                    this._renderEntity(mapGroup, data);
                }
            });
        }
    }

    _renderState(group, state) {
        const x = (state.position?.x || 0) * this.unitScale;
        const y = (state.position?.y || 0) * this.unitScale;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", `translate(${x}, ${y})`);
        g.setAttribute("class", "t13ne-state-node");
        g.style.cursor = 'pointer';

        // Node Circle
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "25");
        circle.setAttribute("fill", "#2c3e50");
        circle.setAttribute("stroke", "#ecf0f1");
        circle.setAttribute("stroke-width", "2");
        circle.setAttribute("opacity", "0.8");

        // Label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("y", "5");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#ecf0f1");
        text.setAttribute("font-size", "10px");
        text.setAttribute("font-family", "sans-serif");
        text.style.pointerEvents = 'none';
        
        // Simple text wrapping or truncation
        const label = state.name.length > 10 ? state.name.substring(0, 9) + '...' : state.name;
        text.textContent = label;

        // Tooltip title
        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `${state.name}\n${state.description || ''}`;

        g.appendChild(circle);
        g.appendChild(text);
        g.appendChild(title);
        group.appendChild(g);
    }

    _renderLink(group, link) {
        const fromState = this.currentSpace.states.get(link.from);
        const toState = this.currentSpace.states.get(link.to);

        if (fromState && toState) {
            const x1 = (fromState.position?.x || 0) * this.unitScale;
            const y1 = (fromState.position?.y || 0) * this.unitScale;
            const x2 = (toState.position?.x || 0) * this.unitScale;
            const y2 = (toState.position?.y || 0) * this.unitScale;

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x1);
            line.setAttribute("y1", y1);
            line.setAttribute("x2", x2);
            line.setAttribute("y2", y2);
            line.setAttribute("stroke", "#7f8c8d");
            line.setAttribute("stroke-width", Math.max(1, link.strength || 1));
            line.setAttribute("stroke-opacity", "0.6");
            
            group.appendChild(line);
        }
    }

    _renderEntity(group, data) {
        const x = (data.x || 0) * this.unitScale;
        const y = (data.y || 0) * this.unitScale;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", `translate(${x}, ${y})`);
        g.setAttribute("class", "t13ne-entity-node");

        // Entity Marker (Square for now to distinguish from states)
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", "-10");
        rect.setAttribute("y", "-10");
        rect.setAttribute("width", "20");
        rect.setAttribute("height", "20");
        rect.setAttribute("fill", "#e74c3c");
        rect.setAttribute("stroke", "#fff");
        rect.setAttribute("stroke-width", "1");
        rect.setAttribute("rx", "4");

        // Label above
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("y", "-15");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#e74c3c");
        text.setAttribute("font-size", "12px");
        text.setAttribute("font-weight", "bold");
        text.setAttribute("font-family", "sans-serif");
        text.style.textShadow = "0px 0px 2px black";
        text.textContent = data.entity.name;

        g.appendChild(rect);
        g.appendChild(text);
        group.appendChild(g);
    }

    /**
     * Updates the visualization. Call this when positions change.
     */
    update() {
        this.render();
    }
}

export default new T13NE_SpaceVisualizer();






