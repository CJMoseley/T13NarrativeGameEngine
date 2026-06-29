# Wormhole Mechanics and Audio Theory

## Building Wormholes
Wormholes are constructed between two positions. If positions are the same, the course is elliptical (orbiting around the planet or star). 
The wormhole is constructed with a beam of Dark Energy down the cenre that holds the tunnel open gravitaionally and forces ships away from teh centre proportional to the inverse square so that it pushes almost infinitely at the centre and at least 1G out at the edge. This makes flying in the tunnel impossible. 

1.  **Galaxy Mass:** Multi-dimensional Perlin noise mimics galactic mass pulling/pushing the path.
2.  **Ship Frequencies:** Each ship has a scale. The ship's key applies frequencies to the tunnel (Lissajous movement perpendicular to travel) this models a guitar string vibration along the wormhole. It also effects the interaction between the ship and the wall individually as the ship can only change its tuning to a note in its own scale and the same goes for most wormholes.
3.  **Resonance:** Walls have resonant frequencies (set by the wormhole song key etc). Matching harmonies (Consonant ratios like 1:2, 2:3) gives bonuses/speed boosts. Dissonant ratios (e.g., 7:5) are less effective.
4.  **Dark Energy Core:** Forms the center line (conic cross-section) this may have perlin noise effects that rotate through time to produce cyclic perlin effects.
5.  **Displacement:** Ship masses and activity also affect wall displacement and wormhole routes, distance from nodes defines the amount of effect that can be created.
6.  **Wall Geometry:** Triangles with vertices wobbling via stacked sinewaves, limited to 2D movement (towards and away from the centre line) to prevent intersecting.
7.  **Smoothing:** All these systems require an additional smoothing layer that interpolates between the random states to create smooth transitioning. Wormhole motion should probaly be limited to calculation every few frames at most (this should be a controllable effect in setting, I suspect the perfect amount lies between 3 and 24 frames but I don't know where so lets have it controllable in settings, eventually it may be an randomly decided aspect of the wormhole itself).

## Musical Harmonics
Every wormhole route calculates a scale and set of chords.

### Modes and Ratios
| Mode | Tonic | Interval Ratios |
| :--- | :--- | :--- |
| Ionian | C | 1/1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2/1 |
| Dorian | D | 1/1, 9/8, 6/5, 4/3, 3/2, 5/3, 9/5, 2/1 |
| Phrygian | E | 1/1, 16/15, 6/5, 4/3, 3/2, 8/5, 9/5, 2/1 |
| Lydian | F | 1/1, 9/8, 5/4, 45/32, 3/2, 5/3, 15/8, 2/1 |
| Mixolydian | G | 1/1, 9/8, 5/4, 4/3, 3/2, 5/3, 9/5, 2/1 |
| Aeolian | A | 1/1, 9/8, 6/5, 4/3, 3/2, 8/5, 9/5, 2/1 |

### Song Structure (Race Pacing)
Races should follow a song structure (Verse, Chorus, Bridge).
*   **Total Race:** ~288 beats.
*   **Structure:** Intro -> Verse 1 -> Chorus 1 -> Verse 2 -> Chorus 2 -> Bridge -> Solo -> Chorus 3 -> Chorus 4 -> Outro.

## Visuals and Color Mapping
The game supports multiple looks (Cartoon, Synthwave, Sci-Fi). Colors indicate harmonic tones on the vortex walls.

### Tone to Color Table
| Tone | Freq (THz) | Wavelength (nm) | Color | Hex |
| :--- | :--- | :--- | :--- | :--- |
| A | 385 | 778 | Black (IR) | #000000 |
| A# | 408 | 735 | Deep Red | #FF0000 |
| B | 432 | 694 | Red-Orange | #FF4500 |
| C | 458 | 654 | Orange | #FFA500 |
| C# | 485 | 618 | Yellow-Orange | #FFAE42 |
| D | 514 | 584 | Yellow | #FFFF00 |
| D# | 545 | 550 | Chartreuse | #7FFF00 |
| E | 578 | 519 | Green-Cyan | #00FF7F |
| F | 612 | 490 | Azure | #007FFF |
| F# | 649 | 462 | Cyan | #00FFFF |
| G | 688 | 436 | Blue | #0000FF |
| G# | 729 | 411 | White (UV) | #FFFFFF |

### Frequency to Hex Algorithm
```javascript
const curvedFrequencyToHex = (f_sound) => {
    const C = 299792458; 
    const f_ref_sound = 440; 
    const f_ref_light_THz = 385; 
    const shift_factor = (f_ref_light_THz * 1e12) / f_ref_sound;

    const f_light_Hz = f_sound * shift_factor;
    const lambda = (C / f_light_Hz) * 1e9; 
    
    if (lambda > 780) return "#000000";
    if (lambda < 380) return "#FFFFFF";
    
    const lambda_min = 380;
    const lambda_max = 780;
    const normalized_lambda = (lambda - lambda_min) / (lambda_max - lambda_min);
    
    const R_center = 0.82;
    const G_center = 0.50;
    const B_center = 0.18;
    const width = 0.15; 

    const color_curve = (center) => {
        const exponent = -0.5 * Math.pow((normalized_lambda - center) / width, 2);
        return Math.exp(exponent);
    };

    let R_raw = color_curve(R_center);
    let G_raw = color_curve(G_center);
    let B_raw = color_curve(B_center);
    
    const scale = 255 / Math.max(R_raw, G_raw, B_raw);
    
    const r = Math.round(Math.min(255, R_raw * scale));
    const g = Math.round(Math.min(255, G_raw * scale));
    const b = Math.round(Math.min(255, B_raw * scale));

    const componentToHex = (c) => {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};
```

## Perlin Noise Dimensions
The galaxy generation uses multi-dimensional noise (likely 12D) covering:
1. Tech Level
2. Species
3. Economics
4. Gravity
5. Dark Matter
6. Frequency #1 (Hyperspace/Wormhole)
7. Phase #1
8. Frequency #2
9. Phase #2
10. Frequency #3
11. Phase #3
12. Local Colour (used for local flag designs and alien species colours)
...and others (Militancy, Aggression, Narrative, etc.)