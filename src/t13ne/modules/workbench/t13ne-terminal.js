import AuthorMain from '@plugins/t13ne/AuthorMain.js';

export default class Terminal {
    constructor(workbench) {
        this.workbench = workbench;
    }

    setup() {
        const input = document.getElementById('term-input');
        if (!input) return;

        input.onkeydown = async (e) => {
            if (e.key === 'Enter') {
                const cmd = input.value.trim();
                if (!cmd) return;
                input.value = '';
                this.log(`> ${cmd}`, 'cmd');

                const start = performance.now();
                const result = await AuthorMain.executeCommand(cmd, AuthorMain.getContext());
                const duration = Math.round(performance.now() - start);

                const latencyEl = document.getElementById('terminal-latency');
                if (latencyEl) latencyEl.textContent = `LATENCY: ${duration}ms`;

                if (result?.error) {
                    this.log(`Error: ${result.error}`, 'error');
                } else {
                    this.log(`Result: ${JSON.stringify(result, null, 2)}`, 'success');
                    this.workbench.refreshAll();
                }
            }
        };
    }

    log(msg, type = 'info') {
        const logPanel = document.getElementById('term-log');
        if (!logPanel) return;

        const div = document.createElement('div');
        const colors = {
            error: 'var(--danger)',
            warn: '#fbbf24',
            success: 'var(--accent-green)',
            info: 'var(--text-dim)',
            cmd: 'var(--accent-blue)'
        };
        div.style.color = colors[type] || colors.info;
        div.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logPanel.appendChild(div);
        logPanel.scrollTop = logPanel.scrollHeight;
    }
}





