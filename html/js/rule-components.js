import * as Gematria from '../../src/t13ne/modules/world/t13ne-gematria.js';
import T13Boons from '../../src/t13ne/modules/mechanics/t13ne-boon.js';

/**
 * T13 Rulebook Components
 * Author: CJ Moseley (https://www.cjmoseley.co.uk)
 * Integrated JS for rules, character, and plot creation.
 */

async function fetchCodexData(arrayName) {
    const paths = [
        `../../src/t13ne/data/json/ordeals/${arrayName}.json`,
        `../../src/t13ne/data/json/characters/${arrayName}.json`,
        `../../src/t13ne/data/json/drama/${arrayName}.json`,
        `../../src/t13ne/data/json/mechanics/${arrayName}.json`,
        `../../src/t13ne/data/json/other/${arrayName}.json`
    ];
    for (let path of paths) {
        try {
            const res = await fetch(path);
            if (res.ok) return await res.json();
        } catch (e) {}
    }
    return null;
}

class T13BoonTable extends HTMLElement {
    async connectedCallback() {
        this.innerHTML = '<p class="loading">Loading Boon Table...</p>';
        try {
            const min = parseInt(this.getAttribute('min') || 1);
            const max = parseInt(this.getAttribute('max') || 26);
            this.innerHTML = await T13Boons.boonTable(min, Math.min(max, 50));
        } catch (e) {
            this.innerHTML = '<p class="error">Interactive Boon Table unavailable.</p>';
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
            if (!val) return;
            const geo = Gematria.calculateValue(val);
            result.innerHTML = `<p>Geometry for <strong>${val}</strong>: <span class="t13ne-boon-badge">${geo}</span></p>`;
        };
        this.querySelector('#calc-gem').addEventListener('click', update);
        if (name) update();
    }
}

class T13DataTable extends HTMLElement {
    async connectedCallback() {
        const arrayName = this.getAttribute('array');
        const title = this.getAttribute('title') || arrayName;
        this.innerHTML = `<div class="creator-widget"><h3>${title}</h3><p class="loading">Fetching data...</p></div>`;
        const data = await fetchCodexData(arrayName);
        if (data) {
            let table = '<table class="t13ne-table"><thead><tr>';
            const keys = Object.keys(data[0] || {});
            keys.forEach(k => table += `<th>${k}</th>`);
            table += '</tr></thead><tbody>';
            data.forEach(row => {
                table += '<tr>';
                keys.forEach(k => table += `<td>${row[k]}</td>`);
                table += '</tr>';
            });
            table += '</tbody></table>';
            this.querySelector('.creator-widget').innerHTML = `<h3>${title}</h3>` + table;
        } else {
            this.innerHTML = `<p class="muted">Data table [${arrayName}] placeholder.</p>`;
        }
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
            cardsHtml += `<div class="t13-card face-down"></div>`;
        }
        this.innerHTML = `
            <div class="spread-container creator-widget">
                <h3>${type.toUpperCase()} SPREAD</h3>
                <div class="card-spread">${cardsHtml}</div>
                <div class="spread-controls">
                    <button class="ui-button deal-btn">Redeal</button>
                    <button class="ui-button reveal-btn">Reveal</button>
                </div>
            </div>`;
        this.querySelector('.deal-btn').addEventListener('click', () => {
            this.querySelectorAll('.t13-card').forEach((c, i) => {
                c.classList.add('face-down');
                c.style.animationDelay = `${i*0.1}s`;
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
    constructor() {
        super();
        this.state = { name: '', tier: 'fresh', profs: [], hitches: [], annexes: [] };
    }
    connectedCallback() { this.render(); }
    render() {
        this.innerHTML = `
            <div class="creator-widget character-creator">
                <h3>Character & Descendant Architect</h3>
                <div class="creator-tabs">
                    <button class="tab-link active" data-tab="identity">Identity</button>
                    <button class="tab-link" data-tab="annexes">Annexes & Profs</button>
                    <button class="tab-link" data-tab="hitches">Hitches</button>
                </div>
                <div id="creator-identity" class="tab-content active">
                    <div class="input-group"><label>Name: <input type="text" id="char-name" value="${this.state.name}"></label></div>
                </div>
                <div id="creator-annexes" class="tab-content">
                    <h4>Add Proficiencies</h4>
                    <div class="input-group"><input type="text" id="prof-in"><button class="ui-button" id="add-p">Add</button></div>
                    <ul class="mini-list">${this.state.profs.map(p => `<li>${p}</li>`).join('')}</ul>
                </div>
                <div id="creator-hitches" class="tab-content">
                    <h4>Add Hitches</h4>
                    <div class="input-group"><input type="text" id="hitch-in"><button class="ui-button" id="add-h">Add</button></div>
                    <ul class="mini-list">${this.state.hitches.map(h => `<li>${h}</li>`).join('')}</ul>
                </div>
                <button class="ui-button" id="finalize">Finalize Manifest</button>
                <div id="preview" class="creator-preview"></div>
            </div>`;
        this.setupEvents();
    }
    setupEvents() {
        this.querySelectorAll('.tab-link').forEach(b => b.addEventListener('click', () => {
            this.querySelectorAll('.tab-link, .tab-content').forEach(e => e.classList.remove('active'));
            b.classList.add('active');
            this.querySelector('#creator-'+b.dataset.tab).classList.add('active');
        }));
        this.querySelector('#add-p').addEventListener('click', () => {
            const v = this.querySelector('#prof-in').value;
            if(v) { this.state.profs.push(v); this.render(); }
        });
        this.querySelector('#add-h').addEventListener('click', () => {
            const v = this.querySelector('#hitch-in').value;
            if(v) { this.state.hitches.push(v); this.render(); }
        });
        this.querySelector('#finalize').addEventListener('click', () => {
            const name = this.querySelector('#char-name').value;
            this.querySelector('#preview').innerHTML = `<pre>${JSON.stringify({name, profs: this.state.profs, hitches: this.state.hitches}, null, 2)}</pre>`;
        });
    }
}

class T13FacetAspects extends HTMLElement {
    connectedCallback() {
        const aspect = this.getAttribute('aspect');
        this.innerHTML = `<div class="creator-widget"><h3>Facet ${aspect}</h3><p class="muted">Dynamically mapping Facet ${aspect}...</p></div>`;
    }
}

class T13PlotCreator extends HTMLElement {
    connectedCallback() {
        this.render();
    }
    render() {
        this.innerHTML = `
            <div class="creator-widget plot-weaver">
                <h3>Plot Weaver & Yarn Architect</h3>
                <div class="input-group">
                    <label>Plot Name: <input type="text" id="plot-name" placeholder="The Final Frontier..."></label>
                </div>
                <div class="input-group">
                    <label>Scale:
                        <select id="plot-scale">
                            <option value="scene">Scene (1-3 Cards)</option>
                            <option value="act" selected>Act (4-7 Cards)</option>
                            <option value="arc">Arc (8-13 Cards)</option>
                            <option value="saga">Saga (13+ Cards)</option>
                        </select>
                    </label>
                </div>
                <div class="button-group">
                    <button class="ui-button" id="weave">Weave Yarn Spread</button>
                    <button class="ui-button" id="clear-plot">Clear</button>
                </div>
                <div id="plot-res" class="creator-preview">
                    <p class="muted">Set a scale and weave a new plot spread to generate scene-by-scene prompts.</p>
                </div>
            </div>`;

        this.querySelector('#weave').addEventListener('click', () => this.weavePlot());
        this.querySelector('#clear-plot').addEventListener('click', () => this.render());
    }

    async weavePlot() {
        const name = this.querySelector('#plot-name').value || 'Unnamed Plot';
        const scale = this.querySelector('#plot-scale').value;
        const result = this.querySelector('#plot-res');

        result.innerHTML = '<p class="loading">Consulting the Yarn-Cards...</p>';

        // Simulating card draw for prompts
        const count = scale === 'scene' ? 3 : (scale === 'act' ? 5 : (scale === 'arc' ? 9 : 13));
        const prompts = [
            "A sudden shift in Tension.", "A hidden Facet is revealed.", "A Conflict of interest arises.",
            "An Ordeal begins.", "The Geometry of the situation changes.", "A Boon is granted.",
            "A Twist in the narrative.", "A Character Catalyst is activated.", "A Sway towards Yin.",
            "A Sway towards Yang.", "A moment of Chi resonance.", "A fatal Hitch occurs.",
            "The Yarn tightens."
        ];

        let html = `<h4>Plot: ${name}</h4><div class="plot-stages">`;
        for(let i=1; i<=count; i++) {
            const prompt = prompts[Math.floor(Math.random() * prompts.length)];
            html += `
                <div class="plot-stage">
                    <strong>Stage ${i}:</strong>
                    <span>${prompt}</span>
                </div>`;
        }
        html += '</div><p class="muted mt-1">This spread serves as a scene-by-scene prompt for AI Authors and Referees.</p>';
        result.innerHTML = html;
    }
}

customElements.define('t13-boon-table', T13BoonTable);
customElements.define('t13-gematria-calc', T13GematriaCalc);
customElements.define('t13-card-spread', T13CardSpread);
customElements.define('t13-data-table', T13DataTable);
customElements.define('t13-character-creator', T13CharacterCreator);
customElements.define('t13-facet-aspects', T13FacetAspects);
customElements.define('t13-plot-creator', T13PlotCreator);
