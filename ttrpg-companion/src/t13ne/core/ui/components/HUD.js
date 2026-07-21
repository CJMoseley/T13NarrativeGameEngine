import { UI } from '../UI.js';

export class HUD {
    constructor() {
        this.element = UI.CE('div', {
            id: 'game-hud',
            style: {
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                pointerEvents: 'none',
                fontFamily: "'Orbitron', sans-serif",
                color: '#00ffff',
                textShadow: '0 0 5px #00ffff',
                zIndex: '10'
            }
        });

        // Left Panel: Speed & Shield
        this.leftPanel = UI.CE('div', {
            style: {
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '15px',
                border: '1px solid #00ffff',
                borderRadius: '10px',
                width: '200px'
            }
        },
            this.speedElement = UI.CE('div', { style: { fontSize: '18px' } },
                'SPEED: ', UI.CE('span', { id: 'hud-speed-val', style: { fontSize: '24px', fontWeight: 'bold' } }, '0'), ' m/s'
            ),
            this.shieldElement = UI.CE('div', { style: { marginTop: '10px', fontSize: '18px' } },
                'SHIELD: ', UI.CE('span', { id: 'hud-shield-val', style: { fontSize: '24px', fontWeight: 'bold' } }, '100'), '%'
            )
        );

        // Center Panel: Resonance Scope
        this.scopeCanvas = UI.CE('canvas', { width: 400, height: 150 });
        this.ctx = this.scopeCanvas.getContext('2d');

        this.centerPanel = UI.CE('div', {
            style: {
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid #00ffff',
                borderRadius: '10px',
                width: '400px',
                height: '150px',
                position: 'relative',
                overflow: 'hidden'
            }
        },
            this.scopeCanvas,
            UI.CE('div', {
                style: {
                    position: 'absolute',
                    top: '5px',
                    left: '10px',
                    fontSize: '12px',
                    color: '#ffffff',
                    opacity: '0.8'
                }
            }, "HARMONIC RESONANCE")
        );

        this.element.appendChild(this.leftPanel);
        this.element.appendChild(this.centerPanel);

        // Right Panel: Placeholder for future weapon/system info
        this.rightPanel = UI.CE('div', { style: { width: '200px' } });
        this.element.appendChild(this.rightPanel);

        this.time = 0;
    }

    update(speed, shieldIntegrity, engineFreq, wormholeFreq, harmonyFactor) {
        // Update Text
        const speedVal = this.element.querySelector('#hud-speed-val');
        if (speedVal) speedVal.innerText = Math.round(speed);

        const shieldVal = this.element.querySelector('#hud-shield-val');
        if (shieldVal) {
            shieldVal.innerText = Math.round(shieldIntegrity);
            shieldVal.style.color = shieldIntegrity < 30 ? '#ff0000' : '#00ffff';
        }

        // Update Scope
        this.drawScope(engineFreq, wormholeFreq, harmonyFactor);
    }

    drawScope(freq1, freq2, harmony) {
        const ctx = this.ctx;
        const w = this.scopeCanvas.width;
        const h = this.scopeCanvas.height;
        const centerY = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Color: Red (0.0) -> Yellow (0.5) -> Green (1.0)
        const r = Math.min(255, 255 * (2 * (1 - harmony)));
        const g = Math.min(255, 255 * (2 * harmony));
        const color = `rgb(${Math.round(r)}, ${Math.round(g)}, 0)`;

        this.time += 0.2;

        // Draw Engine Wave (Cyan)
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.beginPath();
        // Logarithmic scaling for visual clarity of frequencies
        const scaleF1 = Math.log(freq1 + 10) * 2;
        for (let x = 0; x < w; x++) {
            const y = centerY + Math.sin((x + this.time * 20) * 0.05 * (scaleF1 / 10)) * 30;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw Wormhole Wave (Magenta)
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.beginPath();
        const scaleF2 = Math.log(freq2 + 10) * 2;
        for (let x = 0; x < w; x++) {
            const y = centerY + Math.sin((x + this.time * 20) * 0.05 * (scaleF2 / 10)) * 30;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw Resonance Result (Dynamic Color)
        // This wave represents the interference/harmony
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const val1 = Math.sin((x + this.time * 20) * 0.05 * (scaleF1 / 10));
            const val2 = Math.sin((x + this.time * 20) * 0.05 * (scaleF2 / 10));

            // Visual trick: If harmony is high, waves align (constructive). If low, they clash.
            // We simulate this visually by lerping between a chaotic wave and a smooth wave based on harmonyFactor
            const chaotic = (val1 + val2) * 0.5;
            const smooth = Math.sin((x + this.time * 20) * 0.05 * (scaleF1 / 10)); // Lock to engine freq

            const finalY = centerY + (chaotic * (1 - harmony) + smooth * harmony) * 40;

            if (x === 0) ctx.moveTo(x, finalY); else ctx.lineTo(x, finalY);
        }
        ctx.stroke();

        // Draw Harmony Bar Indicator
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(w - 15, 10, 10, h - 20);
        ctx.fillStyle = color;
        const barHeight = (h - 20) * harmony;
        ctx.fillRect(w - 15, h - 10 - barHeight, 10, barHeight);
    }
}