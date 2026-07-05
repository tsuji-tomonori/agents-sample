import { AuroraDSQLPool } from '@aws/aurora-dsql-node-postgres-connector';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';

const { Pool } = pg;

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.DATABASE_SSL ? { rejectUnauthorized: true } : undefined
});

export const db =
  config.DATABASE_PROVIDER === 'dsql'
    ? new AuroraDSQLPool({
        host: requireDsqlHost(),
        user: config.DSQL_USER,
        database: config.DSQL_DATABASE,
        region: config.AWS_REGION,
        max: 10,
        idleTimeoutMillis: 60_000
      })
    : pool;

export async function migrate() {
  await db.query(`
    create table if not exists conversations (
      id uuid primary key,
      title text not null default 'New chat',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists messages (
      id uuid primary key,
      conversation_id uuid not null references conversations(id) on delete cascade,
      role text not null check (role in ('user', 'assistant')),
      content text not null,
      created_at timestamptz not null default now()
    );

    create index if not exists messages_conversation_created_idx
      on messages(conversation_id, created_at);
  `);
}

export async function createConversation(title = 'New chat') {
  const id = randomUUID();
  const result = await db.query<{ id: string; title: string; created_at: Date; updated_at: Date }>(
    'insert into conversations (id, title) values ($1, $2) returning id, title, created_at, updated_at',
    [id, title]
  );
  return normalizeConversation(result.rows[0]);
}

export async function listConversations() {
  const result = await db.query<{ id: string; title: string; created_at: Date; updated_at: Date }>(
    'select id, title, created_at, updated_at from conversations order by updated_at desc'
  );
  return result.rows.map(normalizeConversation);
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const result = await db.query<{
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: Date;
  }>(
    `select id, conversation_id, role, content, created_at
     from messages
     where conversation_id = $1
     order by created_at asc`,
    [conversationId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at.toISOString()
  }));
}

export async function addMessage(
  conversationId: string,
  role: ChatMessage['role'],
  content: string
) {
  const id = randomUUID();
  const result = await db.query<{
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: Date;
  }>(
    `insert into messages (id, conversation_id, role, content)
     values ($1, $2, $3, $4)
     returning id, conversation_id, role, content, created_at`,
    [id, conversationId, role, content]
  );

  await db.query(
    `update conversations
     set updated_at = now(),
         title = case when title = 'New chat' and $2 = 'user'
                      then left($3, 42)
                      else title
                 end
     where id = $1`,
    [conversationId, role, content]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at.toISOString()
  };
}

function normalizeConversation(row: { id: string; title: string; created_at: Date; updated_at: Date }) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function requireDsqlHost() {
  if (!config.DSQL_HOST) {
    throw new Error('DSQL_HOST is required when DATABASE_PROVIDER=dsql');
  }
  return config.DSQL_HOST;
}
