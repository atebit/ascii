# 10 · Skill download, team-agnostic stage 5

- **Stage:** build, stage 5.
- **Asked:** the last screen should download the skill as a zip, since the game will be shared beyond FE; the skill that ships with the game must not reference FE.
- **Changed:** a portable edition of the skill in [skill/design-wireframe-ascii/](../skill/design-wireframe-ascii/) (SKILL.md, reference.md, and a README with install steps for Claude Code and Cursor), with no FE references. `build.py` embeds it and [src/zip.js](../src/zip.js) writes the zip in the browser. Stage 5 has a 4th move, DOWNLOAD THE SKILL (.ZIP); READ THE GUIDE is gone, because a repo link breaks once the file is shared and the zip carries the README. All stage 5 copy is team-agnostic. Storyboard frame 5 matches.
- **Check:** the skill reads well to someone outside the original team; keep it in sync with its source skill.
