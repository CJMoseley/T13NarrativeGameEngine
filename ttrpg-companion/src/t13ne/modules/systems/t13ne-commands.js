import T13Dice from '/src/t13ne/modules/mechanics/t13ne-dice.js';
import T13Boons from '/src/t13ne/modules/mechanics/t13ne-boon.js';
import Logger from "/src/t13ne/core/Logger.js";

/**
 * T13NE Commands Module
 * 
 * Acts as the central executive for the T13 Narrative Engine.
 * Interprets "T13NEC" (T13 Narrative Engine Commands) scripts to perform actions
 * across various modules, handling interactions and rule enforcement.
 * 
 * Command Syntax:
 * String: "Namespace:Command(arg1=value, arg2=value)"
 * Object: { cmd: "Namespace:Command", args: { arg1: value } }
 */
export class T13NECommands {
    constructor() {
        this.t13ne = null;
        this.registry = new Map();
        this.optionalRules = new Map();
        this.initialized = false;
    }

    /**
     * Initializes the Commands module.
     * @param {object} t13ne - The main T13NE instance.
     */
    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;

        this.registerCoreCommands();
        this.registerCreationCommands();
        this.registerOptionalRules();
        this.registerWoundCommands(); // Register new wound commands
        this.registerArcCommands(); // Register new arc commands
        this.registerCatalystCommands(); // Register new catalyst commands
        this.registerGameCommands(); // Register save/load commands
        this.registerSpreadCommands(); // Register new spread commands
        this.registerIChingCommands(); // Register new I-Ching commands
        this.registerAudioCommands(); // Register new Music commands
        this.registerAudioDirectorCommands(); // Register new AudioDirector commands
        this.registerRefereeCommands(); // Register new Referee commands
        this.loadSettings();

        this.initialized = true;
        Logger.message("T13NE_Commands: Initialized.");
    }

    /**
     * Loads settings from the main T13NE config and applies them to optional rules.
     */
    loadSettings() {
        const config = this.t13ne.getConfig();
        if (!config.optionalRules) config.optionalRules = {};

        // Sync with registered optional rules
        this.optionalRules.forEach((val, key) => {
            if (config.optionalRules[key] !== undefined) {
                val.enabled = config.optionalRules[key];
            } else {
                // Set default in config if missing
                config.optionalRules[key] = val.enabled;
            }
        });

        // Save back to ensure defaults are persisted
        this.t13ne.setConfig({ optionalRules: config.optionalRules });
        Logger.message("T13NE_Commands: Optional rules settings loaded.");
    }

    /**
     * Registers an optional rule with a default value and description.
     * @param {string} key - The rule key (e.g., 'Drama:RemoveExtraDice').
     * @param {boolean} defaultValue 
     * @param {string} description 
     */
    registerOptionalRule(key, defaultValue, description) {
        if (!this.optionalRules.has(key)) {
            this.optionalRules.set(key, { enabled: defaultValue, description });
        }
    }

    /**
     * Checks if an optional rule is enabled.
     * @param {string} key 
     * @returns {boolean}
     */
    isRuleEnabled(key) {
        return this.optionalRules.get(key)?.enabled || false;
    }

    /**
     * Registers a command handler.
     * @param {string} namespace - e.g., 'Drama', 'Plot'.
     * @param {string} commandName - e.g., 'Prod', 'CreateSnag'.
     * @param {Function} handler - Async function(args, context).
     */
    registerCommand(namespace, commandName, handler) {
        const key = `${namespace}:${commandName}`.toLowerCase();
        this.registry.set(key, handler);
    }

    /**
     * Executes a T13NEC command.
     * @param {string|object} command - The command string or object.
     * @param {object} [context={}] - Context data (e.g., current character, plot).
     * @returns {Promise<any>} The result of the command.
     */
    async execute(command, context = {}) {
        let cmdKey, args;

        if (typeof command === 'string') {
            const parsed = this.parseCommandString(command);
            cmdKey = parsed.key;
            args = parsed.args;
        } else if (typeof command === 'object' && command !== null) {
            cmdKey = command.cmd?.toLowerCase();
            args = command.args || {};
        } else {
            return null;
        }

        if (!this.registry.has(cmdKey)) {
            Logger.warn(`T13NE_Commands: Unknown command '${cmdKey}'`);
            return null;
        }

        const handler = this.registry.get(cmdKey);
        try {
            Logger.message(`T13NE_Commands: Executing ${cmdKey}`, args);
            return await handler(args, context);
        } catch (error) {
            Logger.error(`T13NE_Commands: Error executing ${cmdKey}:`, error);
            return { error: error.message };
        }
    }

    parseCommandString(str) {
        // Regex to capture "Namespace:Command" and "args"
        // Example: Drama:Prod(target=Player, type=Social)
        const match = str.match(/^([a-zA-Z0-9_]+:[a-zA-Z0-9_]+)(?:\((.*)\))?$/);
        if (!match) return { key: str.toLowerCase(), args: {} };

        const key = match[1].toLowerCase();
        const argsStr = match[2];
        const args = {};

        if (argsStr) {
            // Regex to match key=value pairs, handling quoted values with commas
            const regex = /([a-zA-Z0-9_]+)=(?:"([^"]*)"|'([^']*)'|([^,]*))/g;
            let match;
            while ((match = regex.exec(argsStr)) !== null) {
                const key = match[1];
                const value = match[2] || match[3] || match[4];
                args[key] = this.parseValue(value ? value.trim() : '');
            }
        }

        return { key, args };
    }

    parseValue(val) {
        if (!val) return true;
        if (val === 'true') return true;
        if (val === 'false') return false;
        if (!isNaN(Number(val))) return Number(val);
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            return val.slice(1, -1);
        }
        return val;
    }

    registerCoreCommands() {
        // --- Drama Commands ---
        this.registerCommand('Drama', 'Prod', async (args, ctx) => {
            const YarnTeller = this.t13ne.getModule('YarnTeller');
            const target = args.target || ctx.character?.name || 'Character';
            const type = args.type || 'Generic';
            const message = `Narrative Prod: ${target} is prodded by ${type}. ${args.description || ''}`;

            if (YarnTeller) {
                await YarnTeller.narrate({ type: 'Action', action: message });
            }
            return { type: 'Prod', target, message };
        });

        this.registerCommand('Drama', 'Break', async (args, ctx) => {
            const Stress = this.t13ne.getModule('Stress');
            const target = args.target || ctx.character;

            if (target && Stress && typeof Stress.relieveStress === 'function') {
                // Breaks relieve all stress
                if (target.stressState) {
                    for (const dieId in target.stressState) {
                        await Stress.relieveStress(target, dieId, 999);
                    }
                }
                Logger.message(`T13NE_Commands: Break applied to ${target.name}. All stress relieved.`);
            }
            return { type: 'Break', target: target?.name };
        });

        // --- Plot Commands ---
        this.registerCommand('Plot', 'CreateSnag', async (args, ctx) => {
            const Plots = this.t13ne.getModule('Plots');
            const plot = args.plotId ? Plots.getPlot(args.plotId) : ctx.plot;

            if (plot) {
                // Logic to add a snag to the plot
                // This might involve drawing a card or setting a state
                Logger.message(`T13NE_Commands: Snag '${args.type}' created for Plot ${plot.Name}`);
                // If we had a Snag manager, we'd call it here
            }
            return { type: 'Snag', plot: plot?.Name, details: args };
        });

        // --- Test Commands ---
        this.registerCommand('Test', 'Roll', async (args, ctx) => {
            const Tests = this.t13ne.getModule('Tests');
            const char = args.character || ctx.character;
            if (!char || !Tests) return { error: "Missing Character or Tests module" };

            return await Tests.performTest('Dice', char, {
                facet: args.facet,
                difficulty: args.difficulty
            });
        });

        // --- Resources Commands ---
        this.registerCommand('Resources', 'Harvest', async (args, ctx) => {
            const Resources = this.t13ne.getModule('Resources');
            const char = args.character || ctx.character;
            if (!char || !Resources) return { error: "Missing Character or Resources module" };

            const resource = args.sway || args.facet || 'Chi';
            const amount = await Resources.harvest(char, resource, args.method, args.options);
            return { type: 'Harvest', character: char.name, resource: resource, amount };
        });

        this.registerCommand('Resources', 'Pay', async (args, ctx) => {
            const Resources = this.t13ne.getModule('Resources');
            const char = args.character || ctx.character;
            if (!char || !Resources) return { error: "Missing Character or Resources module" };

            const success = Resources.makePayment(char, args.resource, args.amount);
            return { type: 'Payment', character: char.name, success, resource: args.resource, amount: args.amount };
        });

        // --- Tension Commands ---
        this.registerCommand('Tension', 'Set', async (args, ctx) => {
            const Tension = this.t13ne.getModule('Tension');
            if (!Tension) return { error: "Tension module not loaded" };

            if (args.scope === 'Scene') Tension.setSceneSuspense(args.level);
            else if (args.scope === 'Act') Tension.setActSuspense(args.level);
            else if (args.scope === 'Plot') Tension.setPlotSuspense(args.level);

            return { type: 'TensionSet', scope: args.scope, level: args.level };
        });

        // --- Stress Commands ---
        this.registerCommand('Stress', 'Add', async (args, ctx) => {
            const Stress = this.t13ne.getModule('Stress');
            const char = args.character || ctx.character;
            if (!char || !Stress) return { error: "Missing Character or Stress module" };

            await Stress.addStress(char, args.dieId, args.amount, args.boon || 13);
            return { type: 'StressAdd', character: char.name, dieId: args.dieId, amount: args.amount };
        });

        this.registerCommand('Stress', 'GetLimits', async (args, ctx) => {
            const Stress = this.t13ne.getModule('Stress');
            const char = args.character || ctx.character;
            if (!char || !Stress) return { error: "Missing Character or Stress module" };

            const limits = await Stress.calculateTotalLimits(char);
            return { type: 'StressLimits', character: char.name, ...limits };
        });

        this.registerCommand('Stress', 'RollShock', async (args, ctx) => {
            const Stress = this.t13ne.getModule('Stress');
            const char = args.character || ctx.character;
            if (!char || !Stress) return { error: "Missing Character or Stress module" };

            const result = await Stress.rollShock(char, args.dieId);
            return { type: 'ShockRoll', character: char.name, ...result };
        });

        this.registerCommand('Trauma', 'Apply', async (args, ctx) => {
            const Stress = this.t13ne.getModule('Stress');
            const char = args.character || ctx.character;
            if (!char || !Stress) return { error: "Missing Character or Stress module" };

            // args.card should be a card object or ID, simplified here to assume object passed or handled by caller
            const trauma = Stress.applyTrauma(char, args.card);
            return { type: 'TraumaApplied', character: char.name, trauma };
        });

        // --- YarnTeller Commands ---
        this.registerCommand('Yarn', 'Narrate', async (args, ctx) => {
            const YarnTeller = this.t13ne.getModule('YarnTeller');
            if (!YarnTeller) return { error: "YarnTeller module not loaded" };

            const text = await YarnTeller.narrate({
                type: args.type || 'Action',
                action: args.action,
                ...args.context
            });
            return { type: 'Narration', text };
        });

        // --- Boon Commands ---
        this.registerCommand('Boon', 'GetValue', async (args, ctx) => {
            const boon = args.boon || 0;
            const value = T13Boons.getBoonValue(boon);
            return { type: 'BoonValue', boon, value };
        });

        this.registerCommand('Boon', 'GetReduced', async (args, ctx) => {
            const value = args.value || 0;
            const boon = T13Boons.getBoonReduced(value);
            return { type: 'BoonReduced', value, boon };
        });

        this.registerCommand('Boon', 'GetScore', async (args, ctx) => {
            const boon = args.boon || 0;
            const score = T13Boons.getBoonScore(boon);
            return { type: 'BoonScore', boon, score };
        });

        this.registerCommand('Boon', 'GetDraw', async (args, ctx) => {
            const boon = args.boon || 0;
            const draw = T13Boons.getBoonDraw(boon);
            return { type: 'BoonDraw', boon, draw };
        });
    }

    registerWoundCommands() {
        // Wound:Create(type=Mortal, pips=16, suit=Spades)
        this.registerCommand('Wound', 'Create', async (args, ctx) => {
            const Wounds = this.t13ne.getModule('Wounds'); // Assuming module is exposed as 'Wounds'
            if (!Wounds) return { error: "Wounds module not loaded" };

            // Just creates the object, doesn't apply it
            const wound = Wounds.createWound(args.type, args.pips, args.suit);
            return { type: 'WoundCreated', wound };
        });

        // Wound:Apply(target=Player, type=Flesh, pips=5)
        this.registerCommand('Wound', 'Apply', async (args, ctx) => {
            const Wounds = this.t13ne.getModule('Wounds');
            const target = args.target || ctx.character;
            if (!target || !Wounds) return { error: "Missing Target or Wounds module" };

            const wound = Wounds.createWound(args.type, args.pips, args.suit);
            const result = await Wounds.applyWound(target, wound);
            return { type: 'WoundApplied', ...result };
        });

        // Wound:Heal(target=Player, woundId=xyz, method=Reduce)
        this.registerCommand('Wound', 'Heal', async (args, ctx) => {
            const Wounds = this.t13ne.getModule('Wounds');
            const target = args.target || ctx.character;
            if (!target || !Wounds) return { error: "Missing Target or Wounds module" };

            // method defaults to 'Remove' (Full heal), can be 'Reduce'
            const result = await Wounds.healWound(target, args.woundId, args.method);
            return { type: 'WoundHealed', ...result };
        });
    }

    registerArcCommands() {
        // Arc:Create(target=Player, type=Solo, name="My Arc")
        this.registerCommand('Arc', 'Create', async (args, ctx) => {
            const CharacterArc = this.t13ne.getModule('CharacterArc');
            const target = args.target || ctx.character;
            if (!target || !CharacterArc) return { error: "Missing Target or CharacterArc module" };

            const arc = CharacterArc.createArc(target, args.type, args.name);
            return { type: 'ArcCreated', arc };
        });

        // Arc:Advance(target=Player, arcId=xyz)
        this.registerCommand('Arc', 'Advance', async (args, ctx) => {
            const CharacterArc = this.t13ne.getModule('CharacterArc');
            const target = args.target || ctx.character;
            if (!target || !CharacterArc) return { error: "Missing Target or CharacterArc module" };

            const result = CharacterArc.advanceArc(target, args.arcId);
            return { type: 'ArcAdvanced', ...result };
        });

        // Arc:AddNote(target=Player, arcId=xyz, type=Story, content="Something happened")
        this.registerCommand('Arc', 'AddNote', async (args, ctx) => {
            const CharacterArc = this.t13ne.getModule('CharacterArc');
            const target = args.target || ctx.character;
            if (!target || !CharacterArc) return { error: "Missing Target or CharacterArc module" };

            const result = CharacterArc.addNote(target, args.arcId, args.type, args.content);
            return { type: 'ArcNoteAdded', ...result };
        });

        // Arc:SetPitch(target=Player, arcId=xyz, pitch=C#, effectIndex=0)
        this.registerCommand('Arc', 'SetPitch', async (args, ctx) => {
            const CharacterArc = this.t13ne.getModule('CharacterArc');
            const target = args.target || ctx.character;
            if (!target || !CharacterArc) return { error: "Missing Target or CharacterArc module" };

            // The new method handles both setting the pitch and applying the effect.
            // effectIndex defaults to 0 if not provided.
            const result = await CharacterArc.setAndApplyPitch(target, args.arcId, args.pitch, args.effectIndex);
            return { type: 'ArcPitchSet', ...result };
        });
    }

    registerCatalystCommands() {
        // Catalyst:Add(target=Player, type=Ambition, factor="Become King", carrot="Power", stick="Death")
        this.registerCommand('Catalyst', 'Add', async (args, ctx) => {
            const Catalysts = this.t13ne.getModule('Catalysts');
            const target = args.target || ctx.character;
            if (!target || !Catalysts) return { error: "Missing Target or Catalysts module" };

            const catalyst = Catalysts.createCatalyst(args);
            if (typeof target.addCatalyst === 'function') target.addCatalyst(catalyst);
            else if (target.catalysts) target.catalysts.push(catalyst);

            return { type: 'CatalystAdded', catalyst };
        });
    }

    registerSpreadCommands() {
        // Spread:Get(spreadId=three-card-past-present-future)
        this.registerCommand('Spread', 'Get', async (args, ctx) => {
            const CardsAPI = this.t13ne.getModule('CardsAPI');
            if (!CardsAPI) return { error: "CardsAPI module not loaded" };

            const spread = CardsAPI.getCardSpread(args.spreadId);
            return { type: 'SpreadDrawn', spread };
        });

        // Spread:GetComposite(spreadId=story-3-act, sides=2)
        this.registerCommand('Spread', 'GetComposite', async (args, ctx) => {
            const CardsAPI = this.t13ne.getModule('CardsAPI');
            if (!CardsAPI) return { error: "CardsAPI module not loaded" };

            // The simple command parser will pass args like 'sides=2' as args.sides.
            // The getCompositeSpread function can pick these up from the 'args' object.
            const spread = CardsAPI.getCompositeSpread(args.spreadId, args);
            return { type: 'CompositeSpreadDrawn', spread };
        });

        // Cards:ReseedDeck(seed="xyz")
        this.registerCommand('Cards', 'ReseedDeck', async (args, ctx) => {
            const CardsAPI = this.t13ne.getModule('CardsAPI');
            if (!CardsAPI) return { error: "CardsAPI module not loaded" };

            CardsAPI.reseedMasterDeck(args.seed);
            return { type: 'DeckReseeded', seed: args.seed };
        });
    }

    registerGameCommands() {
        // Game:Save(slot=my_save)
        this.registerCommand('Game', 'Save', async (args, ctx) => {
            const Referee = this.t13ne.getModule('Referee');
            if (!Referee) return { error: "Referee module not loaded" };
            const success = await Referee.saveGame(args.slot);
            return { type: 'GameSaved', success, slot: args.slot };
        });

        // Game:Load(slot=my_save)
        this.registerCommand('Game', 'Load', async (args, ctx) => {
            const Referee = this.t13ne.getModule('Referee');
            if (!Referee) return { error: "Referee module not loaded" };
            const success = await Referee.loadGame(args.slot);
            return { type: 'GameLoaded', success, slot: args.slot };
        });

        // Game:Create(name="My Game", type="Campaign", description="...")
        this.registerCommand('Game', 'Create', async (args, ctx) => {
            const GameModule = this.t13ne.getModule('Game');
            if (!GameModule) return { error: "Game module not loaded" };
            const game = GameModule.createGame(args);
            return { type: 'GameCreated', result: game };
        });
    }

    registerCreationCommands() {
        // Helper to deduct cost from source (Character or Plot)
        const deductCost = (ctx, costChi) => {
            if (ctx.bypassCost || costChi <= 0) return true;
            const source = ctx.plot || ctx.character;
            if (!source) return false; // No source to pay

            // If source is a Plot (has yarnPoints)
            if (source.yarnPoints !== undefined) {
                // Conversion: 1 Yarn ~= 5 Chi for creation costs
                const yarnNeeded = Math.ceil(costChi / 5);
                if (source.yarnPoints >= yarnNeeded) {
                    if (typeof source.feed === 'function') {
                        source.feed(-yarnNeeded); // Spend Yarn
                    } else {
                        source.yarnPoints -= yarnNeeded;
                    }
                    return true;
                }
                return false;
            }
            // If source is a Character (has swayAccount)
            else if (source.swayAccount) {
                const Resources = this.t13ne.getModule('Resources');
                if (Resources) {
                    return Resources.makePayment(source, 'Chi', costChi);
                }
            }
            return false;
        };

        this.registerCommand('Tapestry', 'Create', async (args, ctx) => {
            if (!deductCost(ctx, args.cost || 1)) return { error: "Insufficient resources to create Tapestry" };

            const Tapestry = this.t13ne.getModule('Tapestry');
            let tap;

            // Prepare name data if provided
            const nameData = args.full || args.fullName || args.aliases || args.altName ? {
                common: args.name || args.Name || 'Unnamed',
                full: args.full || args.fullName || args.name || args.Name,
                aliases: args.aliases || args.altName || args.name || args.Name
            } : (args.name || args.Name);

            const scale = args.scale !== undefined ? args.scale : 13;

            if (args.random) {
                tap = Tapestry.randomiseStats(0, 0, scale);
            } else {
                tap = Tapestry.setStats(args.alt || 0, args.boons, args.sways, scale, args.hex, nameData);
            }

            if (tap) {
                const T13TapestryClass = this.t13ne.getModule('Tapestry');
                const tapInstance = new T13TapestryClass(tap);

                // Merge in description from args
                tapInstance.description = args.description || args.Description || tapInstance.description || '';

                tap = tapInstance;
            }

            const GameModule = this.t13ne.getModule('Game');
            if (GameModule && tap) {
                GameModule.registerEntity(tap);
            }

            return { type: 'Tapestry', result: tap };
        });

        this.registerCommand('Character', 'Create', async (args, ctx) => {
            // Default Cost: Detailed (10), Extra (2)
            const cost = args.cost || (args.model === 'Detailed' ? 10 : 2);
            if (!deductCost(ctx, cost)) return { error: "Insufficient resources to create Character" };

            const { Character } = await import("/src/t13ne/modules/characters/t13ne-chars.js");
            const Codex = this.t13ne.getModule('Codex');
            const char = await Character.generate(Codex, args);

            if (ctx.plot && char) {
                if (!ctx.plot.characters) ctx.plot.characters = [];
                ctx.plot.characters.push(char);
            }

            const Referee = this.t13ne.getModule('Referee');
            if (Referee && char) {
                Referee.addCharacter(char);
            }

            const GameModule = this.t13ne.getModule('Game');
            if (GameModule && char) {
                GameModule.registerEntity(char);
            }

            return { type: 'Character', result: char };
        });

        this.registerCommand('Monster', 'Create', async (args, ctx) => {
            // Monsters are Characters with specific types
            const monsterType = args.type || 'Monster';
            const result = await this.execute({
                cmd: 'Character:Create',
                args: { ...args, model: 'Detailed', charType: monsterType }
            }, ctx);
            return { type: 'Monster', result: result.result };
        });

        this.registerCommand('Annex', 'Create', async (args, ctx) => {
            // Determine Type and Cost
            const type = args.annexType || args.type || 'Skill';
            let defaultCost = 2; // Skill
            if (type === 'Talent') defaultCost = 5;
            else if (type === 'Power') defaultCost = 10;
            else if (type === 'Super-Annex') defaultCost = 12;

            const cost = args.cost || defaultCost;
            if (!deductCost(ctx, cost)) return { error: "Insufficient resources to create Annex" };

            const Threads = this.t13ne.getModule('Threads');

            // Handle random generation if proficiencyIds are missing
            if (!args.proficiencyIds && args.random) {
                const Facets = this.t13ne.getModule('Facets');
                const facetsArr = await Facets.getFacetsArr();
                const facet = facetsArr[T13Dice.RNG(0, facetsArr.length - 1)];

                const profs = await Threads.findProficiencies({ facet: facet.FacetName });

                // Determine count based on type
                let min = 2, max = 2;
                if (type === 'Talent') { min = 3; max = 5; }
                else if (type === 'Power') { min = 6; max = 10; }
                else if (type === 'Super-Annex') { min = 11; max = 15; }

                const count = T13Dice.RNG(min, max);
                const selected = [];
                for (let i = 0; i < count; i++) {
                    if (profs.length > 0) selected.push(profs[T13Dice.RNG(0, profs.length - 1)].id);
                }
                args.proficiencyIds = selected;
                args.name = args.name || `Random ${facet.FacetName} ${type}`;
                args.annexType = type;
            }

            const annexId = await Threads.getAnnexes().createAnnex(args);

            const GameModule = this.t13ne.getModule('Game');
            if (GameModule && annexId) {
                const annex = Threads.getAnnexes().getAnnex(annexId);
                GameModule.registerEntity(annex);
            }

            return { type: 'Annex', id: annexId };
        });

        this.registerCommand('Descendant', 'Create', async (args, ctx) => {
            const cost = args.cost || 5;
            if (!deductCost(ctx, cost)) return { error: "Insufficient resources to create Descendant" };

            const { Descendant } = await import("/src/t13ne/modules/characters/t13ne-descendants.js");
            const Codex = this.t13ne.getModule('Codex');

            let desc;
            if (args.random && typeof Descendant.generate === 'function') {
                desc = await Descendant.generate(Codex, args);
            } else {
                desc = new Descendant(Codex, args);
            }

            if (ctx.plot) {
                if (!ctx.plot.plotDescendants) ctx.plot.plotDescendants = [];
                ctx.plot.plotDescendants.push(desc);
            } else if (ctx.character && typeof ctx.character.addDescendant === 'function') {
                ctx.character.addDescendant(desc);
            }

            const GameModule = this.t13ne.getModule('Game');
            if (GameModule && desc) {
                GameModule.registerEntity(desc);
            }

            return { type: 'Descendant', result: desc };
        });

        this.registerCommand('Location', 'Create', async (args, ctx) => {
            // Locations are just Descendants with type 'Location'
            return this.execute({ cmd: 'Descendant:Create', args: { ...args, descendantType: 'Location', cost: args.cost || 10 } }, ctx);
        });

        this.registerCommand('Plot', 'Create', async (args, ctx) => {
            const cost = args.cost || 10;
            if (!deductCost(ctx, cost)) return { error: "Insufficient resources to create Plot" };

            const Plots = this.t13ne.getModule('Plots');
            const GameModule = this.t13ne.getModule('Game');
            const plotData = {
                Name: args.name || "Unnamed Plot",
                Rank: args.rank || "Story",
                Description: args.description || "",
                Goal: args.goal || "To resolve the conflict."
            };

            const { T13Plot } = await import("/src/t13ne/modules/narrative/t13ne-plots.js");
            const plot = new T13Plot(plotData, this.t13ne);

            if (Plots) {
                if (!Plots.plots) Plots.plots = [];
                Plots.plots.push(plot);
                Logger.message(`T13NE_Commands: Plot ${plot.Name} created and added to active plots.`);
            }

            if (GameModule && plot) {
                GameModule.registerEntity(plot);
            }

            return { type: 'Plot', result: plot };
        });

        this.registerCommand('Thread', 'Create', async (args, ctx) => {
            // In T13, creating a Thread usually means creating a Proficiency (the smallest component)
            return this.execute({ cmd: 'Proficiency:Create', args }, ctx);
        });

        this.registerCommand('Knot', 'Create', async (args, ctx) => {
            // Creating a Knot usually means creating an Annex or a generic KnotWork
            return this.execute({ cmd: 'Annex:Create', args: { ...args, random: true } }, ctx);
        });

        this.registerCommand('Proficiency', 'Create', async (args, ctx) => {
            const Codex = this.t13ne.getModule('Codex');
            const profData = {
                Name: [args.name || "New Proficiency", args.fullName || ""],
                Description: args.description || "",
                Tags: args.tags || {}
            };
            const id = await Codex.createProficiency({ prof: profData });

            const GameModule = this.t13ne.getModule('Game');
            if (GameModule && id) {
                GameModule.getActiveGame()?.addThread(id);
            }

            return { type: 'Proficiency', id, name: profData.Name[0] };
        });

        this.registerCommand('Character', 'AutoAssignAnnexes', async (args, ctx) => {
            const target = args.target || ctx.character;
            if (target && typeof target.autoAssignAnnexes === 'function') {
                await target.autoAssignAnnexes();
                return { type: 'AutoAssign', target: target.name };
            }
            return { error: 'Invalid target for AutoAssignAnnexes' };
        });
    }

    registerRefereeCommands() {
        // Ref:GenerateCycle(name="The Age of Dust", theme="Decay", scale="Universal")
        this.registerCommand('Ref', 'GenerateCycle', async (args, ctx) => {
            const Referee = this.t13ne.getModule('Referee');
            if (!Referee) return { error: "Referee module not loaded" };

            const name = args.name || "New Cycle";
            const options = {
                theme: args.theme,
                scale: args.scale,
                ...args
            };

            await Referee.generateCycle(name, options);
            return { type: 'CycleGenerated', name };
        });

        // Ref:GenerateBackstory(target=Player)
        this.registerCommand('Ref', 'GenerateBackstory', async (args, ctx) => {
            const Referee = this.t13ne.getModule('Referee');
            const target = args.target || ctx.character;

            if (!Referee || !target) return { error: "Referee module or Target missing" };

            await Referee.generateBackstory(target, args);
            return { type: 'BackstoryGenerated', character: target.name };
        });
    }

    registerIChingCommands() {
        // IChing:GrantReward(target=Player, hex=1, type=Gains, index=0)
        // IChing:GrantReward(target=Player, hex=1, type=LineGains, line=1)
        this.registerCommand('IChing', 'GrantReward', async (args, ctx) => {
            const target = args.target || ctx.character;
            const IChing = this.t13ne.getModule('IChing');
            const Resources = this.t13ne.getModule('Resources');

            if (!target || !IChing || !Resources) return { error: "Missing Target, IChing or Resources module" };

            const hexData = await IChing.getHexagramData(args.hex);
            if (!hexData) return { error: `Hexagram ${args.hex} not found` };

            let reward;
            if (args.type === 'Gains') {
                reward = hexData.Hexagram_Character.Gains[args.index || 0];
            } else if (args.type === 'LineGains') {
                reward = hexData.Hexagram_Character.LineGains.find(lg => lg.Line === args.line);
            }

            if (!reward) return { error: "Reward not found" };

            const amount = reward.Amount === 'Standard'
                ? await Resources.resolveStandardGain(target, reward.Type)
                : reward.Amount;

            // Apply reward
            if (typeof amount === 'number') {
                if (reward.Type === 'Chi') target.swayAccount.add('Chi', amount);
                else if (reward.Type === 'Yin') target.swayAccount.add('Tao:Yin', amount);
                else if (reward.Type === 'Yang') target.swayAccount.add('Tao:Yang', amount);
                else if (reward.Type === 'Stress') {
                    const Stress = this.t13ne.getModule('Stress');
                    if (Stress) await Stress.addStress(target, 'Generic', amount);
                }
            } else if (typeof amount === 'object') {
                // Handle complex rewards (Draw, Roll, Boon)
                // This would likely involve calling more complex Resource/Dice methods
                Logger.message(`T13NE_Commands: Complex reward ${JSON.stringify(amount)} for ${reward.Type} should be handled.`);
            }

            // Execute attached commands if any
            if (reward.Commands && reward.Commands.length > 0) {
                for (const cmd of reward.Commands) {
                    await this.execute(cmd, { ...ctx, character: target });
                }
            }

            return { type: 'IChingRewardGranted', character: target.name, reward };
        });
    }

    registerAudioCommands() {
        // Music:PlayLeitmotif(target=Player)
        this.registerCommand('Music', 'PlayLeitmotif', async (args, ctx) => {
            const Music = this.t13ne.getModule('Music');
            const target = args.target || ctx.character;
            const listener = args.listener || null;

            if (!Music || !target) return { error: "Music module or Target missing" };

            Music.playLeitmotif(target, listener);
            const motif = Music.getLeitmotif(target);
            return { type: 'LeitmotifPlayed', character: target.name, motifData: motif };
        });

        // Music:UpdateAmbience(plotId=MainPlot)
        this.registerCommand('Music', 'UpdateAmbience', async (args, ctx) => {
            const Music = this.t13ne.getModule('Music');
            const Plots = this.t13ne.getModule('Plots');
            const plot = args.plotId ? Plots.getPlot(args.plotId) : ctx.plot;

            if (!Music || !plot) return { error: "Music module or Plot missing" };

            Music.updateAmbience(plot);
            return { type: 'AmbienceUpdated', plot: plot.Name, tension: plot.tensionLevel };
        });

        // Music:Stop()
        this.registerCommand('Music', 'Stop', async (args, ctx) => {
            const Music = this.t13ne.getModule('Music');
            if (Music) Music.stop();
            return { type: 'MusicStopped' };
        });

        // Music:Preview(name="Test Name") - For authoring/debugging
        this.registerCommand('Music', 'Preview', async (args, ctx) => {
            const Music = this.t13ne.getModule('Music');
            // Create a dummy character object to generate a leitmotif from a string
            const dummyChar = { name: args.name || "Test Subject", id: "preview_" + Date.now() };
            Music.playLeitmotif(dummyChar);
            return { type: 'MusicPreview', name: dummyChar.name, motif: Music.getLeitmotif(dummyChar) };
        });

        // Audio:SetVolume(type=Master, level=0.8)
        this.registerCommand('Audio', 'SetVolume', async (args, ctx) => {
            const type = (args.type || 'Master').toLowerCase();
            const level = parseFloat(args.level);
            if (isNaN(level)) return { error: "Invalid volume level" };

            const configUpdate = { audio: {} };
            if (type === 'master') configUpdate.audio.masterVolume = level;
            else if (type === 'music') configUpdate.audio.musicVolume = level;
            else if (type === 'sfx') configUpdate.audio.sfxVolume = level;

            this.t13ne.setConfig(configUpdate);
            return { type: 'VolumeSet', target: type, level };
        });
    }

    registerAudioDirectorCommands() {
        // AudioDirector:SetMood(mood=Action, intensity=0.8)
        this.registerCommand('AudioDirector', 'SetMood', async (args, ctx) => {
            const Director = this.t13ne.getModule('AudioDirector');
            if (!Director) return { error: "AudioDirector module not loaded" };

            Director.setMood(args.mood, args.intensity);
            return { type: 'AudioDirectorMoodSet', mood: args.mood };
        });

        // AudioDirector:PlaySFX(name=Explosion, type=OneShot)
        this.registerCommand('AudioDirector', 'PlaySFX', async (args, ctx) => {
            const Director = this.t13ne.getModule('AudioDirector');
            if (!Director) return { error: "AudioDirector module not loaded" };

            Director.playSFX(args.type || 'OneShot', args.name);
            return { type: 'AudioDirectorSFXPlayed', name: args.name };
        });
    }

    registerOptionalRules() {
        // Drama Rules
        this.registerOptionalRule('Drama:RemoveExtraDice', true, "Yarn-Teller can remove additional Drama Dice from the pool.");
        this.registerOptionalRule('Drama:Redirect', true, "Allow redirecting Prods to other characters.");

        // Stress Rules
        this.registerOptionalRule('Stress:SimplifiedDrama', true, "Simplified rules for when characters can spend stress on drama.");
        this.registerOptionalRule('Stress:OverstressDrama', false, "Overstressed characters can add dice to drama pool.");

        // Resource Rules
        this.registerOptionalRule('Resources:SurvivalDrain', false, "Ongoing sway drain in survival situations.");
        this.registerOptionalRule('Resources:SpreadDamage', false, "Spread resource damage to other pools if > 50%.");
        this.registerOptionalRule('Resources:StaggerDamage', false, "Stagger character if resource loss > Facet Score.");
    }
}

export default new T13NECommands();
