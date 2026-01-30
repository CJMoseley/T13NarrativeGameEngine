import { UIMessageTemplates } from './UIMessageTemplates.js';
import Logger from '../Logger.js';
import Localization from './Localization.js';

class UIMessage {
    constructor(viewManager) {
        this.viewManager = viewManager;
        this.gameEngine = viewManager.gameEngine;
        this.managedWindows = {}; // Use an object to store keyed windows
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        // Add keyboard shortcut listeners
        // Also, inject the stylesheet into the document head
        if (!document.getElementById('wormhole-racers-ui-styles')) {
            const link = document.createElement('link');
            link.id = 'wormhole-racers-ui-styles';
            link.rel = 'stylesheet';
            link.href = '/css/ui-styles.css'; // Corrected path to your new CSS file
            document.head.appendChild(link);
        }
        document.addEventListener('keydown', (event) => this.handleKeyPress(event));
        this.initialized = true;
    }

    showMessage(options) {
        this.init();
        Logger.message(`UIMessage: showMessage called for key: ${options.key || 'anonymous'}`);

        // If a key is provided, we manage this window specially.
        if (options.key) {
            if (this.managedWindows[options.key]) {
                const managedWindow = this.managedWindows[options.key];
                // Window exists, so update its element.
                this.updateWindow(managedWindow.element, options);
                // Update the onClose callback if a new one is provided
                if (options.onClose) {
                    managedWindow.onClose = options.onClose;
                }
                return managedWindow.element;
            } else {
                // Window doesn't exist, create it.
                const messageWindow = this.createWindow(options);
                this.managedWindows[options.key] = { element: messageWindow, onClose: options.onClose };
                this.viewManager.assignLayer(messageWindow, 'DIALOGUE');
                document.body.appendChild(messageWindow);
                requestAnimationFrame(() => {
                    messageWindow.style.opacity = '1';
                });
                return messageWindow;
            }
        } else {
            // For non-keyed (traditional) messages, close others and show the new one.
            this.closeAllWindows();
            const messageWindow = this.createWindow(options);
            document.body.appendChild(messageWindow);
            this.viewManager.assignLayer(messageWindow, 'DIALOGUE');
            requestAnimationFrame(() => {
                messageWindow.style.opacity = '1';
            });
            return messageWindow;
        }
    }

    closeMessage(key) {
        if (this.managedWindows[key]) {
            this.closeWindow(this.managedWindows[key].element);
        }
    }

    createWindow(options) {
        Logger.message(`UIMessage: createWindow called for title: ${options.title}`);
        // Create the window element
        const messageWindow = document.createElement('div');
        messageWindow.className = 'ui-message-window';

        // Initial fade state
        messageWindow.style.opacity = '0';
        messageWindow.style.transition = 'opacity 0.3s ease-in-out';

        // Add any additional custom classes for styling (e.g., for emergencies)
        if (options.customClass) {
            messageWindow.classList.add(...options.customClass.split(' '));
        }

        // Handle explicit positioning from options
        if (options.position) {
            // This ensures the element can be positioned via top/left.
            // The default CSS should already do this, but this is a safeguard.
            messageWindow.style.position = 'absolute';
            if (options.position.top) messageWindow.style.top = options.position.top;
            if (options.position.left) messageWindow.style.left = options.position.left;
        }

        // Store key and template info for potential updates
        messageWindow.dataset.key = options.key;
        messageWindow.dataset.template = options.template;

        // Add a title bar
        const titleBar = this.createTitleBar(options.title);
        messageWindow.appendChild(titleBar);

        // Add the content
        const content = this.createContent(options.template, options.data);
        messageWindow.appendChild(content);

        // Add an actions footer if actions are provided
        if (options.actions && options.actions.length > 0) {
            const footer = this.createFooter(options.actions, messageWindow);
            messageWindow.appendChild(footer);
        }

        // Add Progress Bar if requested
        if (options.showProgress) {
            const progressBar = document.createElement('div');
            progressBar.className = 'ui-message-progress-bar';
            progressBar.style.width = '100%';
            progressBar.style.height = '8px';
            progressBar.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            progressBar.style.marginTop = '10px';
            progressBar.style.borderRadius = '4px';
            progressBar.style.overflow = 'hidden';

            const progressFill = document.createElement('div');
            progressFill.className = 'ui-message-progress-fill';
            progressFill.style.width = `${Math.max(0, Math.min(100, (options.progress || 0) * 100))}%`;
            progressFill.style.height = '100%';
            progressFill.style.backgroundColor = '#00ffff';
            progressFill.style.transition = 'width 0.2s ease-out';

            progressBar.appendChild(progressFill);
            messageWindow.appendChild(progressBar);
        }

        // Make the window draggable
        this.makeDraggable(messageWindow, titleBar);

        return messageWindow;
    }

    updateWindow(messageWindow, options) {
        // Update Title
        const titleText = messageWindow.querySelector('.ui-message-title-bar > span');
        if (titleText) {
            titleText.textContent = options.title;
        }

        // Update Content
        const content = messageWindow.querySelector('.ui-message-content');
        if (content && UIMessageTemplates[messageWindow.dataset.template]) {
            content.innerHTML = ''; // Clear
            const result = UIMessageTemplates[messageWindow.dataset.template](options.data);
            if (result instanceof Node) {
                content.appendChild(result);
            } else {
                content.innerHTML = result;
            }
        } else if (content && options.data && options.data.message) {
            content.innerHTML = `<p>${options.data.message}</p>`;
        }

        // Update Progress
        if (options.progress !== undefined) {
            const progressFill = messageWindow.querySelector('.ui-message-progress-fill');
            if (progressFill) {
                progressFill.style.width = `${Math.max(0, Math.min(100, options.progress * 100))}%`;
            }
        }

        // If the window was minimized, restore it to show the new content
        messageWindow.classList.remove('minimized');

        // Note: This simple update doesn't re-create actions. Assumes they are static.
    }

    createTitleBar(title) {
        const titleBar = document.createElement('div');
        titleBar.className = 'ui-message-title-bar';

        const titleText = document.createElement('span');
        titleText.textContent = title;
        titleBar.appendChild(titleText);

        // Add minimize and close buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'ui-message-title-bar-buttons';
        buttonContainer.appendChild(this.createMinimizeButton());
        buttonContainer.appendChild(this.createCloseButton());
        titleBar.appendChild(buttonContainer);

        return titleBar;
    }

    createContent(template, data) {
        const contentElement = document.createElement('div');
        contentElement.className = 'ui-message-content';
        if (UIMessageTemplates[template]) {
            const result = UIMessageTemplates[template](data);
            if (result instanceof Node) {
                contentElement.appendChild(result);
            } else {
                contentElement.innerHTML = result;
            }
        } else if (data && data.message) {
            contentElement.innerHTML = `<p>${data.message}</p>`;
        } else {
            contentElement.innerHTML = `<p>Loading...</p>`;
        }
        return contentElement;
    }

    createFooter(actions, messageWindow) {
        const footer = document.createElement('div');
        footer.className = 'ui-message-footer';

        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'ui-message-action-button';
            button.textContent = action.label;
            button.onclick = () => {
                action.callback();
                this.closeWindow(messageWindow); // Automatically close window after action
            };
            footer.appendChild(button);
        });
        return footer;
    }

    createMinimizeButton() {
        const minimizeButton = document.createElement('button');
        minimizeButton.className = 'ui-message-title-bar-button';
        minimizeButton.textContent = '−'; // Use a proper minus sign for better alignment
        minimizeButton.addEventListener('click', this.handleMinimizeClick.bind(this));
        return minimizeButton;
    }

    createCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.className = 'ui-message-title-bar-button';
        closeButton.textContent = '✕'; // Use a better 'close' symbol
        closeButton.addEventListener('click', this.handleCloseClick.bind(this));
        return closeButton;
    }

    makeDraggable(element, handle) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        handle.addEventListener('mousedown', (event) => {
            // Prevent dragging from right-clicks
            if (event.button !== 0) return;

            isDragging = true;
            offsetX = event.clientX - element.offsetLeft;
            offsetY = event.clientY - element.offsetTop;

            // Add a class to the body to prevent text selection during drag
            document.body.classList.add('ui-dragging');
            handle.style.cursor = 'grabbing';
        });

        const onMouseMove = (event) => {
            if (isDragging) {
                // Calculate new position
                let newLeft = event.clientX - offsetX;
                let newTop = event.clientY - offsetY;

                // Constrain to viewport boundaries
                const maxX = window.innerWidth - element.offsetWidth;
                const maxY = window.innerHeight - element.offsetHeight;

                element.style.left = `${Math.max(0, Math.min(newLeft, maxX))}px`;
                element.style.top = `${Math.max(0, Math.min(newTop, maxY))}px`;
            }
        };

        const onMouseUp = () => {
            isDragging = false;
            // Remove the class to re-enable text selection
            document.body.classList.remove('ui-dragging');
            handle.style.cursor = 'grab';
        };

        // Listen on the document to allow dragging outside the window
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    handleMinimizeClick(event) {
        const messageWindow = event.target.closest('.ui-message-window');
        messageWindow.classList.toggle('minimized');
    }

    handleCloseClick(event) {
        const messageWindow = event.target.closest('.ui-message-window');
        if (messageWindow) {
            this.closeWindow(messageWindow);
        }
    }

    handleKeyPress(event) {
        const key = event.key.toLowerCase();
        // This logic might need refinement in a multi-window environment
        // For now, let's find the last-created managed window.
        const windowKeys = Object.keys(this.managedWindows); // This will need a better "active window" strategy later
        const activeWindow = this.managedWindows[windowKeys[windowKeys.length - 1]];

        if (activeWindow) {
            switch (key) {
                case 'o': // Open (doesn't make sense in this context, but here for completeness)
                    break;
                case 'm': // Minimize
                    this.handleMinimizeClick({ target: activeWindow.element });
                    break;
                case 'k': // Okay
                    this.closeWindow(activeWindow);
                    break;
                case 'n': // No/Dismiss
                    this.closeWindow(activeWindow);
                    break;
            }
        }
    }

    closeAllWindows() {
        Object.values(this.managedWindows).forEach(managedWindow => this.closeWindow(managedWindow.element));
    }

    closeWindow(messageWindow) {
        const key = messageWindow.dataset.key;
        if (key && this.managedWindows[key]) {
            const managedWindow = this.managedWindows[key];
            // If an onClose callback was provided, call it.
            if (managedWindow.onClose && typeof managedWindow.onClose === 'function') {
                managedWindow.onClose();
            }
            delete this.managedWindows[key];
        }

        // Fade out
        messageWindow.style.opacity = '0';

        // Remove after transition
        setTimeout(() => {
            if (messageWindow.parentElement) {
                messageWindow.remove();
            }
        }, 300);
    }
}

export { UIMessage };