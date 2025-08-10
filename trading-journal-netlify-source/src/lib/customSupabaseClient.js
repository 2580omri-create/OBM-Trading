import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aknxrrvdqjxzufwanoib.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbnhycnZkcWp4enVmd2Fub2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDgzOTQsImV4cCI6MjA3MDMyNDM5NH0.hlVlJhx-5fZDuKmoyc4GY-uhLP-z_WvOiyZJh5TFeFY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);