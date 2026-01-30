
import { UI } from './UI.js';

const UIMessageTemplates = {
    system_lore: (data) => UI.ContentBox({
        title: `System Report: ${data.name}`,
        dataType: data.tech,
        description: data.description
    }, UI.CE('div', { className: 't13ne-details' },
        UI.CE('p', {}, UI.CE('strong', {}, 'Stellar Class: '), data.starClass),
        UI.CE('p', {}, UI.CE('strong', {}, 'Galactic Coordinates: '), data.coords),
        UI.CE('p', {}, UI.CE('strong', {}, 'Primary Species: '), data.species),
        UI.CE('p', {}, UI.CE('strong', {}, 'Social Structure: '), data.society)
    )),

    race_results: (data) => UI.ContentBox({
        title: 'Race Results',
        description: 'Final results of the wormhole circuit.'
    }, UI.CE('div', {},
        UI.CE('p', {}, UI.CE('strong', {}, 'Winner: '), data.winner),
        UI.CE('p', {}, UI.CE('strong', {}, 'Time: '), data.time)
    )),

    planet_lore: (data) => UI.ContentBox({
        title: `Planetary Scan: ${data.name}`,
        dataType: `Tech Level: ${data.techProfile.techLevel}`,
        description: data.description || 'No additional data available.'
    }, UI.CE('div', { className: 't13ne-details' },
        UI.CE('p', {}, UI.CE('strong', {}, 'Type: '), data.type),
        UI.CE('p', {}, UI.CE('strong', {}, 'Atmosphere: '), data.atmosphere),
        UI.CE('p', {}, UI.CE('strong', {}, 'Temperature: '), `${data.temperature} K`),
        UI.CE('p', {}, UI.CE('strong', {}, 'Gravity: '), `${data.gravity} G`),
        UI.CE('p', {}, UI.CE('strong', {}, 'Resources: '), data.resources.join(', ')),
        UI.CE('hr'),
        UI.CE('h4', {}, 'Technological Profile'),
        UI.CE('p', {}, UI.CE('strong', {}, 'Specialization: '), data.techProfile.specialization),
        UI.CE('p', {}, UI.CE('strong', {}, 'Proficiencies: ')),
        UI.CE('ul', {}, ...data.techProfile.knownProficiencies.map(p =>
            UI.CE('li', {}, `${p.name} (Lvl: ${p.level})`)
        ))
    )),

    loading_scene: (data) => UI.CE('div', { className: 'ui-message-loading-container' },
        UI.CE('div', { className: 'spinner' }),
        UI.CE('p', {}, data.message || 'Loading...')
    ),

    simple_message: (data) => UI.CE('p', {}, data.message || ''),
};

export { UIMessageTemplates };
