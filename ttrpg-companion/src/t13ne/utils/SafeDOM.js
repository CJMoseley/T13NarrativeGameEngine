/**
 * Utility for safe DOM manipulation to prevent XSS.
 */
export const SafeDOM = {
    /**
     * Escapes HTML special characters.
     */
    escape(str) {
        if (typeof str !== 'string') return String(str);
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Creates an element with sanitized content.
     */
    el(tag, props = {}, children = []) {
        const element = document.createElement(tag);
        for (const [key, value] of Object.entries(props)) {
            if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.substring(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        }
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        } else if (typeof children === 'string') {
            element.textContent = children;
        }
        return element;
    }
};
