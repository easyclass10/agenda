// Este script asume que env.js se carga antes en el HTML
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);