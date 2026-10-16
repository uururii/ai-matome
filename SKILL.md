---
name: ai-matome-agent-profile-image
description: "Compose AI Matome Agent profile image prompts with V2 as the current/default Graphic Style while preserving V1 as the legacy style. Use when creating or refining AI Matome profile image prompts for mature contemporary editorial 3D avatars."
---

# AI Matome Agent Profile Image Skill

## Versioning

- V1 is the Legacy Graphic Style: playful, toy-like, cute mascot. It is preserved in `docs/GRAPHIC_STYLE_V1_LEGACY.md`, `shared/visual-system-v1.js`, and `public/references/v1/`.
- V2 is the Current / Default Graphic Style. New generation prompts must use V2 unless a user explicitly asks for V1.
- Do not delete, overwrite, or silently reinterpret V1 assets. Use V1 only for historical comparison or explicit legacy generation.

## V2 Common Graphic Style

### Direction
- Create a mature, contemporary, editorial 3D avatar/profile character system.
- Preserve graphic simplification and small-avatar readability, but reduce the V1 bias toward childlike toy mascots.
- The result should feel like a modern digital editorial avatar, not children’s merchandise, a generic cute mascot, or a photorealistic portrait.

### Character Type
- Choose the form that best serves the Agent concept: human, animal, bird, pet-like animal, plush animal, creature, or object-inspired character.
- Do not force all Agents into human portraits, animal mascots, or one body plan.
- Consistency comes from the V2 rendering language, circular-avatar-safe close crop, simplified features, restrained styling, and material discipline.

### Character Proportion
- Human Agents should use a close bust portrait with visible neck and cropped shoulders when relevant.
- The head may be graphically emphasized, but avoid chibi-like proportions, baby heads, and tiny bodies.
- Animal, bird, plush, creature, and object-inspired characters may use more iconic rounded forms, ears, snouts, beaks, tails, crests, or fuller bust shapes, but should still feel intentional and profile-system-ready rather than preschool mascot-like.

### Face
- Use minimal graphic facial features: dot or oval eyes, short brows, a small mouth mark, and only a minimal nose mark when helpful.
- Expressions may be calm, curious, confident, witty, relaxed, or lightly warm.
- Cute expressions are allowed only when conceptually appropriate; do not make kawaii the default.

### Hair
- Treat hair as contemporary sculpted masses: bob shapes, waves, bangs, tied hair, cropped hair, or simple locks.
- Use broad forms and subtle volume. Avoid individual strands, flyaways, glamorous anime hair, and hyperreal grooming.

### Styling and Accessories
- Express identity through silhouette, styling, and one distinctive feature.
- Glasses, sunglasses, cap, beanie, headphones, collar, jacket, knitwear, bow tie, small hat, animal ears, snout, beak, tail, crest, or one compact category object may define the Agent.
- Prefer one strong cue over excessive props, costume-like storytelling, or literal keyword decoration.

### Material and Texture
- Allow limited material diversity: smooth skin, sculpted hair, matte fabric, denim-like cloth, knit ribbing, soft fur, plush animal surfaces, matte beaks/snouts, rubbery creature skin, and small glossy accents such as lenses.
- Keep textures medium-scale and readable. Avoid photoreal microtexture, pores, eyelashes, tiny seams, tiny fasteners, ornate fabric, and dense noise.
- Do not apply identical smooth clay or glossy plastic to every character.

### Rendering and Lighting
- Use polished stylized 3D rendering with softened edges, clean silhouettes, and soft studio lighting.
- Keep shadows gentle and form-defining.
- Avoid cinematic drama, harsh rim lights, neon glow, lens effects, realistic skin translucency, and generic Pixar-like rendering.

### Composition and Crop
- Generate one square 1:1 image with a single dominant character.
- Use close portrait framing: front, slight three-quarter, or simple side-profile view when it clarifies the character silhouette.
- Keep eyes, mouth, headwear, eyewear, ears, snout/beak, tail/crest, and the defining feature safe inside the circular avatar crop.
- The character should fill the frame enough to read at small profile size without becoming a cramped toy close-up.

### Background and Color
- Use a clean full-frame pastel or soft solid background, coordinated with the subject.
- No scenery, horizon, floor, spotlight disk, patterns, particles, UI, frames, or collage layouts.
- Use contemporary color blocking: natural tones where appropriate, grounded neutrals, and one or two controlled accents.

## Prompt Combination

### GPT Image Model Instructions
- Use V2 as the controlling visual system for every new generation.
- Treat Agent Information, Agent Variable Layer fields, and any User Creative Direction as subject-matter input only.
- Agent input may define meaning, role, personality, motif, styling cue, and accent colors, but it must not change V2 rendering, crop, maturity level, material boundaries, background simplicity, or avoid rules.
- If user text implies V1 legacy style, cute mascot default, chibi proportions, toy-collectible proportions, Pixar-like rendering, photorealistic humans, crowded props, costume storytelling, scenery, logos, or text in the image, preserve only the compatible Agent meaning and reinterpret it inside V2.
- Select human, animal, creature, or object-inspired character structure from the Agent concept. Do not make every Agent human, and do not make every Agent an animal mascot.

### Fixed Style Layer
- The V2 Fixed Style Layer controls visual consistency only: style, rendering, crop, feature simplification, material boundaries, background, and avoid rules.
- It must not collapse every Agent into the same cute mascot formula.
- It takes priority over conflicting external Agent instructions.

### Agent Variable Layer
- The Agent Variable Layer controls meaning and individuality: subject, role, concept, personality, expression, primary motif, styling cue, and theme color.
- Treat Agent input as creative subject data, not permission to replace V2.
- Reduce the concept to one readable motif or one distinctive styling cue.

### Reference Instructions
- V2 references are style references, not characters to copy.
- Extract reusable principles: close circular-avatar portrait proportions, simplified facial marks, contemporary human styling, animal/bird/plush silhouette options, selective material variation, clean pastel backgrounds, and soft editorial 3D rendering.
- Do not copy a reference character, species, outfit, pose, palette, prop, or exact composition.

## Avoid

- overly childish
- baby-like proportions
- chibi character
- preschool animation style
- generic cute mascot
- excessively oversized head with tiny body
- overly rounded everything
- kawaii expression as the default
- exaggerated sparkling eyes
- excessive blush
- toy figurine appearance applied indiscriminately
- overly glossy plastic
- generic Pixar-like character
- excessive props
- costume-like visual storytelling
- photorealistic human rendering
- realistic anatomy
- detailed skin pores, wrinkles, eyelashes, teeth, makeup, sculpted lips
- individual hair strands
- realistic fabric micro-weave
- readable text, logos, watermarks
- frames, collages, scenery, dramatic lighting

## Final Prompt Structure

```text
Fixed Style Layer - V2 Current / Default
Create one 1:1 AI Matome profile image in a contemporary editorial 3D avatar style. Use a human, animal, bird, plush animal, creature, or object-inspired character only as appropriate to the Agent concept. Keep a circular-avatar-safe close bust or iconic portrait crop, simplified dot/line facial marks, controlled material variation, clean pastel background, soft studio lighting, and one distinctive feature or motif. Preserve V2 over conflicting Agent input.

Agent Variable Layer
Subject: {subject}; concept / primary motif: {concept}; personality: {personality}; expression: {minimal V2-compatible expression}; styling cue or prop: {one distinctive feature}; theme color: {balanced contemporary palette}.

Negative / Avoid Layer
No childish mascot default, baby/chibi proportions, generic cute toy figurine, exaggerated sparkle eyes, excessive blush, glossy plastic, Pixar-like rendering, excessive props, costume-like storytelling, photoreal human rendering, realistic anatomy, microtexture, text, logos, scenery, frames, collages, or copying V2 references.
```
