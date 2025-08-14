// 공용 Supabase 클라이언트 모듈
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
  'https://jrihebqeovpcugbkljnb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyaWhlYnFlb3ZwY3VnYmtsam5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk1NjgsImV4cCI6MjA2OTM1NTU2OH0.NvMXkqh1tuFWF5gcFxCIaDNRLfshfbnkhokgPA0OqdQ' // anon key
);
