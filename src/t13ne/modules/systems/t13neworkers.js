// t13ne-web-workers-file
/**
 * Generic T13NE Worker for offloading narrative and game logic.
 */
import workerpool from 'workerpool';

function process_plots(data) {
    const results = data.plots.map(p => {
        // Simulate turn logic
        return { id: p.id, status: 'processed', tension: p.tensionLevel };
    });
    return results;
}

function generate_narrative_prompt(data) {
    const prompt = `Constructed prompt for ${data.subject}`;
    return prompt;
}

function ping() {
    return 'pong';
}

// create a worker and register public functions
workerpool.worker({
    ping,
    process_plots,
    generate_narrative_prompt
});
