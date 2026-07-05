import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { config } from './config.js';
import {
  addMessage,
  createConversation,
  db,
  getMessages,
  listConversations,
  migrate,
} from './db.js';
import { generateReply } from './llm.js';

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    allowHeaders: ['content-type'],
    allowMethods: ['GET', 'POST', 'OPTIONS']
  })
);

app.get('/health', async (c) => {
  await db.query('select 1');
  return c.json({ ok: true, provider: config.LLM_PROVIDER });
});

app.get('/api/conversations', async (c) => {
  return c.json({ conversations: await listConversations() });
});

app.post('/api/conversations', async (c) => {
  return c.json({ conversation: await createConversation() }, 201);
});

app.get('/api/conversations/:id/messages', async (c) => {
  return c.json({ messages: await getMessages(c.req.param('id')) });
});

const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(8000)
});

app.post('/api/chat', async (c) => {
  const body = chatSchema.parse(await c.req.json());
  const conversation = body.conversationId
    ? { id: body.conversationId }
    : await createConversation(body.message.slice(0, 42));

  await addMessage(conversation.id, 'user', body.message);
  const history = await getMessages(conversation.id);
  const reply = await generateReply(history.map(({ role, content }) => ({ role, content })));
  const assistant = await addMessage(conversation.id, 'assistant', reply);

  return c.json({
    conversationId: conversation.id,
    message: assistant
  });
});

await migrate();

serve(
  {
    fetch: app.fetch,
    port: config.PORT
  },
  (info) => {
    console.log(`Hono API listening on http://localhost:${info.port}`);
  }
);
