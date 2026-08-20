/* ------------------------------------------------------------------
   Config — your Supabase credentials and the event details.

   1. Create a free project: https://supabase.com/dashboard
   2. Run schema.sql in the SQL editor
   3. Project Settings -> API -> copy "Project URL" and the
      "anon public" key in below.

   The anon key is public by design (it ships to the browser).
   What it is allowed to do is set by the RLS policies in schema.sql.
   ------------------------------------------------------------------ */

window.CONFIG = {
  SUPABASE_URL: "https://nafbmkmfauvuyugryagl.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_ak4Sl_DUh6yVcgsOB0lMjA_u_eD-NYN",

  EVENT: {
    title: "Boat Day",
    company: "Lipsia Digital",
    subtitle: "Same team, fewer walls, considerably more water",
    // Optional — leave empty while the date is still unsettled:
    date: "",
    locationName: "Bootsverleih in Leipzig",
    locationAddress: "Leipzig",
    mapsUrl:
      "https://www.google.de/maps/place/Bootsverleih+in+Leipzig/@51.2641356,12.3420663,17.97z/data=!4m6!3m5!1s0x47a6fa7335079b25:0xc1e0fb89ee4f9d89!8m2!3d51.2632374!4d12.3427702!16s%2Fg%2F11ckqrfwyk",
    mapsEmbedUrl:
      "https://maps.google.com/maps?q=51.2632374,12.3427702&z=16&hl=en&output=embed",
  },
};
