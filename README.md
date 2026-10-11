# What is ASCII?

A small arcade-style game that explains ASCII and how to use ASCII wireframes in design with AI. Everything on screen is text characters: three.js scenes render through an ASCII shader, with the HUD and copy as text on top.

## Play

**[atebit.github.io/ascii](https://atebit.github.io/ascii/)**. Or download [index.html](index.html) and open it in a browser. It's one self-contained file (three.js is inlined); only the arcade font loads from Google Fonts. `#1` to `#5` jump to a stage. Press `M` for sound and music.

## The skill

[skill/design-wireframe-ascii/](skill/design-wireframe-ascii/) is the ASCII wireframe skill the game teaches, with install steps for Claude Code and Cursor. The last stage downloads it as a zip.

## Develop

Every push to `main` rebuilds the game and publishes it to GitHub Pages ([.github/workflows/pages.yml](.github/workflows/pages.yml)). Locally: edit `src/`, then run `python3 build.py` to rebuild `index.html` and `lab/cats.html`. The first build fetches three.js r170 into `vendor/` (needs npm). `python3 build.py --only N` builds `dev/stage-N.html` with the other stages stubbed. To preview, serve the folder, e.g. `python3 -m http.server 4173`.

## Files

- [storyboard.md](storyboard.md): the 5 screens, the HUD and controls, and the motion for each.
- `iterations/NN-<slug>.md`: one file per change, indexed below.
- [lab/cats.html](lab/cats.html): the cat lab, with the 3D model shaded and in ASCII side by side. Drag, scroll, click a cat; keys are listed in its top bar.
- `src/`: the parts. [ascii.js](src/ascii.js) is the ASCII renderer, [cats.js](src/cats.js) the cat model, [orbit.js](src/orbit.js) the drag and zoom.
- [build.py](build.py): builds each page as one HTML file with three.js r170 inlined. Run `python3 build.py` after editing `src/`.
- [index.html](index.html): the game, as one HTML file that opens in any browser. `#1` to `#5` jump to a stage.
- `src/game*.js`, `src/stage-N-*.js`: the shell and the 5 stages. `python3 build.py --only N` builds `dev/stage-N.html` with the other stages stubbed.
- `skill/design-wireframe-ascii/`: the portable edition of the skill, for any repo and team. Keep it in sync with the source skill it was adapted from.
- `src/zip.js`: the in-browser zip writer for the skill download.

## Iterations

| # | Change | Stage |
| --- | --- | --- |
| [01](iterations/01-storyboard.md) | Storyboard of the 5 screens | storyboard |
| [02](iterations/02-cat-model.md) | Cat model, ASCII renderer and cat lab | build |
| [03](iterations/03-brighter-cats.md) | Brighter cats | build |
| [04](iterations/04-full-game.md) | Full game, all 5 stages, pink tail | build |
| [05](iterations/05-title-credits.md) | Title screen credit lines | build |
| [06](iterations/06-stage-2-cta.md) | Stage 2 call to action | build |
| [07](iterations/07-stage-5-templates.md) | Stage 5 prompts as fill-in templates | build |
| [08](iterations/08-music.md) | Darkwave music | build |
| [09](iterations/09-generic-wireframes.md) | Generic wireframe examples | build |
| [10](iterations/10-skill-download.md) | Skill download, team-agnostic stage 5 | build |
| [11](iterations/11-github-pages.md) | GitHub Pages | ship |

## Open questions

- **Token numbers on stage 4.** Placeholders until we measure a real wireframe against the same screen built in HTML.
