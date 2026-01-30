import { AssetBrowser } from './t13ne-asset-browser.js';
import Logger from "../../core/Logger.js";
import T13NE from "../../T13NE.js";

export class MusicEditorUI {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.musicModule = null;
        this.currentTrack = {
            name: 'New Track',
            voices: [
                { id: 'v1', name: 'Voice 1', instrument: 'sine', sequence: [], mute: false }
            ]
        };
        this.activeVoiceIndex = 0;
        this.currentInstrument = 'sine';
        this.isPlaying = false;
        this.bpm = 120;
        this.timeSignature = [4, 4];
        this.measures = 2;
        this.browser = null;
    }

    async initialize() {
        this.musicModule = T13NE.getModule('Music');
        if (!this.musicModule) {
            Logger.error("MusicEditorUI: Music module not found.");
            return;
        }
        this.render();
    }

    render() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) return;

        this.container.innerHTML = `
            <div style="display: flex; height: 100%; color: #eee; font-family: monospace;">
                <!-- Left Panel: Assets & Voices -->
                <div style="width: 300px; background: #222; padding: 10px; border-right: 1px solid #444; overflow-y: auto; display:flex; flex-direction:column;">
                    
                    <div style="flex:0 0 auto; margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom:10px;">
                        <h4>Voices</h4>
                        <div id="me-voice-list" style="margin-bottom: 10px;"></div>
                        <button id="me-add-voice-btn" style="width: 100%; margin-bottom: 5px;">+ Add Voice</button>
                    </div>

                    <div style="flex:1; display:flex; flex-direction:column; min-height:0;">
                        <h4>Asset Browser</h4>
                        <div id="me-asset-browser" style="flex:1; border:1px solid #333; overflow:hidden;"></div>
                    </div>
                </div>

                <!-- Center Panel: Sequencer -->
                <div style="flex: 1; background: #1a1a1a; padding: 10px; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; background: #333; padding: 5px;">
                        <div>
                            <button id="me-play-btn">▶ Play</button>
                            <button id="me-stop-btn">◼ Stop</button>
                            <span style="font-size:0.9em; margin-left:10px;">
                                <input type="number" id="me-bpm-input" value="${this.bpm}" style="width: 40px" title="BPM"> BPM | 
                                <input type="number" id="me-ts-num" value="${this.timeSignature[0]}" style="width: 30px"> / 
                                <select id="me-ts-den" style="width: 40px">
                                    <option value="4">4</option>
                                    <option value="8">8</option>
                                    <option value="16">16</option>
                                </select> Sig |
                                <input type="number" id="me-measures" value="${this.measures}" style="width: 30px"> Bars
                            </span>
                        </div>
                        <div>
                            <select id="me-active-instrument">
                                <!-- Populated dynamically -->
                            </select>
                            <button id="me-clear-voice-btn">Clear Voice</button>
                        </div>
                    </div>

                    <div id="me-sequencer-grid" style="flex: 1; overflow: auto; position: relative; background: #111;">
                        <!-- Time grid and Note rows will be generated here -->
                    </div>
                </div>

                <!-- Right Panel: Properties / Save -->
                <div style="width: 250px; background: #222; padding: 10px; border-left: 1px solid #444;">
                    <h4>Properties</h4>
                    <div style="margin-bottom: 10px;">
                        <label>Name:</label>
                        <input type="text" id="me-asset-name" style="width: 100%; background: #333; color: #fff; border: 1px solid #555;">
                    </div>
                    
                    <h4>Actions</h4>
                    <button id="me-save-track-btn" style="width: 100%; margin-bottom: 5px; background: #0f766e;">Save Track</button>
                    <button id="me-save-voice-btn" style="width: 100%; margin-bottom: 5px;">Save Voice as Stem</button>
                    
                    <hr style="border-color: #444;">
                    <h4>Manifest</h4>
                    <div id="me-manifest-preview" style="font-size: 0.8em; color: #aaa;"></div>
                </div>
            </div>
        `;

        this.bindEvents();

        // Initialize Browser
        this.browser = new AssetBrowser('me-asset-browser', this.musicModule, async (id, category, item) => {
            console.log(`Selected ${category}: ${id}`);
            if (category === 'samples') {
                const url = this.musicModule.manifestManager.getAssetPath(category, id);
                await this.musicModule.loadSample(id, url);

                // Ask to synthesize? For now, just do it automatically or provide a button?
                // Let's create a "Synth" version automatically for testing
                const synthId = `synth_${id}`;
                this.musicModule.synth.instrumentEngine.createSyntheticInstrument(id, synthId);

                // Default to playing the Sample, but offer Synth in list
                this.getActiveVoice().instrument = id;
                this.currentInstrument = id;

                this.refreshVoiceList();

                // Preview (Sample)
                this.musicModule.synth.playNote(440, this.musicModule.soundEngine.audioContext.currentTime, 0.5, 'sine', 0, id);
            }
        });
        this.browser.render();

        this.refreshVoiceList();
        this.refreshManifestPreview();
        this.renderSequencer();
    }

    bindEvents() {
        this.container.querySelector('#me-play-btn').onclick = () => this.playTrack();
        this.container.querySelector('#me-stop-btn').onclick = () => this.stopSequence();
        this.container.querySelector('#me-clear-voice-btn').onclick = () => this.clearActiveVoice();
        this.container.querySelector('#me-add-voice-btn').onclick = () => this.addVoice();

        this.container.querySelector('#me-save-voice-btn').onclick = () => {
            const voice = this.getActiveVoice();
            const name = this.container.querySelector('#me-asset-name').value || `stem_${voice.name}`;
            const finalName = name.replace(/\s+/g, '_').toLowerCase();

            const json = this.musicModule.saveStem(finalName, voice);
            console.log("Saved Stem:", json);
            alert(`Active Voice saved as Stem '${finalName}' to manifest.`);
            this.refreshManifestPreview();
        };

        this.container.querySelector('#me-save-track-btn').onclick = () => {
            const name = this.container.querySelector('#me-asset-name').value || 'untitled_track';

            // Re-sync basic props
            this.currentTrack.name = name;
            this.currentTrack.bpm = this.bpm;
            this.currentTrack.timeSignature = this.timeSignature;
            this.currentTrack.measures = this.measures;

            const json = this.musicModule.saveTrack(name, this.currentTrack);
            console.log("Saved Track:", json);
            alert(`Track '${name}' saved to manifest.`);
            this.refreshManifestPreview();
        };

        this.container.querySelector('#me-active-instrument').onchange = (e) => {
            this.currentInstrument = e.target.value;
            this.getActiveVoice().instrument = this.currentInstrument;
            this.refreshVoiceList(); // Update UI to show new instrument name
        };

        // Time Signature & Grid Controls
        const refreshGrid = () => {
            this.bpm = parseInt(this.container.querySelector('#me-bpm-input').value);
            this.timeSignature[0] = parseInt(this.container.querySelector('#me-ts-num').value);
            this.timeSignature[1] = parseInt(this.container.querySelector('#me-ts-den').value);
            this.measures = parseInt(this.container.querySelector('#me-measures').value);
            this.renderSequencer();
        };

        this.container.querySelector('#me-ts-num').onchange = refreshGrid;
        this.container.querySelector('#me-ts-den').onchange = refreshGrid;
        this.container.querySelector('#me-measures').onchange = refreshGrid;
        this.container.querySelector('#me-bpm-input').onchange = (e) => this.bpm = parseInt(e.target.value);
    }

    refreshAssets() {
        const instList = this.container.querySelector('#me-instrument-list');
        const sampleList = this.container.querySelector('#me-sample-list');
        const instSelect = this.container.querySelector('#me-active-instrument');

        // Refresh Instruments (Mocking reading from engine for now, ideally instrumentEngine exposes keys)
        const instruments = Array.from(this.musicModule.synth.instrumentEngine.instruments.keys());

        instList.innerHTML = instruments.map(i => `<div style="cursor:pointer; padding:2px;" onclick="T13NE.getModule('Editor').musicEditor.selectInstrument('${i}')">${i}</div>`).join('');

        instSelect.innerHTML = instruments.map(i => `<option value="${i}" ${i === this.currentInstrument ? 'selected' : ''}>${i}</option>`).join('');

        // Refresh Samples
        const samples = Array.from(this.musicModule.synth.instrumentEngine.samples.keys());
        sampleList.innerHTML = samples.map(s => `<div style="font-size:0.9em; padding:2px;">🎵 ${s}</div>`).join('');

        this.refreshVoiceList();
        this.refreshManifestPreview();
    }

    getActiveVoice() {
        return this.currentTrack.voices[this.activeVoiceIndex];
    }

    refreshVoiceList() {
        const list = this.container.querySelector('#me-voice-list');
        list.innerHTML = this.currentTrack.voices.map((v, i) => `
            <div style="background: ${i === this.activeVoiceIndex ? '#333' : '#222'}; border: 1px solid #444; padding: 5px; margin-bottom: 2px; display:flex; align-items:center; cursor:pointer;"
                 onclick="T13NE.getModule('Editor').musicEditor.selectVoice(${i})">
                <span style="flex:1; font-size: 0.9em; font-weight: bold; color: ${i === this.activeVoiceIndex ? '#38bdf8' : '#aaa'};">
                    ${v.name} <small>(${v.instrument})</small>
                </span>
                <span style="cursor:pointer; color: ${v.mute ? 'red' : '#555'}; padding: 0 5px;" onclick="T13NE.getModule('Editor').musicEditor.toggleMute(${i}, event)">M</span>
                <span style="cursor:pointer; color: #888;" onclick="T13NE.getModule('Editor').musicEditor.deleteVoice(${i}, event)">✖</span>
            </div>
        `).join('');
    }

    addVoice() {
        const id = `v${this.currentTrack.voices.length + 1}`;
        this.currentTrack.voices.push({ id, name: `Voice ${this.currentTrack.voices.length + 1}`, instrument: 'sine', sequence: [], mute: false });
        this.selectVoice(this.currentTrack.voices.length - 1);
    }

    selectVoice(index) {
        this.activeVoiceIndex = index;
        const voice = this.getActiveVoice();
        this.currentInstrument = voice.instrument;
        this.container.querySelector('#me-active-instrument').value = voice.instrument;
        this.refreshVoiceList();
        this.renderSequencer();
    }

    toggleMute(index, e) {
        e.stopPropagation();
        this.currentTrack.voices[index].mute = !this.currentTrack.voices[index].mute;
        this.refreshVoiceList();
    }

    deleteVoice(index, e) {
        e.stopPropagation();
        if (this.currentTrack.voices.length <= 1) return; // Prevent deleting last voice
        if (confirm('Delete this voice?')) {
            this.currentTrack.voices.splice(index, 1);
            if (this.activeVoiceIndex >= this.currentTrack.voices.length) {
                this.activeVoiceIndex = this.currentTrack.voices.length - 1;
            }
            this.selectVoice(this.activeVoiceIndex);
        }
    }

    refreshManifestPreview() {
        const preview = this.container.querySelector('#me-manifest-preview');
        const counts = {
            samples: Object.keys(this.musicModule.manifestManager.manifest.samples).length,
            sequences: Object.keys(this.musicModule.manifestManager.manifest.sequences).length,
            loops: Object.keys(this.musicModule.manifestManager.manifest.loops).length
        };
        preview.innerHTML = `
            Samples: ${counts.samples}<br>
            Sequences: ${counts.sequences}<br>
            Loops: ${counts.loops}
        `;
    }

    renderSequencer() {
        const grid = this.container.querySelector('#me-sequencer-grid');
        grid.innerHTML = '';

        // Calculate Grid Dimensions
        // 16th notes per measure = (Numerator * (16 / Denominator))
        const stepsPerMeasure = this.timeSignature[0] * (16 / this.timeSignature[1]);
        const totalSteps = Math.ceil(stepsPerMeasure * this.measures);

        // Extended range: 6 octaves (C1 to C6)
        const notes = [];
        const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        for (let oct = 6; oct >= 1; oct--) {
            for (let i = 11; i >= 0; i--) {
                notes.push(`${scale[i]}${oct}`);
            }
        }

        const rowHeight = 20;
        const colWidth = 30; // Slightly narrower for more steps

        // Container for scrolling
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.width = `${totalSteps * colWidth + 50}px`;
        wrapper.style.height = `${notes.length * rowHeight + 30}px`; // Extra space for timeline

        // Timeline Header
        const timeline = document.createElement('div');
        timeline.style.position = 'absolute';
        timeline.style.left = '45px';
        timeline.style.top = '0';
        timeline.style.height = '20px';
        timeline.style.width = `${totalSteps * colWidth}px`;
        timeline.style.borderBottom = '1px solid #555';

        // Draw Measure Markers
        for (let m = 0; m < this.measures; m++) {
            const mMarker = document.createElement('div');
            mMarker.style.position = 'absolute';
            mMarker.style.left = `${m * stepsPerMeasure * colWidth}px`;
            mMarker.textContent = `Bar ${m + 1}`;
            mMarker.style.fontSize = '9px';
            mMarker.style.color = '#888';
            timeline.appendChild(mMarker);
        }
        wrapper.appendChild(timeline);

        notes.forEach((note, rIndex) => {
            const topY = (rIndex * rowHeight) + 20; // Offset by timeline

            // Note Label
            const label = document.createElement('div');
            label.textContent = note;
            label.style.position = 'absolute';
            label.style.left = '0';
            label.style.top = `${topY}px`;
            label.style.width = '40px';
            label.style.height = `${rowHeight}px`;
            label.style.fontSize = '10px';
            label.style.borderBottom = '1px solid #333';
            label.style.background = note.includes('#') ? '#222' : '#333';
            label.style.color = '#aaa';
            label.style.textAlign = 'right';
            label.style.paddingRight = '5px';
            wrapper.appendChild(label);

            // Steps
            for (let step = 0; step < totalSteps; step++) {
                const cell = document.createElement('div');
                cell.style.position = 'absolute';
                cell.style.left = `${45 + step * colWidth}px`;
                cell.style.top = `${topY}px`;
                cell.style.width = `${colWidth - 1}px`;
                cell.style.height = `${rowHeight - 1}px`;

                // Beat styling
                const isMeasureStart = step % stepsPerMeasure === 0;
                const isBeat = step % (16 / this.timeSignature[1]) === 0; // Simple approximation for beat lines

                cell.style.background = isMeasureStart ? '#333' : (isBeat ? '#2a2a2a' : '#222');
                cell.style.borderLeft = isMeasureStart ? '1px solid #555' : '1px solid #282828';
                cell.style.borderBottom = '1px solid #282828';
                cell.style.cursor = 'pointer';

                // Interaction
                cell.onclick = () => {
                    this.toggleNote(step, note, cell);
                };

                // Check if active
                if (this.isNoteActive(step, note)) {
                    cell.style.background = '#38bdf8';
                }

                wrapper.appendChild(cell);
            }
        });

        grid.appendChild(wrapper);
    }

    toggleNote(step, note, element) {
        const voice = this.getActiveVoice();
        const index = voice.sequence.findIndex(n => n.step === step && n.note === note);
        if (index > -1) {
            voice.sequence.splice(index, 1);
            element.style.background = (step % 4 === 0) ? '#2a2a2a' : '#222';
        } else {
            voice.sequence.push({ step, note, duration: 0.25, velocity: 0.8 });
            element.style.background = '#38bdf8';
            // Preview
            const freq = this.noteToFreq(note);
            this.musicModule.synth.playNote(freq, this.musicModule.soundEngine.audioContext.currentTime, 0.2, 'sine', 0, this.currentInstrument);
        }
    }

    isNoteActive(step, note) {
        return this.getActiveVoice().sequence.some(n => n.step === step && n.note === note);
    }

    clearActiveVoice() {
        this.getActiveVoice().sequence = [];
        this.renderSequencer();
    }

    noteToFreq(note) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = parseInt(note.slice(-1));
        const keyNumber = notes.indexOf(note.slice(0, -1));
        if (keyNumber < 0) return 440;
        // A4 = 440Hz. Formula: f = 440 * 2^((n-49)/12) where n is key number. 
        // Here we calculate semitone offset from A4.
        return 440 * Math.pow(2, ((keyNumber + ((octave - 4) * 12)) - 9) / 12);
    }

    selectInstrument(inst) {
        this.currentInstrument = inst;
        this.container.querySelector('#me-active-instrument').value = inst;
    }

    playTrack() {
        if (this.isPlaying) return;
        this.isPlaying = true;

        // Update track metadata before playing
        this.currentTrack.bpm = this.bpm;

        // Use the new playTrack method
        this.musicModule.playTrack(this.currentTrack);

        const stepTime = 60 / this.bpm / 4;
        const stepsPerMeasure = this.timeSignature[0] * (16 / this.timeSignature[1]);
        const totalSteps = Math.ceil(stepsPerMeasure * this.measures);

        setTimeout(() => { this.isPlaying = false; }, (totalSteps * stepTime * 1000) + 100);
    }

    stopSequence() {
        // Simple stop logic: cancel context? No, just flag. 
        // Real stop would require tracking scheduled nodes.
        this.isPlaying = false;
        this.musicModule.synth.stopAll();
    }

    clearSequence() {
        this.currentSequence = [];
        this.renderSequencer();
    }
}
