import type { PageServerLoad } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('sb-access-token');

  if (!token) {
    return { mail: [], error: 'Not logged in' };
  }

  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) {
    return { mail: [], error: 'Invalid session' };
  }

  const { data, error } = await supabase.from('mail').select('*');

  if (error) {
    console.error('Error fetching mail:', error);
    return { mail: [], error: error.message };
  }

  return { mail: data ?? [] };
};