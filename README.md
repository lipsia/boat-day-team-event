# Team Event — Lipsia Digital

Statische Website für das Team Event am [Bootsverleih in Leipzig](https://www.google.de/maps/place/Bootsverleih+in+Leipzig/@51.2641356,12.3420663,17.97z/data=!4m6!3m5!1s0x47a6fa7335079b25:0xc1e0fb89ee4f9d89!8m2!3d51.2632374!4d12.3427702!16s%2Fg%2F11ckqrfwyk):

- **Essenswünsche** — Was, Menge, von wem (jeder Wunsch gehört zu einer Person)
- **Mitfahrgelegenheiten** — biete X Plätze ab Treffpunkt / suche Mitfahrgelegenheit, immer mit Namen
- Beide Formulare sind unabhängig voneinander
- Alle Einträge sind für alle sichtbar und können gelöscht werden

Kein Build-Schritt, keine Abhängigkeiten — vier Dateien, direkt für GitHub Pages.

---

## 1. Datenbank einrichten (Supabase, kostenlos)

1. Auf [supabase.com](https://supabase.com/dashboard) anmelden → **New project**
   (Region: Frankfurt/EU, Passwort beliebig — brauchst du für die Seite nicht).
2. Im Projekt links **SQL Editor** öffnen, den kompletten Inhalt von
   [`schema.sql`](schema.sql) einfügen und **Run** klicken.
3. **Project Settings → API** öffnen und zwei Werte kopieren:
   - `Project URL` → z. B. `https://abcdefgh.supabase.co`
   - `anon` `public` API key (der lange JWT)
4. Beides in [`config.js`](config.js) eintragen:

   ```js
   SUPABASE_URL: "https://abcdefgh.supabase.co",
   SUPABASE_ANON_KEY: "eyJhbGciOi...",
   ```

> Der `anon` key steht bewusst im Quellcode — er ist für den Browser gedacht.
> Was damit erlaubt ist, legen die RLS-Policies in `schema.sql` fest: lesen,
> eintragen und löschen in genau diesen zwei Tabellen, sonst nichts.
> Wer den Link hat, kann Einträge anlegen und löschen — für eine interne
> Team-Seite ist das gewollt. Den Link also nicht öffentlich verlinken.

Solange `config.js` leer ist, läuft die Seite im **Vorschau-Modus**: Einträge
landen nur im eigenen Browser (localStorage), und oben erscheint ein Hinweis.
Gut zum Ausprobieren, aber keine geteilte Liste.

## 2. Event-Infos anpassen

Ebenfalls in `config.js` unter `EVENT`: Titel, Untertitel, Datum
(`date: "Samstag, 5. September · 14:00"` — leer lassen, wenn noch offen) und
der Google-Maps-Link.

## 3. Auf GitHub Pages veröffentlichen

```bash
git init
git add .
git commit -m "Team Event Website"
git branch -M main
git remote add origin git@github.com:<user-oder-org>/<repo>.git
git push -u origin main
```

Dann im Repo: **Settings → Pages → Source: `Deploy from a branch`**,
Branch `main`, Folder `/ (root)` → **Save**.

Nach ein bis zwei Minuten ist die Seite unter
`https://<user-oder-org>.github.io/<repo>/` erreichbar.

> Bei einem **privaten** Repo braucht GitHub Pages einen bezahlten Plan.
> Mit einem öffentlichen Repo ist Pages kostenlos — dann steht allerdings der
> `anon` key öffentlich im Repo. Für ein Team-Event mit Essens- und
> Fahrtenliste ist das in der Praxis unkritisch; wer es dichter will, nutzt
> ein privates Repo (GitHub Team/Pro) oder hostet z. B. bei Netlify/Cloudflare
> Pages, wo private Repos auch im Gratis-Tarif gehen.

## Lokal testen

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

(`file://` direkt öffnen geht auch, nur der Karten-iframe kann dabei zicken.)

## Dateien

| Datei        | Zweck                                             |
| ------------ | ------------------------------------------------- |
| `index.html` | Struktur: Hero, Karte, beide Formulare und Listen |
| `styles.css` | Gestaltung                                        |
| `app.js`     | Formulare, Rendering, Supabase-Zugriff            |
| `config.js`  | **Zugangsdaten und Event-Infos — hier anpassen**  |
| `schema.sql` | Tabellen und Zugriffsregeln für Supabase          |

## Daten ansehen oder aufräumen

Im Supabase-Dashboard unter **Table Editor** → `wishes` / `rides`. Dort lassen
sich Einträge auch exportieren (CSV) oder nach dem Event alle löschen.

## Nach Änderungen an app.js / config.js

GitHub Pages liefert Dateien mit `cache-control: max-age=600` aus — Browser
halten also bis zu 10 Minuten die alte Version. Damit Änderungen sofort
ankommen, die Versionsnummer in `index.html` erhöhen:

```html
<script src="config.js?v=3"></script>
<script src="app.js?v=3"></script>
```

Der geänderte Dateiname erzwingt einen Neuabruf, ohne dass jemand den
Cache leeren muss.

Zum Prüfen, welche Version der eigene Browser hat (Konsole öffnen):

```js
fetch('app.js', { cache: 'reload' })
  .then(r => r.text())
  .then(t => console.log(t.includes('namedItem') ? 'aktuell' : 'veraltet'));
```
