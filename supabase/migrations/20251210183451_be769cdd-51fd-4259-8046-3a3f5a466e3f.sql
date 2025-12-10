-- Configurar cron job para sincronização automática com MiraPauta (a cada 15 minutos)
SELECT cron.schedule(
  'sync-mirapauta-tasks',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://uaqxgzoprrxdswnomccc.supabase.co/functions/v1/sync-mirapauta',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcXhnem9wcnJ4ZHN3bm9tY2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjMwOTYsImV4cCI6MjA2NzAzOTA5Nn0.urdxdkDwAXFWZ8goggi9UyUpFGF7geT7QPVKgWTps-Y"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);