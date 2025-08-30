// Example configuration file
// Copy this to config.ts and fill in your actual values

export const config = {
  supabase: {
    url: 'your_supabase_project_url',
    anonKey: 'your_supabase_anon_key',
  },
  app: {
    name: 'BlogHub',
    description: 'Modern Blogging Platform',
    version: '1.0.0',
  },
  features: {
    enableComments: true,
    enableLikes: true,
    enableAnalytics: true,
    enableSearch: true,
  },
};

// Usage:
// import { config } from './config';
