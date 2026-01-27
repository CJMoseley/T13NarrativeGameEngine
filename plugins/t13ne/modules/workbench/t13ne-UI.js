import Logger from '@plugins/t13ne/core/Logger.js';

/**
 * T13NE UI Factory and Shared Components
 */
class T13NE_UI {
    constructor() {
        this.registry = new Map();
        this.modalOverlay = null;
        this.notificationElement = null;
    }

    /**
     * Registers a UI handler for a specific entity type.
     * @param {string} type
     * @param {object} handler
     */
    register(type, handler) {
        this.registry.set(type, handler);
        Logger.message(`UI: Registered handler for ${type}`);
    }

    /**
     * Renders an entity using its registered handler.
     * @param {object} entity
     * @param {HTMLElement} container
     * @param {string} viewType - 'card', 'inspector', 'form'
     */
    render(entity, container, viewType = 'card', options = {}) {
        const type = entity.constructor.name;
        const handler = this.registry.get(type);
        if (handler && handler.render) {
            return handler.render(entity, container, viewType, options);
        }
        // Fallback or generic rendering
        return this.renderGeneric(entity, container, viewType);
    }

    getHandler(type) {
        return this.registry.get(type);
    }

    renderGeneric(obj, container, viewType) {
        if (viewType === 'card') {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `<strong>${obj.Name || obj.name || 'Unknown'}</strong>`;
            if (container) container.appendChild(div);
            return div;
        }
        return null;
    }

    // --- Shared Components ---

    /**
     * Shows a modal dialog.
     */
    showModal(title, contentHtml, onConfirm, confirmText = 'Confirm') {
        if (!this.modalOverlay) {
            this.modalOverlay = document.getElementById('modal-overlay');
        }

        const titleEl = document.getElementById('modal-title');
        const bodyEl = document.getElementById('modal-body');
        const submitBtn = document.getElementById('modal-submit');

        titleEl.textContent = title;
        bodyEl.innerHTML = contentHtml;
        submitBtn.textContent = confirmText;

        this.modalOverlay.classList.add('active');

        submitBtn.onclick = () => {
            if (onConfirm) onConfirm();
            this.closeModal();
        };
    }

    closeModal() {
        if (this.modalOverlay) {
            this.modalOverlay.classList.remove('active');
        }
    }

    /**
     * Shows a notification message.
     */
    notify(msg, type = 'success') {
        if (!this.notificationElement) {
            this.notificationElement = document.getElementById('notification');
        }

        if (this.notificationElement) {
            this.notificationElement.textContent = msg;
            this.notificationElement.className = `notification active ${type}`;
            setTimeout(() => this.notificationElement.classList.remove('active'), 3000);
        }
    }

    /**
     * Utility for building dropdowns (simplified).
     */
    createDropdown(label, items) {
        // Implementation for dynamic dropdowns if needed
    }

    /**
     * Shared drag and drop logic
     */
    setupDraggable(element, data) {
        element.setAttribute('draggable', true);
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify(data));
            element.classList.add('dragging');
        });
        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
        });
    }

    setupDropZone(element, onDrop) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('drag-over');
        });
        element.addEventListener('dragleave', () => {
            element.classList.remove('drag-over');
        });
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (onDrop) onDrop(data);
        });
    }
}

const ui = new T13NE_UI();
export default ui;
