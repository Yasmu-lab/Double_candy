import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

const EMAIL_DOMAIN = 'doublecandy.internal';

/**
 * Supabase Auth's phone provider requires an SMS gateway (Twilio or similar) to confirm
 * numbers, which this project deliberately doesn't use — no SMS costs, no external
 * dependency. Login is telefone + senha in the UI, but under the hood we use the
 * email+password provider with a synthetic email derived from the phone digits; the user
 * never sees or types it.
 */
export function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@${EMAIL_DOMAIN}`;
}
