/**
 * Plugin Configuration
 * 
 * Defines the list of plugins to be loaded by the GameEngine.
 * 
 * Structure:
 * [
 *   {
 *     path: 'path/to/plugin/module.js', // Relative to GameEngine.js or absolute
 *     className: 'PluginClassName'       // The exported class name
 *   }
 * ]
 */
export const PluginConfig = [
    // Example (uncomment and adjust path if T13NE.js exists):
    // {
    //     path: '../../t13ne/public/js/T13NE.js',
    //     className: 'T13NE'
    // }
];
