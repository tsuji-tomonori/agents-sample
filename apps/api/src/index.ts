import { serve } from '@hono/node-server';
import { config } from './config.js';
import { createApp } from './app.js';
import { migrate } from './db.js';

await migrate();

serve(
  {
    fetch: createApp().fetch,
    port: config.PORT
  },
  (info) => {
    console.log(`Hono API listening on http://localhost:${info.port}`);
  }
);
