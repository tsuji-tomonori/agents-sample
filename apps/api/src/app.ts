import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { config } from './config.js';
import {
  addMessage,
  createConversation,
  createRun,
  db,
  getMessages,
  getRun,
  listRunEvents,
  listConversations,
} from './db.js';
import { generateReply } from './llm.js';

const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(8000)
});

const runSchema = z.object({
  question: z.string().min(1).max(8000),
  documentScope: z.string().max(1000).optional()
});

export function createApp() {
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

  app.post('/api/runs', async (c) => {
    const body = runSchema.parse(await c.req.json());
    const run = await createRun(body.question, body.documentScope);
    return c.json({ run }, 201);
  });

  app.get('/api/runs/:id', async (c) => {
    const parsed = z.string().uuid().safeParse(c.req.param('id'));
    if (!parsed.success) {
      return c.json({ error: 'Invalid run id' }, 400);
    }

    const run = await getRun(parsed.data);
    if (!run) {
      return c.json({ error: 'Run not found' }, 404);
    }

    return c.json({ run });
  });

  app.get('/api/runs/:id/events', async (c) => {
    const parsed = z.string().uuid().safeParse(c.req.param('id'));
    if (!parsed.success) {
      return c.json({ error: 'Invalid run id' }, 400);
    }

    const run = await getRun(parsed.data);
    if (!run) {
      return c.json({ error: 'Run not found' }, 404);
    }

    return c.json({ events: await listRunEvents(parsed.data) });
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

  return app;
}
