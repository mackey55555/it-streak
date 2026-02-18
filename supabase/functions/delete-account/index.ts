import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? null;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ユーザーのアクセストークンで getUser するクライアント
    const authClient = createClient(
      supabaseUrl,
      anonKey ?? serviceRoleKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      },
    );

    const {
      data: { user },
      error: getUserError,
    } = await authClient.auth.getUser();

    if (getUserError || !user) {
      console.error('getUser error:', getUserError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const userId = user.id;

    // 実際の削除処理はサービスロールキーで実行（RLSをバイパス）
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const tablesWithUserId = [
      'user_answers',
      'daily_progress',
      'streaks',
      'push_notification_log',
    ] as const;

    for (const table of tablesWithUserId) {
      const { error } = await serviceClient
        .from(table)
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        return new Response(
          JSON.stringify({ error: `Failed to delete user data from ${table}` }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    {
      const { error } = await serviceClient
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting profile:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete profile' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    {
      const { error } = await serviceClient.auth.admin.deleteUser(userId);
      if (error) {
        console.error('Error deleting auth user:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete auth user' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Unexpected error in delete-account function:', error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message ?? 'Unexpected error in delete-account',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});

