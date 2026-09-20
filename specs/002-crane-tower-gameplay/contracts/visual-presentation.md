# Visual Presentation Contract

## Requested visual language

The game must read immediately as a playful city-construction tower game, using original procedural drawing rather than imported reference-game assets.

## Required scene layers

1. A bright vertical sky gradient with a sun glow and multiple soft cloud silhouettes.
2. At least two distant city layers with different tone/scale to create depth.
3. A visible crane boom or pivot, cable, hook, and connector attached to the active floor while it sways.
4. Building floors that read as architecture rather than plain blocks: facade body, top/bottom bands, shaded side, window grid, and small deterministic variation.
5. A tower whose accumulated floors keep their own facade detail and subtle placement tilt.
6. Detached masonry made from facade-colored chunks, darker interior edges, rotation, gravity, and brief dust puffs.
7. A readable score/status HUD and a restrained Game Over overlay that leaves the constructed tower visible.

## Responsive and accessibility rules

- The play surface remains portrait-oriented and fits narrow screens without horizontal page scrolling.
- Score, status, controls, crane load, and top support remain distinguishable at the smallest supported width of 320 CSS pixels.
- Text and controls retain readable contrast against their backgrounds.
- Pointer/touch input uses the whole Canvas; keyboard input continues to use Space and R.
- Motion conveys state but is not the only cue: cable attachment, status text, debris, and overlay provide redundant feedback.

## Identity boundary

- Keep the title `Skyline Stack`.
- Do not reproduce City Bloxx/Tower Bloxx logos, names, character art, sprites, exact UI panels, music, sound effects, or source code.
- The similarity target is the broad crane-building atmosphere, readable modular floors, vertical city scale, and one-action timing rhythm.
