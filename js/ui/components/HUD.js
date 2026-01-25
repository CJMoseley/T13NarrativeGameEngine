export class HUD {
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'game-hud';
        Object.assign(this.element.style, {
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
        });

        // Left Panel: Speed & Shield
        this.leftPanel = document.createElement('div');
        Object.assign(this.leftPanel.style, {
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '15px',
            border: '1px solid #00ffff',
            borderRadius: '10px',
            width: '200px'
        });
        
        this.speedElement = document.createElement('div');
        this.speedElement.style.fontSize = '18px';
        this.speedElement.innerHTML = 'SPEED: <span id="hud-speed-val" style="font-size: 24px; font-weight: bold;">0</span> m/s';
        this.leftPanel.appendChild(this.speedElement);

        this.shieldElement = document.createElement('div');
        this.shieldElement.style.marginTop = '10px';
        this.shieldElement.style.fontSize = '18px';
        this.shieldElement.innerHTML = 'SHIELD: <span id="hud-shield-val" style="font-size: 24px; font-weight: bold;">100</span>%';
        this.leftPanel.appendChild(this.shieldElement);

        this.element.appendChild(this.leftPanel);

        // Center Panel: Resonance Scope
        this.centerPanel = document.createElement('div');
        Object.assign(this.centerPanel.style, {
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid #00ffff',
            borderRadius: '10px',
            width: '400px',
            height: '150px',
            position: 'relative',
            overflow: 'hidden'
        });
        
        this.scopeCanvas = document.createElement('canvas');
        this.scopeCanvas.width = 400;
        this.scopeCanvas.height = 150;
        this.centerPanel.appendChild(this.scopeCanvas);
        this.ctx = this.scopeCanvas.getContext('2d');

        this.resonanceLabel = document.createElement('div');
        Object.assign(this.resonanceLabel.style, {
            position: 'absolute',
            top: '5px',
            left: '10px',
            fontSize: '12px',
            color: '#ffffff',
            opacity: '0.8'
        });
        this.resonanceLabel.innerText = "HARMONIC RESONANCE";
        this.centerPanel.appendChild(this.resonanceLabel);

        this.element.appendChild(this.centerPanel);

        // Right Panel: Placeholder for future weapon/system info
        this.rightPanel = document.createElement('div');
        this.rightPanel.style.width = '200px'; 
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