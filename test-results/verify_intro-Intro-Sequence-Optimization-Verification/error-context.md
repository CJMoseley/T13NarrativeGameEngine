# Page snapshot

```yaml
- generic [active]:
  - generic:
    - heading [level=2]
    - paragraph
  - generic [ref=e5]:
    - generic [ref=e6]: "[plugin:vite:import-analysis] Failed to resolve import \"./scenecomponents/Starbox.js\" from \"src/t13ne/scenes/PlanetaryOrbitScene.js\". Does the file exist?"
    - generic [ref=e7]: /app/src/t13ne/scenes/PlanetaryOrbitScene.js:9:25
    - generic [ref=e8]: "7 | import { PlanetSurfaceEnvironment } from '../procgen/planet/PlanetSurfaceEnvironment.js'; 8 | import { PlanetaryRenderer } from '../rendering/PlanetaryRenderer.js'; 9 | import { Starbox } from './scenecomponents/Starbox.js'; | ^ 10 | import { Planet } from './scenecomponents/Planet.js'; 11 | import { Asteroid } from './scenecomponents/Asteroid.js';"
    - generic [ref=e9]: at TransformPluginContext._formatLog (file:///app/node_modules/vite/dist/node/chunks/config.js:28998:43) at TransformPluginContext.error (file:///app/node_modules/vite/dist/node/chunks/config.js:28995:14) at normalizeUrl (file:///app/node_modules/vite/dist/node/chunks/config.js:27118:18) at async file:///app/node_modules/vite/dist/node/chunks/config.js:27176:32 at async Promise.all (index 8) at async TransformPluginContext.transform (file:///app/node_modules/vite/dist/node/chunks/config.js:27144:4) at async EnvironmentPluginContainer.transform (file:///app/node_modules/vite/dist/node/chunks/config.js:28796:14) at async loadAndTransform (file:///app/node_modules/vite/dist/node/chunks/config.js:22669:26) at async viteTransformMiddleware (file:///app/node_modules/vite/dist/node/chunks/config.js:24541:20)
    - generic [ref=e10]:
      - text: Click outside, press Esc key, or fix the code to dismiss.
      - text: You can also disable this overlay by setting
      - code [ref=e11]: server.hmr.overlay
      - text: to
      - code [ref=e12]: "false"
      - text: in
      - code [ref=e13]: vite.config.js
      - text: .
  - button "Continue to Main Menu" [ref=e14] [cursor=pointer]
```