# 04 · Full game, all 5 stages

- **Stage:** build.
- **Asked:** the full game experience, built by subagents; the pink cat is missing its tail.
- **Changed:** a shell with a stage contract, HUD, keys, swipe, stage dots, scramble-and-warp transitions, CRT overlay and chiptune SFX ([src/game.js](../src/game.js), [src/game-core.js](../src/game-core.js)). Stage 1 is the title from the start-screen reference; stage 2 is the character ring and key tile; stage 3 is the cats; stage 4 is the token race and wireframe carousel; stage 5 is the CONTINUE? countdown and copyable prompts. Added the pink tail. `python3 build.py` builds [index.html](../index.html); `--only N` builds a dev page with the other stages stubbed.
- **Check:** each stage in a real browser at full screen and phone width; frame rate on stages 2 to 5; the stage 4 token numbers are still placeholders.
