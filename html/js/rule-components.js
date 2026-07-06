import * as Gematria from '../../src/t13ne/modules/world/t13ne-gematria.js';
import T13Boons from '../../src/t13ne/modules/mechanics/t13ne-boon.js';

/**
 * T13 Rulebook Components
 * Author: CJ Moseley (https://www.cjmoseley.co.uk)
 */

class T13BoonTable extends HTMLElement {
    async connectedCallback() {
        const min = parseInt(this.getAttribute('min') || 1);
        const max = parseInt(this.getAttribute('max') || 26);
        try {
            this.innerHTML = await T13Boons.boonTable(min, max);
        } catch (e) {
            this.innerHTML = '<p class="error">Error loading Boon Table.</p>';
        }
    }
}

class T13GematriaCalc extends HTMLElement {
    connectedCallback() {
        const name = this.getAttribute('name') || '';
        this.render(name);
    }
    render(name) {
        this.innerHTML = `
            <div class="gematria-widget creator-widget">
                <h3>Geometry Calculator</h3>
                <div class="input-group">
                    <label for="gem-in">Name:</label>
                    <input type="text" id="gem-in" value="${name}">
                    <button class="ui-button" id="calc-gem">Calculate</button>
                </div>
                <div id="gem-res" class="creator-preview">
                    <p>Enter a name to calculate Character Geometry.</p>
                </div>
            </div>`;
        const input = this.querySelector('#gem-in');
        const result = this.querySelector('#gem-res');
        const update = () => {
            const val = input.value;
            const geo = Gematria.calculateValue(val);
            result.innerHTML = `<p>Geometry for <strong>${val}</strong>: <span class="t13ne-boon">${geo}</span></p>`;
        };
        this.querySelector('#calc-gem').addEventListener('click', update);
        if (name) update();
    }
}

class T13CardSpread extends HTMLElement {
    connectedCallback() {
        const type = this.getAttribute('spread') || 'simple';
        const handsize = parseInt(this.getAttribute('handsize') || 5);
        this.render(type, handsize);
    }
    render(type, handsize) {
        let cardsHtml = '';
        for (let i = 0; i < handsize; i++) {
            cardsHtml += `<div class="t13-card face-down" title="Card ${i+1}"></div>`;
        }
        this.innerHTML = `
            <div class="spread-container creator-widget">
                <h3>${type.toUpperCase()} SPREAD</h3>
                <div class="card-spread">${cardsHtml}</div>
                <div class="spread-controls">
                    <button class="ui-button deal-btn">Redeal Spread</button>
                    <button class="ui-button reveal-btn">Reveal Cards</button>
                </div>
            </div>`;
        this.querySelector('.deal-btn').addEventListener('click', () => {
            const cards = this.querySelectorAll('.t13-card');
            cards.forEach((c, idx) => {
                c.classList.add('face-down');
                c.style.animationDelay = `${idx * 0.1}s`;
                c.classList.remove('dealing');
                void c.offsetWidth;
                c.classList.add('dealing');
            });
        });
        this.querySelector('.reveal-btn').addEventListener('click', () => {
            this.querySelectorAll('.t13-card').forEach(c => c.classList.remove('face-down'));
        });
    }
}

class T13CharacterCreator extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="creator-widget character-creator">
                <h3>Character Creation Tool</h3>
                <div class="creator-tabs">
                    <button class="tab-link active" data-tab="identity">Identity</button>
                    <button class="tab-link" data-tab="annexes">Annexes & Profs</button>
                    <button class="tab-link" data-tab="hitches">Hitches</button>
                </div>
                <div id="creator-identity" class="tab-content active">
                    <div class="input-group">
                        <label>Name: <input type="text" id="char-name" placeholder="Enter Name"></label>
                    </div>
                    <div class="input-group">
                        <label>Tier:
                            <select id="char-tier">
                                <option value="fresh">Fresh</option>
                                <option value="veteran">Veteran</option>
                                <option value="elite">Elite</option>
                            </select>
                        </label>
                    </div>
                </div>
                <div id="creator-annexes" class="tab-content">
                    <p>Build Skills, Talents and Powers here.</p>
                    <button class="ui-button-small ui-button">Add Proficiency</button>
                    <button class="ui-button-small ui-button">Create Annex</button>
                    <div class="mini-list" id="annex-list">None yet.</div>
                </div>
                <div id="creator-hitches" class="tab-content">
                    <p>Manage quirks, flaws, and woes.</p>
                    <button class="ui-button-small ui-button">Add Hitch</button>
                </div>
                <div class="creator-actions">
                    <button class="ui-button" id="gen-char">Finalize Character Shell</button>
                </div>
                <div id="char-preview" class="creator-preview"></div>
            </div>`;

        this.querySelectorAll('.tab-link').forEach(btn => {
            btn.addEventListener('click', () => {
                this.querySelectorAll('.tab-link, .tab-content').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
                this.querySelector('#creator-' + btn.dataset.tab).classList.add('active');
            });
        });

        this.querySelector('#gen-char').addEventListener('click', () => {
            const name = this.querySelector('#char-name').value || 'Unnamed';
            const geo = Gematria.calculateValue(name);
            this.querySelector('#char-preview').innerHTML = `<h4>${name}</h4><p>Geometry: ${geo}</p><p class="muted">Template Generated.</p>`;
        });
    }
}

customElements.define('t13-boon-table', T13BoonTable);
customElements.define('t13-gematria-calc', T13GematriaCalc);
customElements.define('t13-card-spread', T13CardSpread);
customElements.define('t13-character-creator', T13CharacterCreator);
