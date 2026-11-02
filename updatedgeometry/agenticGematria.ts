import geometryContextData from '../../assets/geometries_t13.json';
import pitchData from '../../assets/T13pitches.json';
import tonalModeData from '../../assets/tonalModes.json';
import keyData from '../../assets/keys.json';
import intervalData from '../../assets/interval_ratios.json';
import numberTypeData from '../../assets/numberTypes.json';
import romanChordData from '../../assets/RomanChords.json';

/**
 * Agentic Gematria & T13 Impression System
 * Computes numerical gematria, geometries, pitches, harmonics, and interpersonal impressions for Agents and Users.
 */

export interface GeometryData {
  Geometry: number;
  Name: string;
  Agent_Name: string;
  Geometry_Description: string;
  Chi: string;
  Yang: string;
  Yin: string;
  Stress_Description: string;
  Goal_Description: string;
  Gift_Description: string;
  Social_Description: string;
  Species_Description: string;
  Descendant_Description: string;
  Goal: string;
  Gift: string;
  Positive_Traits: string[];
  Neutral_Traits: string[];
  Negative_Traits: string[];
  Shadow_Traits: string[];
  Agentic_Goal: string;
  Agentic_Gift: string;
  MicroSkills: Array<{
    skill_name: string;
    description: string;
    instruction: string;
  }>;
  Harmonic: number[];
  Dissonant: number[];
}

export interface PitchData {
  Pitch: string;
  House: string;
  Description: string;
  Ruler: string;
  Syllable: string;
  Questions?: string;
  Harmonic_Facets?: string;
  Suggested_Tones?: string;
}

interface T13PitchAsset {
  data: PitchData;
}

interface TonalModeData {
  Type: string;
  Description: string;
  Character?: string;
  Group?: string;
  ModalNumbers: number[];
}

interface KeyData {
  Key: string;
  Description: string;
  Major_Traits: string[];
  Minor_Traits: string[];
  Alt: string;
  Syllable: string;
  Colour: string[];
  Frequency: number;
  Sharps: number;
  Flats: number;
  Relative_Minor: number;
  Fifth: number;
  Fourth: number;
  index: number;
}

interface IntervalData {
  Name: string;
  Ratio: number;
  Effect: number;
  Interval: number;
  Description: string;
  Traits: string[];
}

export interface NumerologyToken {
  text: string;
  value: number;
}

export interface FullGeoResult {
  Name: string;
  GeometryNumber: number;
  Geo: GeometryData;
  Full: number;
  Facade: number;
  Soul: number;
  Nascent: number;
  Ghost: number;
  Len: number;
  FLen: number;
  Key: KeyData;
  Pitch: PitchData;
  GeoHarmonics: {
    key: number;
    ModalTone: number;
    Harmonic: number[];
    Dissonant: number[];
    Perfect: number;
    Wolf: number;
    Sustained: number;
    Nemesis: number;
    Ghost: number;
    Mode: {
      name: string;
      modalNumbers: number[];
      fallback: boolean;
    };
  };
}

export interface AgentCharacterProfile {
  agentName: string;
  facadeGainChi: string;
  gains: {
    chi: string;
    yang: string;
    yin: string;
  };
  goals: {
    primary: string;
    statedFacade: string;
    suspectedShadow: string;
    agentic: string;
  };
  gift: string;
  soulGift: string;
  agenticGift: string;
  microSkills: Array<{
    skill_name: string;
    description: string;
    instruction: string;
  }>;
  positiveTraits: string[];
  neutralTraits: string[];
  negativeTraits: string[];
  shadowTraits: string[];
  characterTraits: string[]; // Unified list of aggregated character traits
}

export interface ImpressionResult {
  Value: number;
  Mod: number;
  RelationshipType: 'BEST_FRIEND' | 'RIVAL' | 'NEUTRAL' | 'FAVORABLE' | 'UNFAVORABLE';
}

export class AgenticGematria {
  private static readonly GEOMETRY_CONTEXT_DATA = new Map(
    geometryContextData.map((geometry) => [geometry.Geometry, geometry])
  );

  private static readonly TONAL_MODES = tonalModeData as TonalModeData[];
  private static readonly KEYS = (keyData as Array<{ data: KeyData }>).map((entry) => entry.data);
  private static readonly INTERVALS = (intervalData as Array<{ data: IntervalData }>).map((entry) => entry.data);
  private static readonly NUMBER_TYPES = numberTypeData as Array<{ Type: string; Impression: number; Reaction: number }>;
  public static readonly ROMAN_CHORDS = romanChordData;

  private static readonly NUMEROLOGY_RULES: ReadonlyArray<readonly [string, number]> = [
    ['bh', 2], ['gh', 3], ['sh', 3], ['ch', 8],
    ['ph', 8], ['th', 9], ['ts', 9], ['tz', 9],
    ['a', 1], ['b', 2], ['c', 2], ['d', 4], ['e', 5],
    ['f', 8], ['g', 3], ['h', 8], ['i', 1], ['j', 1],
    ['k', 2], ['l', 3], ['m', 4], ['n', 5], ['o', 7], ['p', 8],
    ['q', 1], ['r', 2], ['s', 6], ['t', 4], ['u', 6], ['v', 6],
    ['w', 6], ['x', 6], ['y', 1], ['z', 7],
  ];

  private static readonly NUMEROLOGY_MAP = new Map<string, number>(AgenticGematria.NUMEROLOGY_RULES);

  public static readonly GEOMETRIES: GeometryData[] = (geometryContextData as GeometryData[]);

  public static readonly PITCHES: PitchData[] = (pitchData as T13PitchAsset[]).map((entry) => entry.data);

  public static crunchNumbers(num: number): number {
    let current = Math.abs(num);
    while (current > 13) {
      current = String(current)
        .split('')
        .reduce((sum, char) => sum + (parseInt(char, 10) || 0), 0);
    }
    return current;
  }

  public static tidyName(name: string): string {
    if (!name) return '';
    let cleaned = String(name).toLowerCase().trim();
    cleaned = cleaned.replace(/[áâàåä]/g, 'a')
      .replace(/[ðéêèë]/g, 'e')
      .replace(/[íîìï]/g, 'i')
      .replace(/[óôòøõö]/g, 'o')
      .replace(/[úûùü]/g, 'u')
      .replace(/æ/g, 'ae')
      .replace(/ç/g, 'c')
      .replace(/ß/g, 'ss');
    return cleaned.replace(/[^a-z,.]/g, '');
  }

  public static tokenizeNumerology(name: string): NumerologyToken[] {
    const tidied = this.tidyName(name);
    const tokens: NumerologyToken[] = [];
    let index = 0;

    while (index < tidied.length) {
      const pair = tidied.slice(index, index + 2);
      const pairValue = this.NUMEROLOGY_MAP.get(pair);
      if (pairValue !== undefined && pair.length === 2) {
        tokens.push({ text: pair, value: pairValue });
        index += 2;
        continue;
      }

      const single = tidied[index];
      tokens.push({ text: single, value: this.NUMEROLOGY_MAP.get(single) || 0 });
      index += 1;
    }

    return tokens;
  }

  private static scoreTokens(tokens: NumerologyToken[]): number {
    return this.crunchNumbers(tokens.reduce((sum, token) => sum + token.value, 0));
  }

  public static getGeometryFromString(name: string): number {
    const tidied = this.tidyName(name);
    let total = 0;
    for (const [letter, value] of this.NUMEROLOGY_RULES) {
      let offset = tidied.indexOf(letter);
      while (offset >= 0) {
        total += value;
        offset = tidied.indexOf(letter, offset + 1);
      }
    }
    return this.crunchNumbers(total);
  }

  private static getTonalMode(search: number[], distance: number): { name: string; modalNumbers: number[]; fallback: boolean } {
    const matches = this.TONAL_MODES
      .map((mode, index) => ({ mode, index }))
      .filter(({ mode }) => mode.Type !== 'Chromatic' && Array.isArray(mode.ModalNumbers) && search.length < mode.ModalNumbers.length && search.every((tone) => mode.ModalNumbers.includes(tone)))
      .sort((a, b) => a.mode.ModalNumbers.length - b.mode.ModalNumbers.length);

    const groupSize = Math.ceil(matches.length / 3);
    const selected = groupSize > 0 ? matches[(search.reduce((sum, tone) => sum + tone, 0) + distance) % groupSize] : undefined;
    const mode = selected?.mode || this.TONAL_MODES.find((candidate) => candidate.Type === 'Chromatic') || this.TONAL_MODES[this.TONAL_MODES.length - 1];
    return { name: mode.Type, modalNumbers: mode.ModalNumbers, fallback: !selected };
  }

  private static getKey(tone: number): KeyData {
    const keyNumber = Math.abs(tone % 12);
    return this.KEYS[keyNumber] || this.KEYS[0];
  }

  private static getIntervalEffect(note: number, root: number): number {
    const distance = Math.abs(note - root);
    const interval = distance < 20 ? distance : distance % 12;
    return this.INTERVALS[interval]?.Effect || 0;
  }

  public static getInterval(note: number, root: number): IntervalData {
    const distance = Math.abs(Math.trunc(note) - Math.trunc(root));
    const interval = distance < 20 ? distance : distance % 12 || 12;
    const source = this.INTERVALS[interval] || this.INTERVALS[0];
    return distance < 20
      ? source
      : { ...source, Name: `Compound-${source.Name}`, Interval: distance, Description: `This interval is a compound of at least one octave and ${source.Description}` };
  }

  public static calculateChord(tones: number[]): {
    Root: number;
    Chord: unknown;
    Mode: FullGeoResult['GeoHarmonics']['Mode'];
  } | undefined {
    if (!Array.isArray(tones) || tones.length < 3) return undefined;
    const unique = Array.from(new Set(tones.map((tone) => Math.trunc(tone)))).sort((a, b) => a - b);
    const root = unique[0];
    const notes = unique.map((tone) => tone - root);
    const chord = (this.ROMAN_CHORDS as Array<{ Notes?: number[] }>).find((candidate) => JSON.stringify(candidate.Notes) === JSON.stringify(notes));
    const mode = this.getTonalMode(notes, 1);
    return { Root: root, Chord: chord || { Type: 'Tone Cluster', Notes: notes }, Mode: mode };
  }

  private static calculateHarmonics(
    geometry: number,
    soul: number,
    facade: number,
    initial: number,
    length: number,
    aliases: number[] = []
  ): FullGeoResult['GeoHarmonics'] {
    const uniqueAliases = Array.from(new Set(aliases));
    const ghost = uniqueAliases.length > 2
      ? Math.trunc(uniqueAliases.reduce((sum, value) => sum + value, 0) / uniqueAliases.length)
      : this.crunchNumbers(geometry + soul + facade + initial + length);
    const notes = Array.from(new Set([geometry, soul, facade, initial, ghost, ...uniqueAliases])).sort((a, b) => a - b);
    const root = notes[0] || 0;
    const corrected = notes.map((note) => (13 + note - root) % 13).sort((a, b) => a - b);
    const mode = this.getTonalMode(corrected, notes.reduce((sum, note) => sum + note, 0));

    let harmonics: number[] = [];
    let dissonants: number[] = [];
    for (let index = 0; index < 14; index++) {
      const number = 1 + ((index + root - 1) % 13);
      if (mode.modalNumbers.includes(index)) harmonics.push(number);
      else dissonants.push(number);
    }

    const fallbackGeometry = this.GEOMETRIES[root % 13] || this.GEOMETRIES[0];
    if (harmonics.length === 0) {
      harmonics = Array.from(new Set([...notes, ...fallbackGeometry.Harmonic]));
    }
    if (dissonants.length === 0) {
      dissonants = Array.from(new Set([1 + ((geometry + soul + facade + initial + length) % 13), ...fallbackGeometry.Dissonant]));
    }
    harmonics.sort((a, b) => a - b);
    dissonants = dissonants.filter((number) => !harmonics.includes(number)).sort((a, b) => a - b);

    const perfect = harmonics.includes(soul) ? soul
      : harmonics.includes(soul - 9) ? soul - 9
      : harmonics.includes(ghost) ? ghost
      : harmonics.includes(ghost - 9) ? ghost - 9
      : harmonics.includes(facade) ? facade
      : harmonics.includes(facade - 9) ? facade - 9
      : harmonics[soul % harmonics.length] || 0;
    const sustained = dissonants.includes(soul) ? soul
      : dissonants.includes(soul - 9) ? soul - 9
      : dissonants.includes(ghost) ? ghost
      : dissonants.includes(ghost - 9) ? ghost - 9
      : dissonants.includes(facade) ? facade
      : dissonants.includes(facade - 9) ? facade - 9
      : dissonants[facade % dissonants.length] || 0;
    const remainingHarmonics = harmonics.filter((number) => number !== perfect);
    const remainingDissonants = dissonants.filter((number) => number !== sustained);
    const wolf = remainingHarmonics.length > 0 ? remainingHarmonics[Math.abs(geometry + facade + soul + initial) % remainingHarmonics.length] : 0;
    const nemesis = remainingDissonants.length > 0 ? remainingDissonants[Math.abs(geometry + soul + facade + ghost) % remainingDissonants.length] : 0;
    const key = Math.abs((46 + root - nemesis + wolf - geometry + soul - facade + ghost - initial + length) % 88);

    return {
      key,
      ModalTone: mode.modalNumbers.length,
      Harmonic: harmonics,
      Dissonant: dissonants,
      Perfect: perfect,
      Wolf: wolf,
      Sustained: sustained,
      Nemesis: nemesis,
      Ghost: ghost,
      Mode: mode,
    };
  }

  public static calculateFullGeo(name: string, aliases: string[] = []): FullGeoResult {
    const tidied = this.tidyName(name);
    const geoNum = this.getGeometryFromString(name);
    const fullname = String(name);
    const facade = this.getGeometryFromString(fullname.replace(/[aeiouy]/g, ''));
    const soul = this.getGeometryFromString(fullname.replace(/[bcdfghjklmnpqrstvwxz]/g, ''));
    const initialText = fullname.trim();
    const nascent = initialText.length > 0 ? this.getGeometryFromString(initialText[0]) : 0;
    const ghost = this.crunchNumbers(geoNum + soul + facade + nascent + fullname.length);

    const geoObj = this.GEOMETRIES[geoNum] || this.GEOMETRIES[0];
    const harmonics = this.calculateHarmonics(geoNum, soul, facade, nascent, fullname.length, aliases.map((alias) => this.getGeometryFromString(alias)));
    const keyDataForResult = this.getKey(harmonics.key);
    const pitch = this.PITCHES[harmonics.key % this.PITCHES.length] || this.PITCHES[0];

    return {
      Name: name,
      GeometryNumber: geoNum,
      Geo: geoObj,
      Full: geoNum,
      Facade: facade,
      Soul: soul,
      Nascent: nascent,
      Ghost: ghost,
      Len: fullname.length,
      FLen: initialText.length,
      Key: keyDataForResult,
      Pitch: pitch,
      GeoHarmonics: {
        ...harmonics,
      },
    };
  }

  /**
   * Extracts clean character traits, gains, gifts, micro-skills, and goals for an agent.
   */
  public static extractAgentTraits(agentName: string): AgentCharacterProfile {
    const geoResult = this.calculateFullGeo(agentName);
    const primaryGeo = geoResult.Geo;

    const facadeGeo = this.GEOMETRIES[geoResult.Facade] || primaryGeo;
    const soulGeo = this.GEOMETRIES[geoResult.Soul] || primaryGeo;
    const ghostGeo = this.GEOMETRIES[geoResult.Ghost] || primaryGeo;

    // Aggregate traits across geometry layers
    const positiveSet = new Set<string>([...(primaryGeo.Positive_Traits || []), ...(geoResult.Key.Major_Traits || [])]);
    const neutralSet = new Set<string>([...(primaryGeo.Neutral_Traits || []), ...(geoResult.Key.Minor_Traits || [])]);
    const negativeSet = new Set<string>([...(primaryGeo.Negative_Traits || [])]);
    const shadowSet = new Set<string>([...(primaryGeo.Shadow_Traits || []), ...(ghostGeo.Shadow_Traits || [])]);

    // Interval traits if applicable
    const intervalData = this.getInterval(geoResult.GeoHarmonics.key, primaryGeo.Geometry);
    if (intervalData && intervalData.Traits) {
      intervalData.Traits.forEach((t) => positiveSet.add(t));
    }

    const positiveTraits = Array.from(positiveSet);
    const neutralTraits = Array.from(neutralSet);
    const negativeTraits = Array.from(negativeSet);
    const shadowTraits = Array.from(shadowSet);

    // Aggregate all unique traits into a single list of Character Traits
    const characterTraits = Array.from(new Set([
      ...positiveTraits,
      ...neutralTraits,
      ...negativeTraits,
      ...shadowTraits,
    ]));

    return {
      agentName,
      facadeGainChi: facadeGeo.Chi || primaryGeo.Chi,
      gains: {
        chi: primaryGeo.Chi,
        yang: primaryGeo.Yang,
        yin: primaryGeo.Yin,
      },
      goals: {
        primary: primaryGeo.Goal || primaryGeo.Agentic_Goal,
        statedFacade: facadeGeo.Goal || facadeGeo.Agentic_Goal,
        suspectedShadow: ghostGeo.Goal || ghostGeo.Agentic_Goal,
        agentic: primaryGeo.Agentic_Goal,
      },
      gift: primaryGeo.Gift,
      soulGift: soulGeo.Gift,
      agenticGift: soulGeo.Agentic_Gift || primaryGeo.Agentic_Gift,
      microSkills: primaryGeo.MicroSkills || [],
      positiveTraits,
      neutralTraits,
      negativeTraits,
      shadowTraits,
      characterTraits,
    };
  }

  /**
   * Calculates interpersonal impression between target entity A and target entity B.
   * If agent is 'Phantasm', an artificial boost of +10 initial impression is applied.
   */
  public static calculateImpression(nameA: string, nameB: string): ImpressionResult {
    if (!nameA || !nameB) {
      return { Value: 0, Mod: 0, RelationshipType: 'NEUTRAL' };
    }

    const geoA = this.calculateFullGeo(nameA);
    const geoB = this.calculateFullGeo(nameB);

    let val = 0;

    val += this.getIntervalEffect(geoB.GeoHarmonics.key, geoA.GeoHarmonics.key);

    const numberTypes = new Map(this.NUMBER_TYPES.map((entry) => [entry.Type, entry]));
    const applyRelationship = (source: FullGeoResult, target: FullGeoResult, reciprocal: boolean): void => {
      if (source.GeoHarmonics.Harmonic.includes(target.GeometryNumber)) {
        val += numberTypes.get('Harmonic')?.Impression || 1;
      }
      if (source.GeoHarmonics.Dissonant.includes(target.GeometryNumber)) {
        val += numberTypes.get('Dissonant')?.Impression || -1;
      }
      if (source.GeoHarmonics.Perfect === target.GeometryNumber) {
        val += reciprocal ? numberTypes.get('Perfect')?.Reaction || 2 : numberTypes.get('Perfect')?.Impression || 4;
      }
      if (source.GeoHarmonics.Wolf === target.GeometryNumber) {
        val += reciprocal ? numberTypes.get('Wolf')?.Reaction || -1 : numberTypes.get('Wolf')?.Impression || -2;
      }
      if (source.GeoHarmonics.Sustained === target.GeometryNumber) {
        val += reciprocal ? numberTypes.get('Sustained')?.Reaction || 1 : numberTypes.get('Sustained')?.Impression || 2;
      }
      if (source.GeoHarmonics.Nemesis === target.GeometryNumber) {
        val += reciprocal ? numberTypes.get('Nemesis')?.Reaction || -2 : numberTypes.get('Nemesis')?.Impression || -4;
      }
      if (source.Soul === target.GeometryNumber || source.Facade === target.GeometryNumber) {
        val += 1;
      }
    };

    applyRelationship(geoA, geoB, false);
    applyRelationship(geoB, geoA, true);

    // Matching geometries create strong bond
    if (geoA.GeometryNumber === geoB.GeometryNumber) {
      val += 4;
    }

    // Artificial boost for Phantasm as primary agent
    if (nameA.toLowerCase().includes('phantasm') || nameB.toLowerCase().includes('phantasm')) {
      val += 10;
    }

    let relType: ImpressionResult['RelationshipType'] = 'NEUTRAL';
    if (val >= 6) {
      relType = 'BEST_FRIEND';
    } else if (val >= 2) {
      relType = 'FAVORABLE';
    } else if (val <= -4) {
      relType = 'RIVAL';
    } else if (val < 0) {
      relType = 'UNFAVORABLE';
    }

    return {
      Value: val,
      Mod: val,
      RelationshipType: relType,
    };
  }
}
