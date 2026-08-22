import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function openAiRequest(path: string, body: Record<string, unknown>) {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('AI provider is not configured.');
  const response = await fetch(`https://api.openai.com/v1/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`AI provider returned ${response.status}.`);
  return response.json();
}

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Sign in required.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const embeddingResponse = await openAiRequest('embeddings', { model: 'text-embedding-3-small', input: query });
    const queryEmbedding = embeddingResponse.data?.[0]?.embedding;
    if (!Array.isArray(queryEmbedding)) throw new Error('Embedding response was invalid.');

    const { data: sources, error } = await supabase.rpc('match_thoughts', { query_embedding: queryEmbedding, match_threshold: 0.5, match_count: 8 });
    if (error) throw error;
    if (!sources?.length) return new Response(JSON.stringify({ answer: 'I could not find that in your heap yet.', sources: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const context = sources.map((source: { id: string; body: string }) => `[${source.id}] ${source.body}`).join('\n');
    const answerResponse = await openAiRequest('chat/completions', {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'Answer only from the supplied Heap sources. Be concise. Cite supporting source IDs in square brackets. If the sources do not answer the question, say so.' },
        { role: 'user', content: `Question: ${query}\n\nSources:\n${context}` },
      ],
    });
    const answer = answerResponse.choices?.[0]?.message?.content || 'I found sources but could not compose an answer.';
    return new Response(JSON.stringify({ answer, sources }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
