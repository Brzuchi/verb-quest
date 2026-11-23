// Verb Quest – configuration.
// Fill in your Supabase project URL and the publishable (or legacy anon) key.
// Both values are safe to publish: all writes go through the validated
// submit_score() function defined in supabase.sql.
// Leave them empty to run in offline mode (leaderboard stored only in this browser).

window.VQ_CONFIG = {
  SUPABASE_URL: "https://gtkttbhbjrjzqvqdxtkk.supabase.co",   // e.g. "https://gtkttbhbjrjzqvqdxtkk.supabase.co"
  SUPABASE_KEY: "sb_publishable_HUcgWmRVYibuiwwsZeXNuw_it_Vp0BX",   // e.g. "sb_publishable_..." or the legacy "eyJ..." anon key
  TIMEZONE: "Europe/Prague",
  HINTS: 3,                 // hints per game
  LEADERBOARD_REFRESH_S: 10 // auto-refresh interval of the leaderboard
};
