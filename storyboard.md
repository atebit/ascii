```yaml
title: What is ASCII? Storyboard
date: 2026-10-11
author: Christopher Smith
status: storyboard (iteration 01)
```

# What is ASCII? Storyboard

The 5 screens for the in-browser explainer, in order. Each frame is a rough sketch of the layout at 78 by 24 characters. The real app renders the same layout full-screen, in color, and in motion.

## The whole game

These rules apply to every screen.

- **Text only.** Every pixel on screen is a character on a grid, including the HUD, the 3D scenes and the transitions. No images, no icons, no SVG.
- **Arcade look.** Black background, CRT scanlines and a soft glow. Colors from the start-screen reference: hot pink grid, yellow-to-orange title, cyan and pink star specks, white HUD text.
- **HUD.** The top bar shows the stage on the left and a live counter on the right. The bottom bar shows back, 5 hearts and next. The counters do real work: chars on screen, fps, tokens.
- **Controls.** `→` `SPACE` `ENTER` go forward, `←` goes back, `ESC` returns to the title. Click and swipe work too. A stage dot or number key jumps straight to that stage.
- **Transitions.** The screen scrambles into random characters, then resolves into the next stage, while the camera flies forward through the star field.
- **Sound.** Chiptune bleeps on start, next and the cat clicks. Off until the player turns it on (`M`).
- **Legend:** `█ ╔ ║` big type · `/ │ \ ─` perspective grid · `●` eyes open · `-` eyes shut · `▸ ◂` next and back · `♥` hearts.

## 1. Title screen

```text
╔═ 1UP 000524 ═══════════════════════════════════════════════════ HI 999999 ═╗
║   .        +          .            *        .          +       .           ║
║      ___         .         +            .         *          .             ║
║   .-'###'-.  ~~~~~~      .        .           +          .        *        ║
║  =(########)=========          *        .            .                     ║
║   '-.###.-'  ~~~~~~      +               .      *           +              ║
║      '''          .                .                  .                    ║
║                            W  H  A  T     I  S                             ║
║                   █████╗ ███████╗ ██████╗██╗██╗ ██████╗                    ║
║                  ██╔══██╗██╔════╝██╔════╝██║██║ ╚════██╗                   ║
║                  ███████║███████╗██║     ██║██║   ▄███╔╝                   ║
║                  ██╔══██║╚════██║██║     ██║██║   ▀▀══╝                    ║
║                  ██║  ██║███████║╚██████╗██║██║   ██╗                      ║
║                  ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝╚═╝   ╚═╝                      ║
║                                                                            ║
║                 P R E S S   S T A R T   B U T T O N . . .                  ║
║                                                                            ║
║                       ░░▒▒▓▓█████████████████▓▓▒▒░░                        ║
║       / /  / / / / /  / / / / /  / / │ \ \  \ \ \ \ \  \ \ \ \ \  \ \      ║
║──/───/──/───/──/───/───/──/───/──/───│───\──\───\──\───\───\──\───\──\───\─║
║   /    /    /    /    /    /    /    │    \    \    \    \    \    \    \  ║
║/─────/─────/──────/─────/──────/─────│─────\──────\─────\──────\─────\─────║
║       /       /      /       /       │       \       \      \       \      ║
║─/────────/─────────/────────/────────│────────\────────\─────────\────────\║
╚═ CREDIT 01 ════════════════════ ♥ ♥ ♥ ♥ ♥ ══════════════════════ STAGE 01 ═╝
```

- **Look:** a big, bold "WHAT IS ASCII?" logo in block characters, shaded yellow to orange, over a synthwave grid that rolls toward the player forever. A ringed planet drifts top left.
- **Motion:** the logo drops in one letter at a time and settles with a bounce, then bobs. "PRESS START BUTTON..." blinks. The horizon glows and pulses. Star specks twinkle and stream past.
- **Interaction:** any key or click starts the game with a coin sound and the scramble transition. `1UP` counts up while the player waits on this screen.

## 2. What is ASCII?

```text
╔═ STAGE 02 · WHAT IS ASCII? ═════════════════════════════════ CHARS 000095 ═╗
║                                                                            ║
║        ~ } | { z y x w v u t s r q p o n m l k j i h g f e d c b a         ║
║     ` _ ^ ] \ [ Z Y X W V U T S R Q P O N M L K J I H G F E D C B @        ║
║        ? > = < ; : 9 8 7 6 5 4 3 2 1 0 / . - , + * ) ( ' & % $ # " !       ║
║           ( the 95 printable characters, spinning as a 3D ring )           ║
║                                                                            ║
║                         ╔═════════╗                                        ║
║                         ║         ║                                        ║
║                         ║    A    ║   ◂  65  ·  01000001                   ║
║                         ║         ║                                        ║
║                         ╚═════════╝                                        ║
║                                                                            ║
║         IT'S JUST THE CHARACTERS YOUR COMPUTER USES TO WRITE TEXT.         ║
║                                                                            ║
║                128 codes  ·  95 you can see  ·  since 1963                 ║
║                                                                            ║
║            ▸ PRESS ANY KEY ON YOUR KEYBOARD TO SEE ITS NUMBER ◂            ║
║                                                                            ║
╚═ ◂ BACK ═══════════════════════ ♥ ♥ ♥ ♥ ♥ ════════════════════════ NEXT ▸ ═╝
```

- **Message:** it's just the characters your computer uses to write text.
- **Look:** the 95 printable characters orbit as a 3D ring. One character sits in a glowing tile in the middle with its number and its 8 bits.
- **Motion:** the ring slowly spins and tilts. When a character passes the front, it brightens.
- **Interaction:** the player presses any key on their own keyboard. That character flies out of the ring into the tile, and its number and bits count up. `CHARS` counts how many they've tried.
- **Fact line:** 128 codes, 95 you can see, since 1963. Footnote on hover: the block letters and box lines in this game are extended characters, a few steps past the original 128. Same idea.

## 3. How can it be super sick?

```text
╔═ STAGE 03 · HOW CAN IT BE SUPER SICK? ══════════════ 4,312 CHARS × 60 FPS ═╗
║                               /\       /\                                  ║
║                .-.           /  \_____/  \                                 ║
║               ( @ )         |  ^       ^  |       pink · top               ║
║                \ \          |     =v=     |       happy eyes, waving       ║
║                 \ \_________ \___________/                                 ║
║                  \__________\|::::::::::|     .-.                          ║
║           /\       /\        |::::::::::|    ( (                           ║
║          /  \_____/  \       |::::::::::|     ) )    orange · middle       ║
║         |  (●)   (●)  |______\::::::::::/____/ /     eyes dart around      ║
║   .-.   |     =v=     |::::::::::::::::::::::::/                           ║
║  ( (     \___________/::::::::::::::::::::::/                              ║
║   ) )   (__)(__)___________________________/                               ║
║  ( (     _____________________   /\       /\                               ║
║   \ \___/:::::::::::::::::::::\_/  \_____/  \       grey · bottom          ║
║    \:::::::::::::::::::::::::::|  -       -  |  z Z  asleep, breathing     ║
║     \::::::::::::::::::::::::::|     =v=     |                             ║
║      `--(__)--(__)-------------\___________/                               ║
║                                                                            ║
║              SAME 95 CHARACTERS.  ADD DEPTH, LIGHT AND TIME.               ║
║       [DRAG] orbit   [SCROLL] zoom   [CLICK] a cat   [R] render mode       ║
╚═ ◂ BACK ═══════════════════════ ♥ ♥ ♥ ♥ ♥ ════════════════════════ NEXT ▸ ═╝
```

- **Message:** same 95 characters. Add depth, light and time.
- **Look:** the 3 stacked cats from the reference image, as a real 3D scene drawn in characters. Shading uses a brightness ramp (`.:-=+*#%@`) so the cats look rounded and lit. Grey cat lies at the bottom, orange cat lies on top of it, pink cat sits at the back and waves.
- **Motion:** the stack turns slowly on a turntable. Every cat moves a little:
  - pink waves its paw, blinks, and smiles with `^ ^` eyes
  - orange's pupils dart around, and its tail sways
  - grey is asleep: its body rises and falls, and `z Z` float up
  - all 3 blink now and then, out of sync
- **Interaction:** drag to orbit, scroll to zoom. Clicking a cat makes it react (a `mrrp!` pops up, the grey cat opens one eye). `R` swaps render mode: shaded, wireframe, falling green code. The HUD shows the real character count and fps.

## 4. How we use it in design, now with AI

```text
╔═ STAGE 04 · HOW WE USE IT WITH AI ══════════════════ TOKENS SAVED 019,000 ═╗
║                                                                            ║
║            VS.   ─────────────────────────────────────────────             ║
║    HTML MOCKUP   ████████████████████████████████████████  ~20,000 tok     ║
║    ASCII FRAME   ██                                         ~1,000 tok     ║
║        ( token counts are placeholders: measure before the build )         ║
║                                                                            ║
║   ┌─ DECISION TREE ─┐   ┌─ DATA ROUTE ────┐   ┌─ UI WIREFRAME ──┐          ║
║   │   [Open app]    │   │ Form ──▸ Check  │   │ ┌─ Inbox ─────┐ │          ║
║   │     ╱     ╲     │   │  Error ◂─┤      │   │ │ ● Ana  2m   │ │          ║
║   │  [Yes]    [No]  │   │          ▾      │   │ │ ● Dale 14m  │ │          ║
║   │   │        │    │   │ Notify ◂─Save   │   │ │ ○ Priya 1d  │ │          ║
║   │ Sign in Sign up │   │  └─▸ Team       │   │ └─────────────┘ │          ║
║   └─────────────────┘   └─────────────────┘   └─────────────────┘          ║
║       ◂  1 / 4  ▸        next: [ 1·Open ] › [ 2·Pick ] › [ 3·Done ]        ║
║                                                                            ║
║                    VERY, VERY FAST AND TOKEN EFFICIENT.                    ║
║           THE AI READS IT, WRITES IT AND CHANGES IT IN SECONDS.            ║
║                                                                            ║
╚═ ◂ BACK ═══════════════════════ ♥ ♥ ♥ ♥ ♥ ════════════════════════ NEXT ▸ ═╝
```

- **Message:** very, very fast and token efficient. The AI reads it, writes it and changes it in seconds.
- **Look:** a race at the top: an HTML mockup bar against an ASCII frame bar, filling up with tokens. Below it, a 3D carousel of real examples.
- **Motion:** the race runs when the stage opens, and the ASCII bar finishes first. Each carousel card draws itself in line by line, like an AI is typing it.
- **Carousel:** 4 cards, `◂ ▸` to turn:
  1. decision tree
  2. complex data route
  3. UI wireframe
  4. micro-flow `[ 1·Open ] › [ 2·Pick ] › [ 3·Done ]`
- **Interaction:** pressing `E` on a card makes a quick edit happen live (a branch is added, a row moves), to show how cheap a change is.
- **To check before the build:** the token numbers. They're placeholders. Measure a real ASCII wireframe against the same screen built as HTML, and use those numbers.

## 5. How to get started

```text
╔═ STAGE 05 · HOW TO GET STARTED ════════════════════════════════ HI 999999 ═╗
║                             C O N T I N U E ?                              ║
║                                   █████╗                                   ║
║                                  ██╔══██╗                                  ║
║                                  ╚██████║                                  ║
║                                   ╚═══██║                                  ║
║                                   █████╔╝                                  ║
║                                   ╚════╝                                   ║
║    CHOOSE YOUR MOVE · SAY THIS TO THE AGENT                                ║
║    ──────────────────────────────────────────────────────────────────      ║
║  ▶ 1  SKETCH ONE SCREEN                                                    ║
║       "I'm working on {project} and I'd like to explore {a screen}         ║
║        with the ascii wireframe skill."                                    ║
║    2  GO WIDE                                                              ║
║       "...go wide on {a screen or flow}..., 10 different concepts."        ║
║    3  MAP A FLOW                                                           ║
║       "...map the step-by-step flow for {an interaction}..."               ║
║    4  DOWNLOAD THE SKILL (.ZIP)                                            ║
║                                                                            ║
║        [↑ ↓] choose   [ENTER] copy or download   [ESC] title screen        ║
╚═ CREDIT 00 ════════════════════ ♥ ♥ ♥ ♥ ♥ ════════════════════ GAME CLEAR ═╝
```

- **Message:** you can do this today, in any project, with any team.
- **Look:** an arcade "CONTINUE?" screen with a big countdown, and a move list underneath.
- **Motion:** the countdown ticks from 9 to 0 and loops while the player reads. The selected move glows.
- **Interaction:** `↑ ↓` picks a move. `ENTER` copies the prompt with a "COPIED! FILL IN THE { }" flash, or on move 4 downloads the skill as a zip. When the countdown hits 0, it shows "THANKS FOR PLAYING" and offers the title screen.
- **Moves:** each prompt is a fill-in template that uses the `design-wireframe-ascii` skill in a different mode, with the `{ }` placeholders in gold:
  - sketch one screen → Diverge
  - go wide → Diverge with 10 concepts
  - map a flow → Detail
  - download the skill → a portable zip with install steps for Claude Code and Cursor
