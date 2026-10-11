---
name: design-wireframe-ascii
description: Generate ASCII wireframes and run a diverge → converge design cycle for a UI or interaction idea. Go wide with genuinely different concepts, converge the best into 1–2 designs, stress-test them with scenarios, and detail interactions as `[ ] › [ ] › [ ]` micro-flows. Saves each stage as a markdown file in a wireframes/ folder. Use to sketch, wireframe or prototype a UI, panel, screen or flow in ASCII, "go wide", combine concepts, stress-test a design, or map a micro-interaction. Text only.
---

# design-wireframe-ascii

**Not for:** real UI code or images (no React, HTML or generated images; a running prototype is a different job) · Figma (use the Figma tools) · product definition (fold outputs into a PRD or spec, don't replace it) · a product scope, coherence or impact question.

## Modes

A cycle, not a line: stress-test gaps feed a re-diverge or a refined v2. Run only the mode the ask needs:

- "sketch / wireframe / go wide / more concepts" → **Diverge**
- "combine / refine / which is best / lock a direction" → **Converge**
- "what does it look like when… / scenarios / at scale" → **Stress-test**
- "show the micro-interaction / step flow / `[]›[]›[]`" → **Detail**

## Rules (every mode)

1. **Declare the frame first:** the surface (sidebar, modal, full screen…), the real-estate constraint ("thin vertical ~34 cols"), and the primary user. Every mock fits it. A mock that overflows lies about the design; change the constraint explicitly instead.
2. **Legend once:** define a small glyph vocabulary (e.g. `● done ◐ current ○ todo · ⚠ attention · → action`) and reuse it verbatim. Never use a glyph you didn't legend.
3. **Ground, don't invent:** when sketching a real system, read its files (front matter, folders, statuses) so labels and states are truthful. Never fabricate gate criteria, statuses or side effects. Mark anything speculative, and keep example data consistent across a doc.
4. **Name the tension:** every catalog, design and scenario names its load-bearing assumption, what you invented, and its trade-offs and gaps.
5. **Prose:** plain, specific, short. This governs prose only. ASCII mocks, the glyph legend and `[ ] › [ ] › [ ]` notation stay verbatim.
6. One topic per run. Modes can run in sequence across turns.

## Output

Save to a `wireframes/` folder at the project root, or wherever the user says:

```text
wireframes/<topic>-concepts.md                     # Diverge catalog
wireframes/<topic>-refined-design.md               # Converge candidate(s)
wireframes/<topic>-scenarios.md                    # Stress-test user stories
wireframes/<topic>-<interaction>-microflow.md      # Detail flow
```

Each file opens with a leading ```` ```yaml ```` fence: `title`, `date`, `author`, `status: prototype (<mode>)`, `topic`. Read the project's related design docs (start from user flows when they exist), research and spec as needed. Read `reference.md` for the per-mode templates before drafting.

## Diverge

- N concepts (default 5; "go wide" → 10+), each a different **organizing principle** (by stage, object, time, action, relationship), not a restyled copy. Two concepts that differ only cosmetically are one concept.
- Open with a **divergence map**. Each concept carries a name and one-line concept, the one data point it privileges, an ASCII mock, and a one-line strength and weakness.
- Close with a **cross-concept comparison** (rate each on the jobs that matter, e.g. overview / detail / scales-in-space / familiarity) and the **organizing axes** the set collapses to. Tee up convergence; never pick a winner silently.

## Converge

1. Ask the user for the anchors (which concepts or axes to fuse), offering a recommended default. Convergence is the user's call.
2. Draft the combined design as **zones** (persistent, toggled, on-demand), showing the default state and any expanded or alternate states.
3. Record this iteration's **locked decisions** at the top.
4. Define the **signal system:** which data points sit on the always-visible surface vs revealed on expand, at ~2–3 signals per line before it's noise.
5. List the **open questions** the mock can't resolve. They seed the next loop.

## Stress-test

Write ~8–12 user stories covering the stress axes in `reference.md`, render each in the design, and name the gap it exposes. Always end with a **Synthesis** table (`Gap | Triggered by | Fix`). The gaps are the deliverable. Offer to fold them into the refined design as **v2**.

## Detail

1. **Glance flow** first: the whole sequence on one line, with branches.
2. **One panel state per step,** each noting what fires under the hood when it maps to a real command, API call or operation, grounded in the real contract.
3. The **state transition** the object undergoes and, where useful, a before/after of how it reads back in the parent surface.
4. Close with **design notes and open questions** (undo? failure paths? where is it triggered?).

End every run by offering the next arc of the cycle.
