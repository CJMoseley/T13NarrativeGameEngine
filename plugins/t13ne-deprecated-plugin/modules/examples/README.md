# Geometry examples

This folder contains quick usage examples for the ported geometry code.

Usage (browser):

1. Serve the `public/` directory from a static server (module imports require http(s)).
2. Import and run the examples from a page or the console:

```html
<script type="module">
  import { runExamples } from './js/examples/geometry-usage.js';
  runExamples();
</script>
```

Notes:
- The examples assume `t13ne-geometry.js` and `t13ne-dice.js` exist at `public/js/` and export the functions used by the examples.
- To get deterministic impressions, call `T13Dice.setSeed(seedValue)` before calling `calculateImpressions(..., 'rng')`.
