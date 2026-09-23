# POQIT Master Asset Production Prompt

Create a complete, production-ready visual asset and micro-animation system for **POQIT**, a lightweight Windows utility that lets users quickly keep files, images, links, and copied content in a contextual pocket.

## Reference images

Use the supplied POQIT files as strict visual references:

- `primarylogo.png` — authoritative pocket shape, materials, card arrangement, lighting, and proportions.
- `App-icon.png` — authoritative app-icon framing and finish.
- `logo.png` — authoritative POQIT wordmark and brand composition.
- `tray.png` — existing tray-icon direction.
- `drop-target.png` — existing interaction concept.

Preserve the recognizable POQIT design: a **wide, softly squared white 3D pocket** with a thick curved front lip. It normally contains three layered content cards:

1. A white document card with gray lines.
2. A warm orange image card.
3. A vivid blue link card with a white chain symbol.

Two compact vivid-blue activity marks may appear above the pocket when useful.

## Visual language

- Premium, soft 3D UI illustration suitable for a modern Windows utility.
- Bright white or very pale cool-gray environments.
- Vivid POQIT blue as the primary accent.
- Warm orange only for image-related content or a small relevant detail.
- Soft studio lighting, subtle cool shadows, rounded materials, restrained depth.
- Calm, functional, friendly, and non-distracting.
- The pocket must remain wide and softly squared, matching the references.
- Existing cards should remain visible whenever the pocket is active so it never reads as an empty cup.

## Never use

- Purple, pink, magenta, dark-mode backgrounds, neon glows, or decorative gradients.
- Empty cylindrical cup, bucket, basket, plant pot, or trash-bin silhouettes.
- Mascots, people, hands, confetti, sparkles, excessive particles, or playful clutter.
- Red alarm styling unless explicitly required for a destructive error.
- Baked-in headings, labels, buttons, or marketing copy.
- Watermarks or invented branding.
- Generic SaaS illustration styling that changes the POQIT pocket proportions.

## Required animation set

Produce every animation separately as an embedded-asset **Lottie JSON**, plus **GIF** and **H.264 MP4** previews.

Technical requirements:

- Canvas: `512 × 512`.
- Playback: `60 fps` Lottie and MP4; GIF may be `30 fps`.
- One-shot playback with looping disabled in production.
- Use smooth ease-out movement and a quiet settle; no elastic cartoon bounce.
- Include descriptive Lottie markers.
- Preserve the supplied POQIT artwork directly where possible.

### 1. Hover

Filename prefix: `poqit-hover`

- Duration: approximately `600 ms`.
- The complete branded pocket lifts by only a few pixels and scales up subtly.
- Cards stay seated inside the pocket.
- Finish with a soft, controlled settle.
- Markers: `hover-in`, `settle`.

### 2. Item Enter

Filename prefix: `poqit-item-enter`

- Duration: approximately `700 ms`.
- Start with the complete branded pocket and its existing three cards visible.
- A fourth small generic document approaches diagonally from above-left.
- The pocket reacts with a tiny scale/depth change.
- The incoming document reduces slightly in scale and disappears **behind the actual curved front lip**, not into an empty opening.
- Finish with a subtle pocket settle.
- Markers: `approach`, `enter-pocket`, `settle`.

### 3. Item Received

Filename prefix: `poqit-item-received`

- Duration: approximately `700 ms`.
- The complete branded pocket compresses downward slightly, rises a few pixels, then settles.
- A compact vivid-blue circular confirmation with a white check appears near the upper-right.
- Keep the confirmation small and functional; no confetti.
- Markers: `receive`, `confirm`, `settle`.

## Required still-image set

Export each as an individual PNG with no baked-in text.

### Drop Active

Filename: `poqit-drop-active.png`

- Square composition.
- Complete branded pocket with the three familiar cards.
- A fourth document hovers above the opening.
- Add a small blue plus indicator and restrained blue receiving outline around the lip.

### Empty Shelf

Filename: `poqit-empty-shelf.png`

- Square composition with generous whitespace.
- Quiet POQIT pocket illustration for an empty application panel.
- Use faint translucent document, image, and link placeholders to imply supported content.
- Avoid a completely empty opening that resembles a cup.

### Broken File

Filename: `poqit-broken-file.png`

- Square compact status illustration.
- Show the branded pocket and cards.
- One document card carries a subtle neutral-gray broken-link indicator.
- The state should feel recoverable, not alarming; do not use red.

### Loading Mark

Filename: `poqit-loading-mark.png`

- Square PNG with a genuinely transparent background.
- Simplified white pocket, blue link card, white document, and two blue activity marks.
- Must remain readable at `64–128 px`.
- Do not place it inside an app-icon tile.

### Installer Artwork

Filename: `poqit-installer-artwork.png`

- Wide `16:9` image.
- Complete POQIT pocket on the right half.
- Small Windows-style four-pane blue tile moving toward the pocket.
- Keep the left half clean for native installer copy and controls.

### Website Hero

Filename: `poqit-website-hero.png`

- Wide `16:9` image.
- Complete branded pocket on the right.
- Two or three generic document, image, and link tiles approach in a gentle arc.
- Keep the left half spacious for native headline and call-to-action elements.

## Export checklist

Deliver these files separately:

```text
poqit-hover.lottie.json
poqit-hover-preview.gif
poqit-hover-preview.mp4
poqit-item-enter.lottie.json
poqit-item-enter-preview.gif
poqit-item-enter-preview.mp4
poqit-item-received.lottie.json
poqit-item-received-preview.gif
poqit-item-received-preview.mp4
poqit-drop-active.png
poqit-empty-shelf.png
poqit-broken-file.png
poqit-loading-mark.png
poqit-installer-artwork.png
poqit-website-hero.png
```

Before delivery, verify that every file opens correctly, animation durations match the specification, the loading mark retains transparency, and the pocket silhouette remains faithful to `primarylogo.png`.
