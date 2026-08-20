# ⛵ Boat Day — Lipsia Digital

A static website for our team event, dressed as Windows Millennium Edition, at the
[Bootsverleih in Leipzig](https://www.google.de/maps/place/Bootsverleih+in+Leipzig/@51.2641356,12.3420663,17.97z/data=!4m6!3m5!1s0x47a6fa7335079b25:0xc1e0fb89ee4f9d89!8m2!3d51.2632374!4d12.3427702!16s%2Fg%2F11ckqrfwyk).

- **Snacks & Sips** — what, how much, and who's bringing it (every wish is tied to a person)
- **Carpool Karaoke** — offer seats from a pickup point, or say you need a lift; always with a name
- The two forms are completely independent
- Everything is visible to everyone, and anything can be thrown overboard again

No build step, no dependencies, no framework, no external fonts. Six files,
a desktop, a taskbar and a lot of 3D bevels.

**Live:** https://lipsia.github.io/boat-day-team-event/

---

## 1. Database (Supabase, free)

1. Sign in at [supabase.com](https://supabase.com/dashboard) → **New project**
   (region: Frankfurt/EU; the database password is not needed by the site).
2. Open **SQL Editor**, paste all of [`schema.sql`](schema.sql), hit **Run**.
3. Go to **Project Settings → API** and copy two values:
   - `Project URL` — e.g. `https://abcdefgh.supabase.co`
   - the `anon` / `publishable` API key
4. Put both into [`config.js`](config.js).

> The key is meant to sit in the browser, so it lives in the source on purpose.
> What it can actually do is defined by the RLS policies in `schema.sql`: read,
> insert and delete in exactly those two tables, nothing else. Anyone with the
> link can add and remove entries — that's the point for an internal team page.
> Don't post the link publicly.

With `config.js` left empty the site runs in **preview mode**: entries stay in
your own browser (localStorage) and a banner says so. Handy for a quick look,
but not a shared list.

## 2. Event details

Also in `config.js`, under `EVENT`: title, subtitle, the Google Maps links, and
the date — `date: "Saturday, 5 September · 2 pm"`. Leave `date` empty and the
badge simply doesn't render.

## 3. Deploy (GitHub Pages)

Already set up for this repo: **Settings → Pages**, branch `main`, folder
`/ (root)`. Every push to `main` redeploys within a minute or two.

```bash
git add -A
git commit -m "your message"
git push
```

> Free GitHub Pages needs a **public** repo, which is why the Supabase key is
> publicly visible here. If you'd rather it weren't, Cloudflare Pages hosts
> private repos on its free tier.

## 4. After changing app.js / config.js / styles.css

Pages serves with `cache-control: max-age=600`, so browsers can hold the old
file for up to ten minutes. Bump the version query in `index.html` so nobody
has to clear a cache:

```html
<link rel="stylesheet" href="styles.css?v=11" />
<script src="config.js?v=11"></script>
<script src="app.js?v=11"></script>
```

To check which version your own browser has, in the console:

```js
fetch('app.js', { cache: 'reload' })
  .then(r => r.text())
  .then(t => console.log(t.includes('namedItem') ? 'current' : 'stale'));
```

## Local preview

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Files

| File         | Purpose                                                  |
| ------------ | -------------------------------------------------------- |
| `index.html` | Structure: hero, map, both forms and lists               |
| `styles.css` | Win9x/ME chrome: bevels, title bars, taskbar, start menu |
| `app.js`     | Forms, rendering, Supabase access, snack-emoji guessing  |
| `config.js`  | **Credentials and event details — edit this one**        |
| `schema.sql` | Tables and access rules for Supabase                     |

## Looking at the data

Supabase dashboard → **Table Editor** → `wishes` / `rides`. You can export CSV
there, or clear everything out after the event.

## Notes for whoever touches this next

- Form field names map 1:1 to database columns (`item`, `amount`, `author` /
  `kind`, `author`, `seats`, `pickup`, `note`).
- Fields are looked up with `form.elements.namedItem(name)`, **not**
  `form.elements.item` — the latter returns the collection's built-in `item()`
  method and silently breaks the form. Same trap applies to `length`.
- All animation is wrapped by a `prefers-reduced-motion` block, so the page
  goes still for anyone who asks their OS for that.
- The snack emoji is decoration derived from the text at render time. It is
  never stored, so editing the keyword list can't corrupt existing rows.
- Empty-state messages (`.empty`) are deliberately plain italic text inside the
  list view — no border, no fill. They are status text, not buttons, and must
  never look clickable. Same goes for the `.stat` readouts.
- The whole 3D look comes from two `box-shadow` recipes (raised and sunken)
  documented at the top of `styles.css`. Reuse those rather than inventing new
  border colours.
- The visual layer is CSS only. Element IDs and form field names are the
  contract with `app.js` and the database; restyling never touches them.
- **`[hidden]` must stay guarded.** `styles.css` opens with
  `[hidden] { display: none !important; }`. Without it, any author-level
  `display: flex/grid/inline-block` outranks the UA stylesheet and "hidden"
  elements render anyway — an empty error bar under the submit button, the
  stats panel showing zeroes. jsdom does **not** reproduce this cascade, so it
  cannot be caught by a DOM test; keep the guard.
- **Group boxes need a real `border`.** A browser only cuts the notch for a
  `<legend>` when its `<fieldset>` has an actual border. Drawing the frame
  with `box-shadow` and `border: 0` makes the line run straight through the
  caption text. The legend also carries an opaque background so the frame
  cannot show through descenders.

## The boot screen

On the first visit of a browser session the page plays a short BIOS-then-splash
boot sequence (about 4 seconds). Click or press any key to skip it; it will not
play again until a new session. Append `?boot` to the URL to watch it again.

The timeline lives entirely in CSS, so the overlay clears itself even if
`app.js` fails to run — a broken script can never leave the page covered.
`prefers-reduced-motion` skips it outright.

## Sounds

Startup chime, button clicks, a ding when an entry saves, a two-tone error,
and a swoosh when something is deleted. All of it is synthesised at runtime
with the Web Audio API — there are no audio files in the repo, and none of
Microsoft's actual sounds are reused.

The speaker in the system tray mutes and unmutes; the choice is kept in
`localStorage`. Browsers refuse to start audio before a user gesture, so the
context is created on the first click or keypress — that is when the startup
chime plays, if the boot screen is still up. If `AudioContext` is missing or
blocked, every `Sound.play()` is a no-op and nothing breaks.
