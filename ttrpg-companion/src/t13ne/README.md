# T13NE Plugin for Wormhole Racers

This plugin integrates the T13NE narrative engine systems into the Wormhole Racers game engine. It exposes a rich API for procedural generation, AI-driven content, and complex narrative mechanics.

## Core Concepts

### Wyrd Tarot & Yarn Cards
The T13NE system utilizes **Wyrd Tarot** and **Yarn Cards**, which are distinct from standard Tarot decks.
*   **Wyrd Tarot**: These cards represent narrative forces and fate. While they may share suits with playing cards, their interpretation is deeply contextual to the T13NE system (e.g., Spades representing conflict or intellect, Hearts representing emotion or healing).
*   **Yarn Cards**: These represent meta-narrative interventions (e.g., Snags, Frays, Gains) that directly alter the flow of the story.

### Spreads
In T13NE, a "spread" is not limited to fortune-telling. It is a modeling tool for **any narrative structure**. A spread can represent a character's psychological state, the layout of a dungeon, the branching paths of a plot, or the outcome of a complex social interaction. The `interpretSpread` API is designed to handle this flexibility, allowing the AI to synthesize narrative meaning from any structural arrangement of cards.

## API Usage

The T13NE plugin exposes its functionalities through the `pluginManager` under the name `T13`. You can access the different modules like this:

```javascript
// Get the main API module
const t13MainApi = game.pluginManager.getApi('T13', 'WHRAPI_T13');

// Get the Facets module
const t13FacetsApi = game.pluginManager.getApi('T13', 'Facets');
```

### Main API (`T13`, `Main`)

This is the central access point for the plugin's configuration and high-level functionalities.

#### `getConfig()`
Retrieves the current plugin configuration, including AI and Codex settings.

-   **Returns**: `(object)` - The current configuration object.
-   **Example**:
    ```javascript
    const config = t13MainApi.getConfig();
    console.log(config.ai.provider); // 'ollama'
    ```

#### `setConfig(config)`
Updates the plugin's configuration and persists it to `localStorage`.

-   **Parameters**:
    -   `config` `(object)`: A configuration object. Can be a partial object containing only the keys to be updated (e.g., `{ ai: { model: 'new-model' } }`).
-   **Example**:
    ```javascript
    t13MainApi.setConfig({
        ai: {
            provider: 'ollama',
            model: 'llama3:8b'
        }
    });
    ```

#### `getAvailableModels()`
Fetches the list of available models from the configured AI provider (currently only supports Ollama for this feature).

-   **Returns**: `Promise<Array>` - A promise that resolves to an array of model objects. Each object contains details like `name` and `size`.
-   **Example**:
    ```javascript
    t13MainApi.getAvailableModels().then(models => {
        console.log(models);
        // Output might be: [{ name: 'llama3:8b', size: 8000000000, ... }]
    });
    ```

#### `interpretSpread(spreadName, cards, context)`
Uses the configured AI service to generate a narrative interpretation of a card spread. This method acknowledges that T13NE spreads can model any narrative structure, from character arcs to physical locations.

-   **Parameters**:
    -   `spreadName` `(string)`: The name of the spread (e.g., "The Hero's Journey", "Dungeon Layout", "Social Conflict").
    -   `cards` `(Array<object>)`: An array of card objects (Wyrd Tarot or Yarn Cards). Each object should have a `name` property and can optionally include `position` (the narrative slot they fill) and `meaning` (specific T13NE interpretation).
    -   `context` `(string)` (optional): The narrative context or question for the reading.
-   **Returns**: `Promise<string>` - A promise that resolves to the AI-generated interpretation text.
-   **Example**:
    ```javascript
    const cards = [
        { position: "Inciting Incident", name: "Ace of Spades", meaning: "A sudden conflict" },
        { position: "Rising Action", name: "Gain (Yarn Card)", meaning: "Unexpected resource" },
        { position: "Climax", name: "King of Hearts", meaning: "Emotional sacrifice" }
    ];

    t13MainApi.interpretSpread("Narrative Arc", cards, "How does the protagonist overcome their flaw?")
        .then(interpretation => {
            console.log(interpretation);
        });
    ```

### Other Exposed APIs

The following modules are also exposed directly for more specialized use:

-   **`T13Geometry`**: Provides methods for calculating geometric values from names and other data (e.g., `calculateFullGeo`, `calculateImpressions`).
-   **`NameGenerator`**: Generates names based on the T13NE geometry system.
-   **`Facets`**: Manages the 24 Facets of the T13NE system, providing access to their properties and related data.
-   **`Ordeals`**: Manages the logic for ordeals, challenges, and conflicts.
-   **`AINodes`**: Provides classes (`AIManager`, `DataExtractorNode`, etc.) for creating and running complex, node-based AI generation graphs.
