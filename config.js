/* ------------------------------------------------------------------
   Konfiguration — hier trägst du deine Supabase-Zugangsdaten ein.

   1. Kostenloses Projekt anlegen: https://supabase.com/dashboard
   2. SQL aus schema.sql im SQL-Editor ausführen
   3. Project Settings → API → "Project URL" und "anon public" key
      hier unten einsetzen.

   Der anon key ist öffentlich (er landet im Browser) — das ist so
   vorgesehen. Die Zugriffsrechte regeln die RLS-Policies in schema.sql.
   ------------------------------------------------------------------ */

window.CONFIG = {
  SUPABASE_URL: "https://nafbmkmfauvuyugryagl.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_ak4Sl_DUh6yVcgsOB0lMjA_u_eD-NYN",

  EVENT: {
    title: "Team Event",
    company: "Lipsia Digital",
    subtitle: "Bootstour auf dem Leipziger Wasser",
    // Optional — leer lassen, wenn noch kein Termin steht:
    date: "",
    locationName: "Bootsverleih in Leipzig",
    locationAddress: "Leipzig",
    mapsUrl:
      "https://www.google.de/maps/place/Bootsverleih+in+Leipzig/@51.2641356,12.3420663,17.97z/data=!4m6!3m5!1s0x47a6fa7335079b25:0xc1e0fb89ee4f9d89!8m2!3d51.2632374!4d12.3427702!16s%2Fg%2F11ckqrfwyk",
    mapsEmbedUrl:
      "https://maps.google.com/maps?q=51.2632374,12.3427702&z=16&hl=de&output=embed",
  },
};
