# 02 · Cat model and ASCII renderer

- **Stage:** build, step 1 (the cats first, before the screens).
- **Asked:** use three.js and render it as ASCII, for real depth; model the 3 cats in 3D first.
- **Changed:** added the cat model ([src/cats.js](../src/cats.js)), built from spheres, capsules, cones and tubes to match the reference, with breathing, tail sway, darting eyes, blinks, a wave and click reactions. Added the ASCII pass ([src/ascii.js](../src/ascii.js)): the scene renders at 2 pixels per cell, brightness picks the glyph, depth breaks draw `| / - \` outlines, and each cell gets a dim fill of its own color so eyes read as holes. Added the cat lab ([lab/cats.html](../lab/cats.html)), which shows the shaded model and the ASCII side by side, and [build.py](../build.py), which inlines three.js r170 into one shareable file.
- **Check:** how close the model is to the reference, whether the faces read in ASCII at full-screen size, and the look with cell fill on or off (`F`).
