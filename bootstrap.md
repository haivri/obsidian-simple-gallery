# Brussels Sprouts, Roasted Two Ways

Roasting is the easiest way to make Brussels sprouts taste like something people ask for
seconds of. This note is a screenshot-ready demo of **Simple Gallery** — swap the
placeholder image references below for real photos, drop them into `assets/`, and the
gallery renders them automatically.

## The short version

Halve a pound of Brussels sprouts and toss them with olive oil, salt, and pepper. Roast at
425°F (220°C) for 20–25 minutes, shaking the pan halfway through, until the cut sides are
deeply caramelized. Don't crowd the pan — sprouts steam instead of caramelizing if they're
stacked more than one layer deep.

Finish with flaky salt and a squeeze of lemon for the plain version, or toss with balsamic
glaze and toasted hazelnuts for something richer.

## Gallery

This block uses every optional feature at once — an intro note, two labeled sections each
with their own note, per-image captions, and one caption-free image — so it doubles as a
reference for the syntax. None of this is required: see **Minimal usage** below for the
plain version.

```simple-gallery
note: A weeknight side that turns into the best thing on the plate.

section: Prep
  note: Don't rush the cut — even pieces roast evenly.
- ![[brussels-1.jpg]]
  caption: Halved and tossed with oil, salt, and pepper
- ![[brussels-2.jpg]]

section: Roasting
  note: High heat and a single layer are non-negotiable.
- ![[brussels-3.jpg]]
  caption: Cut side down, ready for the oven
- ![[brussels-4.jpg]]
  caption: Roasting at 425°F
- ![[brussels-5.jpg]]
  caption: Finished with balsamic glaze and toasted hazelnuts
```

## Minimal usage

Sections, notes, and captions are all optional. Leave them out entirely and a
`simple-gallery` block is just a flat list of photos:

```simple-gallery
- ![[brussels-1.jpg]]
- ![[brussels-3.jpg]]
- ![[brussels-5.jpg]]
```

## Notes for screenshots

- Replace `brussels-1.jpg` through `brussels-5.jpg` in `assets/` with real photos of any
  size or aspect ratio — Simple Gallery sizes each thumbnail from its own photo's
  proportions automatically (the default **Masonry** layout).
- Capture the gallery above **twice**: once with the default Masonry layout, and once
  after switching **Settings → Simple Gallery → Layout** to **Grid (uniform)** — both
  screenshots go in the README's "See it in action" section to show the toggle.
- Capture the plugin's settings tab as well.
- Capture in both Reading view and Live Preview, and in both light and dark themes.
- Click a thumbnail to confirm **Fullscreen Image** (if installed) still opens it in its
  lightbox — Simple Gallery renders plain images and relies entirely on that plugin for
  zooming; it has no lightbox of its own.
- Send me the original image files. I can crop and optimize them, place them in `assets/`,
  update the README, commit, push, and publish the release.
