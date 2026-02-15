// This is a placeholder for the T13NE Tension module."<!-- wp:paragraph -->\n<p>Tension is handled slightly differently in T13 than you may expect if you are familiar with Tension in drama, or fiction. There the tension describes the sensation the viewer (or reader) experiences as they watch (or read) the Narrative unfold. In T13, this tension is part of the universe, and while it may be felt by a Player (viewer/reader), it is also experienced by the Characters in the Story, and affects those Characters too. But most importantly, Tension affects Plots, almost as much as Characters.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading {\"level\":2} -->\n<h2>Tension Levels</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>To handle this dramatic and narrative tension we need two tools that we refer to as Tension and Stress. The first is the Tension, this is described in terms of Level and shows how on edge Characters should appear. The Tension Level of the current Scene, Act, or Plot affects what the Scene, Act, or Plot can do. Extras usually all use the Scene Tension Level as their Stress as well, but we&apos;ll get to that later.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Tension in T13 has 6 levels and we can consider them as follows. </p>\n<!-- /wp:paragraph -->\n\n<!-- wp:list -->\n<ul><li>Each Plot (including the Scenes and Acts) should have a Tension Level from the following table, starting somewhere around Low-Medium usually. </li><li>Characters who are in a Scene with a lower Tension Level are more likely to behave calmly, acting more rationally and responding more logically to each other. At higher Tension Levels, Characters will become more Stressed, making them more emotional, erratic, and may even become dangerous to be around. </li><li>Scene (and Act and Plot) Tension Level can determine which Characters, and particularly which Embodiments can appear in the same Scene. If the Tension is high then Characters are pushed or drawn together, forced to interact, be it a Romantic plot, where the two Characters become intensely passionate about each other and ignore the rest of the world, or a Thriller plot where the enemy draw closer to the heroes as the Tension mounts.</li><li>Each Tension Level has a suggested Stakes for any Ordeals and also specifies an \"Add Stress Event\". If a Scene is at this Tension Level then all Add Stress Events from this Level or lower apply. These Events each add individual Stress to the Characters in the Scene that they apply to.</li></ul>\n<!-- /wp:list -->\n\n<!-- wp:shortcode -->\n[t13ne type=\"tabledisplay\" array=\"tensionLevels\"/]\n<!-- /wp:shortcode -->\n\n<!-- wp:paragraph -->\n<p>You may notice that the Tension Levels state that they may Compel Characters to act. Only NPCs can be compelled by the Plot in this way. Player Characters cannot be directly compelled to act (as the Player is usually the only compulsion the Character must follow), but Stress can affect them directly. The Plot at higher Tension levels can add Psych attacks during the Recoiling of the Weft, this is often enough to get the Players back on track.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading -->\n<h2>Tracking Tension Level</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>There are a number of ways of tracking the Current Tension Level. Each way feels different and has different styles of play and genre of game that it supports more appropriately.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading {\"level\":3} -->\n<h3>Tracking Tension Levels</h3>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>Each Plot, whether it be a Cycle, and Epic, or an Act or a Scene has its own Tension Level. Plots that are early on and smaller will have lower Tension Levels, but the big Epic plots that are already a hundred years into it are going to have much higher Tension Levels. However, for all Characters, and the Referee the Tension Levels of all the Plots they have become Hooked by or embodied within are important. Even a single Story will have a Story Tension Level, and Act Tension Level and a Scene Tension Level. In general we consider the Scene to be more important than the Act or Story. This is because for the Characters only the Scene can truly be relevant, as the Scene is the closest Plot in scope to the Characters, the Characters are only essential to a specific Scene, an Act or Story could theoretically discard them as Embodiments for something else later. So Tension Levels are often recorded on Plots with a number between one and thirteen.</p>\n<!-- /wp:paragraph -->\n\n<!--wp:paragraph -->\n<p>Tracking the Tension Level of the the current Scene can be done in a number of ways, but is always the responsibility of the Referee and not any Yarn-Tellers. Although Yarn-Tellers may alter the Tension-Level as required. The Referee can place a Tension Level card, write the current Tension Level on a piece of paper, move a counter in a Tension Level Psychosocial\n Action Space, turn a d6 to show the current Tension Level, or record the Tension Level in secret as they like.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Tension Level for the current Scene can be manipulated, not just by the Referee and Yarn-Tellers (who can pay Yarn to alter the Tension Level), but by any Embodiment Character. Drama caused by any Character can potentially move the Tension Level of the current Scene up or down by one. A simple rule is that if Drama occurs, then the Tension Level should move one Level. During the early narrative it is usual to move Tension up when you can, during the later narrative Tension will also decrease again to keep the Tension Level correct for the current Narrative. It would never do to have a romantic love arc turn into a blood bath because the Tension Level got pushed too high by a bad Drama roll, so the Referee and Yarn-Tellers should always bear the narrative in mind, and not just respond to game mechanics here. Sometimes you just have to Break the action for the sake of the Story.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>If the current Scene is 2 or more Tension Levels away from the Act then it will pull the Act one closer, and if the Act is 2 or more Tension Levels away from its Plot&apos;s Tension Level then it will also pull the Plot one Level closer. It is normal for the Tension Level of the Plot or its Acts to be set before play has started, what happens during the narrative can therefore alter and change to the Plot and Act significantly. Typically though the Plot will have a Suggested Tension Level (e.g. 4), this would suggest the Acts had Tension Levels of (3,4 and 5) so as to not Pull the Plot around, any individual Scenes may have a Tension Level of 2-4 in the Frame, 3-5 in the Loom, and 4-6 in the Zenith.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Usually with this method Plots, Acts and Scenes have their Tension Level recorded after play. This means an ongoing Plot that keeps returning may have a dramatically different Tension Level to the current Plot, and Tension Levels can shift between them as we move between Scenes of different Plots.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>As an alternative the Tension Level can be kept secret from the Players deliberately, as this can cause even experienced Players to misjudge the current Tension Level and become accidentally Histrionic (acting as if the Tension Level was higher) or Emphatic (where they act as if the Tension Level was lower), as well as incurring Prods or Breaks as required.</p>\n<!-- /wp:paragraph -->\n"
import CodexLoader from '../modules/CodexLoader.js';
import Logger from '/src/t13ne/core/Logger.js';

/**
 * Module for handling T13NE Suspense Levels (formerly Tension).
 * Manages Scene, Act, and Plot suspense and their interactions.
 * Incorporates Five Changes to model Pressures and Tensions.
 */
class T13NE_Suspense {
    constructor() {
        this.suspenseLevelsData = [];
        this.fiveChangesData = [];
        this.currentSceneSuspense = 0;
        this.currentActSuspense = 0;
        this.currentPlotSuspense = 0;
        this.initialized = false;
    }

    /**
     * Initializes the Suspense module by loading data from the codex.
     */
    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        try {
            // Load suspense levels and five changes data
            const [suspenseData, changesData] = await Promise.all([
                CodexLoader.getData('drama', 'suspenseLevels.json'),
                CodexLoader.getData('drama', 'fiveChanges.json')
            ]);
            
            this.suspenseLevelsData = suspenseData || [];
            this.fiveChangesData = changesData || [];
            
            this.initialized = true;
            Logger.message('T13NE_Suspense: Initialized successfully.');
        } catch (error) {
            Logger.error(`T13NE_Suspense: Initialization failed: ${error}`);
        }
    }

    /**
     * Sets the suspense level for the current scene.
     * Triggers pull effects on Act and Plot.
     * @param {number} level - The new suspense level (0-11).
     */
    setSceneSuspense(level) {
        const oldLevel = this.currentSceneSuspense;
        this.currentSceneSuspense = this._clampLevel(level);
        
        if (oldLevel !== this.currentSceneSuspense) {
            Logger.message(`T13NE_Suspense: Scene Suspense set to ${this.currentSceneSuspense}.`);
            this._checkPullEffects();
        }
    }

    /**
     * Sets the suspense level for the current act.
     * Triggers pull effects on Plot.
     * @param {number} level - The new suspense level (0-11).
     */
    setActSuspense(level) {
        const oldLevel = this.currentActSuspense;
        this.currentActSuspense = this._clampLevel(level);

        if (oldLevel !== this.currentActSuspense) {
            Logger.message(`T13NE_Suspense: Act Suspense set to ${this.currentActSuspense}.`);
            this._checkActPullPlot();
        }
    }

    /**
     * Sets the suspense level for the current plot.
     * @param {number} level - The new suspense level (0-11).
     */
    setPlotSuspense(level) {
        this.currentPlotSuspense = this._clampLevel(level);
        Logger.message(`T13NE_Suspense: Plot Suspense set to ${this.currentPlotSuspense}.`);
    }

    /**
     * Adjusts the scene suspense by a specific amount.
     * @param {number} amount - The amount to adjust by (e.g., +1, -1).
     */
    adjustSceneSuspense(amount) {
        this.setSceneSuspense(this.currentSceneSuspense + amount);
    }

    /**
     * Retrieves the data object for the current scene suspense level.
     * @returns {object|null} The suspense level data.
     */
    getCurrentSuspenseData() {
        return this.getSuspenseData(this.currentSceneSuspense);
    }

    /**
     * Retrieves data for a specific suspense level.
     * @param {number} level 
     * @returns {object|null}
     */
    getSuspenseData(level) {
        if (!this.suspenseLevelsData || this.suspenseLevelsData.length === 0) return null;
        // Try to find by explicit Suspense_Level property, otherwise use index if array matches 0-11
        const data = this.suspenseLevelsData.find(t => t.Suspense_Level == level) || this.suspenseLevelsData[level];
        return data || null;
    }

    /**
     * Returns the current Scene Suspense Level.
     * @returns {number}
     */
    getSceneSuspense() {
        return this.currentSceneSuspense;
    }

    /**
     * Retrieves the specific Tension and Pressure for a given element (Five Changes).
     * @param {string} element - The element name (e.g., 'Wood', 'Fire').
     * @returns {object|null} The tension and pressure data.
     */
    getFiveChangeDynamics(element) {
        if (!this.fiveChangesData || this.fiveChangesData.length === 0) return null;
        
        const change = this.fiveChangesData.find(c => c.Type.toLowerCase().includes(element.toLowerCase()));
        if (!change) return null;

        return {
            element: change.Type,
            tension: {
                name: change.Tension,
                description: change.Tension_Text
            },
            pressure: {
                name: change.Pressure,
                description: change.Pressure_Text
            },
            season: change.Season,
            direction: change.Direction
        };
    }

    /**
     * Clamps the suspense level between 0 and 11.
     * @param {number} level 
     * @returns {number}
     */
    _clampLevel(level) {
        const max = 11; // Catastrophic
        return Math.max(0, Math.min(level, max));
    }

    /**
     * Checks if the Scene pulls the Act suspense.
     * If Scene is 2 or more levels away from Act, Act moves 1 closer.
     */
    _checkPullEffects() {
        const diff = this.currentSceneSuspense - this.currentActSuspense;
        if (Math.abs(diff) >= 2) {
            if (diff > 0) {
                this.currentActSuspense++;
            } else {
                this.currentActSuspense--;
            }
            Logger.message(`T13NE_Suspense: Scene pulled Act Suspense to ${this.currentActSuspense}.`);
            this._checkActPullPlot();
        }
    }

    /**
     * Checks if the Act pulls the Plot suspense.
     * If Act is 2 or more levels away from Plot, Plot moves 1 closer.
     */
    _checkActPullPlot() {
        const diff = this.currentActSuspense - this.currentPlotSuspense;
        if (Math.abs(diff) >= 2) {
            if (diff > 0) {
                this.currentPlotSuspense++;
            } else {
                this.currentPlotSuspense--;
            }
            Logger.message(`T13NE_Suspense: Act pulled Plot Suspense to ${this.currentPlotSuspense}.`);
        }
    }
}

export default new T13NE_Suspense();
      
