# Simple Roasted Brussels Sprouts

A quick, reliable Brussels sprouts recipe optimized for a Breville countertop oven, while
also working well in a conventional oven. Ready in about 30 minutes. This note is a
screenshot-ready demo of **Simple Gallery**, using the actual photos from the recipe below.

## The short version

Halve a pound of Brussels sprouts and toss them with olive oil, balsamic vinegar, salt, and
pepper. Roast at 400°F (205°C) for about 24 minutes, cut side down in a single layer, until
the centers are tender and the cut sides are deeply caramelized. For a brighter balsamic
flavor, add a small drizzle after roasting rather than increasing the amount used before.

## Gallery

This block uses every optional feature at once — an intro note, two labeled sections each
with their own note, per-image captions, and one caption-free image — so it doubles as a
reference for the syntax. None of this is required: see **Minimal usage** below for the
plain version.

```simple-gallery
note: A quick, reliable side dish ready in about 30 minutes.

section: Prep
  note: Get the seasoning ready before you touch the sprouts.
- ![[brussels-1.jpg]]
  caption: Whisking olive oil, balsamic vinegar, salt, and pepper
- ![[brussels-2.jpg]]
- ![[brussels-3.jpg]]
  caption: Tossed until every sprout is coated

section: Roasting
  note: High heat and a single layer are non-negotiable.
- ![[brussels-4.jpg]]
  caption: Cut side down, arranged in a single layer
- ![[brussels-5.jpg]]
  caption: Roasting at 400°F for about 24 minutes
- ![[brussels-6.jpg]]
  caption: A finishing drizzle of balsamic after roasting
```

## Minimal usage

Sections, notes, and captions are all optional. Leave them out entirely and a
`simple-gallery` block is just a flat list of photos:

```simple-gallery
- ![[brussels-2.jpg]]
- ![[brussels-4.jpg]]
- ![[brussels-6.jpg]]
```

## Notes for screenshots

- The photos above are the real ones from the recipe, straight out of the camera — Simple
  Gallery sizes each thumbnail from its own photo's proportions automatically (the default
  **Masonry** layout), so there's no need to crop or standardize them first.
- Capture the gallery above **twice**: once with the default Masonry layout, and once
  after switching **Settings → Simple Gallery → Layout** to **Grid (uniform)** — both
  screenshots go in the README's "See it in action" section to show the toggle.
- Capture the plugin's settings tab as well.
- Capture in both Reading view and Live Preview, and in both light and dark themes.
- Click a thumbnail to confirm **Fullscreen Image** (if installed) still opens it in its
  lightbox — Simple Gallery renders plain images and relies entirely on that plugin for
  zooming; it has no lightbox of its own.
