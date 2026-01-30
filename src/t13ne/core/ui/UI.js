/**
 * UI Utility
 * Provides a lightweight createElement (CE) system and standard T13 UI patterns.
 */
export class UI {
    /**
     * Creates a DOM element with the given properties and children.
     * Mimics React.createElement but returns a real DOM element.
     * @param {string} tag - The HTML tag name.
     * @param {object} props - Attributes and event listeners.
     * @param {...any} children - Child elements or strings.
     * @returns {HTMLElement}
     */
    static CE(tag, props = {}, ...children) {
        const element = document.createElement(tag);

        for (const key in props) {
            if (key.startsWith('on') && typeof props[key] === 'function') {
                element.addEventListener(key.substring(2).toLowerCase(), props[key]);
            } else if (key === 'className') {
                element.className = props[key];
            } else if (key === 'style' && typeof props[key] === 'object') {
                Object.assign(element.style, props[key]);
            } else if (key === 'dangerouslySetInnerHTML') {
                element.innerHTML = props[key].__html;
            } else {
                element.setAttribute(key, props[key]);
            }
        }

        children.forEach(child => {
            if (child === null || child === undefined) return;
            if (Array.isArray(child)) {
                child.forEach(c => element.appendChild(this._ensureNode(c)));
            } else {
                element.appendChild(this._ensureNode(child));
            }
        });

        return element;
    }

    static _ensureNode(child) {
        if (child instanceof Node) return child;
        return document.createTextNode(String(child));
    }

    /**
     * Standard T13 ContentBox modular component.
     */
    static ContentBox(props, ...children) {
        const { title, className = '', dataType, description, rules } = props;

        return this.CE('section', { className: `t13ne-textbox ${className}` },
            title ? this.CE('header', { className: 't13ne-textbox-title' }, title) : null,
            dataType ? this.CE('footer', { className: 't13ne-textbox-type' }, dataType) : null,
            description ? this.CE('main', { className: 't13ne-textbox-description' }, description) : null,
            ...children,
            rules ? this.CE('aside', { className: 't13ne-textbox-rules' }, rules) : null
        );
    }
}
