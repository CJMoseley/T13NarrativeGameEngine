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
    {
        name: 'T13 Plugin',
        path: '@/plugins/t13ne/T13Plugin.js',
        className: 'T13Plugin'
    }
];




