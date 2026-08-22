import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } } },
    );
    const { query } = await request.json();
    if (typeof query !== 'string' || query.trim().length < 2 || query.length > 500) {
      return new Response(JSON.stringify({ error: 'Ask must be between 2 and 500 characters.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Add provider-backed embedding generation here. Provider credentials belong in
    // Supabase project secrets, never in the frontend or this checked-in source.
    return new Response(JSON.stringify({ error: 'AI retrieval is not configured yet.', query }), { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
