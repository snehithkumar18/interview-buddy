import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    if (!RETELL_API_KEY) {
      throw new Error('RETELL_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { interview_id, agent_id } = await req.json();

    // Fetch interview
    const { data: interview, error: intError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interview_id)
      .eq('user_id', user.id)
      .single();

    if (intError || !interview) {
      return new Response(JSON.stringify({ error: 'Interview not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, credits_balance')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits_balance < 5) {
      return new Response(JSON.stringify({ error: 'Insufficient credits' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Retell web call
    const retellRes = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agent_id,
        metadata: { interview_id: interview.id, user_id: user.id },
        retell_llm_dynamic_variables: {
          role: interview.role,
          company_name: interview.company_name,
          experience_level: interview.experience_level,
          job_description: interview.job_description || 'Not provided',
          user_name: profile.full_name,
          interview_language: interview.interview_language || 'English',
        },
      }),
    });

    if (!retellRes.ok) {
      const errBody = await retellRes.text();
      throw new Error(`Retell API failed [${retellRes.status}]: ${errBody}`);
    }

    const retellData = await retellRes.json();

    // Update interview with call id and status
    await supabase
      .from('interviews')
      .update({ retell_call_id: retellData.call_id, status: 'in_progress' })
      .eq('id', interview_id);

    return new Response(JSON.stringify({
      access_token: retellData.access_token,
      call_id: retellData.call_id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating Retell call:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
