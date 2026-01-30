const UIMessageTemplates = {
    system_lore: (data) => `
        <h3>System Report: ${data.name}</h3>
        <p><strong>Stellar Class:</strong> ${data.starClass}</p>
        <p><strong>Galactic Coordinates:</strong> ${data.coords}</p>
        <p><strong>Primary Species:</strong> ${data.species}</p>
        <p><strong>Social Structure:</strong> ${data.society}</p>
        <p><strong>Technological Tier:</strong> ${data.tech}</p>
        <p>${data.description}</p>
    `,
    race_results: (data) => `
        <h3>Race Results</h3>
        <p><strong>Winner:</strong> ${data.winner}</p>
        <p><strong>Time:</strong> ${data.time}</p>
    `,
    planet_lore: (data) => `
        <h3>Planetary Scan: ${data.name}</h3>
        <p><strong>Type:</strong> ${data.type}</p>
        <p><strong>Atmosphere:</strong> ${data.atmosphere}</p>
        <p><strong>Temperature:</strong> ${data.temperature} K</p>
        <p><strong>Gravity:</strong> ${data.gravity} G</p>
        <p><strong>Resources:</strong> ${data.resources.join(', ')}</p>
        <hr>
        <h4>Technological Profile</h4>
        <p><strong>Tech Level:</strong> ${data.techProfile.techLevel}</p>
        <p><strong>Specialization:</strong> ${data.techProfile.specialization}</p>
        <p><strong>Proficiencies:</strong></p>
        <ul>
            ${data.techProfile.knownProficiencies.map(p => `<li>${p.name} (Lvl: ${p.level})</li>`).join('')}
        </ul>
        <hr>
        <p>${data.description || 'No additional data available.'}</p>
    `,
    loading_scene: (data) => `
        <div class="ui-message-loading-container">
            <div class="spinner"></div>
            <p>${data.message || 'Loading...'}</p>
        </div>
    `,
    simple_message: (data) => `
        <p>${data.message || ''}</p>
    `,
};

export { UIMessageTemplates };