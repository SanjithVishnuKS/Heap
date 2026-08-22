export const appConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  askFunctionName: 'ask',
};

export const cloudModeEnabled = Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
