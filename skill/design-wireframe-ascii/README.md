# design-wireframe-ascii

A skill for coding agents that sketches screens and flows as ASCII wireframes. It goes wide with different concepts, combines the best, stress-tests them with scenarios, and maps interactions step by step. Text only, so it's fast and cheap on tokens.

## Files

- `SKILL.md`: the method. The agent reads it when your ask matches its description.
- `reference.md`: the templates for each mode.
- `README.md`: this file.

## Install

Unzip so the folder sits at `<skills folder>/design-wireframe-ascii/SKILL.md`.

**Claude Code**, for one project (commit it to share with your team):

```sh
mkdir -p .claude/skills
unzip design-wireframe-ascii.zip -d .claude/skills/
```

**Claude Code**, for every project on your machine:

```sh
mkdir -p ~/.claude/skills
unzip design-wireframe-ascii.zip -d ~/.claude/skills/
```

**Cursor**, for one project:

```sh
mkdir -p .cursor/skills
unzip design-wireframe-ascii.zip -d .cursor/skills/
```

Start a new agent session so it picks up the skill.

## Use

Paste a prompt and fill in the `{ }`:

1. Sketch one screen: "I'm working on {project} and I'd like to explore {a screen} with the ascii wireframe skill."
2. Go wide: "I'm working on {project} and I'd like to go wide on {a screen or flow} with the ascii wireframe skill, 10 different concepts."
3. Map a flow: "I'm working on {project} and I'd like to map the step-by-step flow for {an interaction} with the ascii wireframe skill."

For example: "I'm working on a recipe app and I'd like to explore the settings page with the ascii wireframe skill."

The agent saves each step as markdown in a `wireframes/` folder. Say where if you want it somewhere else. Then ask it to combine concepts, stress-test the design, or detail an interaction.
