import { AuroraDSQLPool } from '@aws/aurora-dsql-node-postgres-connector';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import {
  buildSimulatedAnswer,
  buildSimulatedDocumentAccesses,
  normalizeOptionalText,
  type RunAnswer,
  type SimulatedDocumentAccess
} from './runs.js';

const { Pool } = pg;

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type RunStatus = 'queued' | 'running' | 'completed' | 'failed';

export type RagRun = {
  id: string;
  question: string;
  documentScope: string | null;
  status: RunStatus;
  answer: RunAnswer | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  events: RunEvent[];
  artifacts: RunArtifact[];
  documentAccesses: RunDocumentAccess[];
};

export type RunEvent = {
  id: string;
  runId: string;
  type: string;
  message: string;
  status: RunStatus;
  createdAt: string;
};

export type RunArtifact = {
  id: string;
  runId: string;
  kind: string;
  title: string;
  content: string;
  createdAt: string;
};

export type RunDocumentAccess = {
  id: string;
  runId: string;
  documentId: string;
  title: string;
  sourceUri: string;
  snippet: string;
  score: number;
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

    create table if not exists runs (
      id uuid primary key,
      question text not null,
      document_scope text,
      status text not null check (status in ('queued', 'running', 'completed', 'failed')),
      answer jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      completed_at timestamptz
    );

    alter table runs
      add column if not exists document_scope text;

    create table if not exists run_events (
      id uuid primary key,
      run_id uuid not null references runs(id) on delete cascade,
      type text not null,
      message text not null,
      status text not null check (status in ('queued', 'running', 'completed', 'failed')),
      created_at timestamptz not null default now()
    );

    create index if not exists run_events_run_created_idx
      on run_events(run_id, created_at);

    create table if not exists run_artifacts (
      id uuid primary key,
      run_id uuid not null references runs(id) on delete cascade,
      kind text not null,
      title text not null,
      content text not null,
      created_at timestamptz not null default now()
    );

    create index if not exists run_artifacts_run_created_idx
      on run_artifacts(run_id, created_at);

    create table if not exists run_document_accesses (
      id uuid primary key,
      run_id uuid not null references runs(id) on delete cascade,
      document_id text not null,
      title text not null,
      source_uri text not null,
      snippet text not null,
      score double precision not null,
      created_at timestamptz not null default now()
    );

    create index if not exists run_document_accesses_run_created_idx
      on run_document_accesses(run_id, created_at);
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

export async function createRun(question: string, documentScope?: string): Promise<RagRun> {
  const runId = randomUUID();
  await db.query(
    `insert into runs (id, question, document_scope, status)
     values ($1, $2, $3, 'queued')`,
    [runId, question, normalizeOptionalText(documentScope)]
  );

  await addRunEvent(runId, 'run.created', 'Run accepted and queued.', 'queued');
  await db.query(
    `update runs
     set status = 'running',
         updated_at = now()
     where id = $1`,
    [runId]
  );
  await addRunEvent(runId, 'planner.started', 'Planning retrieval steps.', 'running');

  const documentAccesses = buildSimulatedDocumentAccesses(question, documentScope);
  for (const access of documentAccesses) {
    await addRunDocumentAccess(runId, access);
  }
  await addRunEvent(runId, 'retrieval.completed', 'Retrieved candidate documents.', 'running');

  const answer = buildSimulatedAnswer(question, documentAccesses);
  await addRunArtifact(runId, {
    kind: 'answer',
    title: 'Final answer',
    content: answer.text
  });
  await addRunArtifact(runId, {
    kind: 'trace',
    title: 'Local simulated runner trace',
    content: JSON.stringify(
      {
        runner: 'local-simulator',
        steps: ['plan', 'retrieve', 'synthesize'],
        documentIds: documentAccesses.map((access) => access.documentId)
      },
      null,
      2
    )
  });

  await db.query(
    `update runs
     set status = 'completed',
         answer = $2,
         updated_at = now(),
         completed_at = now()
     where id = $1`,
    [runId, JSON.stringify(answer)]
  );
  await addRunEvent(runId, 'run.completed', 'Answer synthesized successfully.', 'completed');

  const run = await getRun(runId);
  if (!run) {
    throw new Error('Created run could not be loaded');
  }
  return run;
}

export async function getRun(id: string): Promise<RagRun | null> {
  const result = await db.query<RunRow>(
    `select id, question, document_scope, status, answer, created_at, updated_at, completed_at
     from runs
     where id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;

  const [events, artifacts, documentAccesses] = await Promise.all([
    listRunEvents(id),
    listRunArtifacts(id),
    listRunDocumentAccesses(id)
  ]);

  return {
    id: row.id,
    question: row.question,
    documentScope: row.document_scope,
    status: row.status,
    answer: normalizeAnswer(row.answer),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    completedAt: row.completed_at ? toIso(row.completed_at) : null,
    events,
    artifacts,
    documentAccesses
  };
}

export async function listRunEvents(runId: string): Promise<RunEvent[]> {
  const result = await db.query<RunEventRow>(
    `select id, run_id, type, message, status, created_at
     from run_events
     where run_id = $1
     order by created_at asc`,
    [runId]
  );
  return result.rows.map(normalizeRunEvent);
}

function normalizeConversation(row: { id: string; title: string; created_at: Date; updated_at: Date }) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

type RunRow = {
  id: string;
  question: string;
  document_scope: string | null;
  status: RunStatus;
  answer: unknown;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
};

type RunEventRow = {
  id: string;
  run_id: string;
  type: string;
  message: string;
  status: RunStatus;
  created_at: Date | string;
};

type RunArtifactRow = {
  id: string;
  run_id: string;
  kind: string;
  title: string;
  content: string;
  created_at: Date | string;
};

type RunDocumentAccessRow = {
  id: string;
  run_id: string;
  document_id: string;
  title: string;
  source_uri: string;
  snippet: string;
  score: number | string;
  created_at: Date | string;
};

type SimulatedArtifact = Omit<RunArtifact, 'id' | 'runId' | 'createdAt'>;

async function addRunEvent(
  runId: string,
  type: string,
  message: string,
  status: RunStatus
) {
  await db.query(
    `insert into run_events (id, run_id, type, message, status)
     values ($1, $2, $3, $4, $5)`,
    [randomUUID(), runId, type, message, status]
  );
}

async function addRunArtifact(runId: string, artifact: SimulatedArtifact) {
  await db.query(
    `insert into run_artifacts (id, run_id, kind, title, content)
     values ($1, $2, $3, $4, $5)`,
    [randomUUID(), runId, artifact.kind, artifact.title, artifact.content]
  );
}

async function addRunDocumentAccess(runId: string, access: SimulatedDocumentAccess) {
  await db.query(
    `insert into run_document_accesses
       (id, run_id, document_id, title, source_uri, snippet, score)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      randomUUID(),
      runId,
      access.documentId,
      access.title,
      access.sourceUri,
      access.snippet,
      access.score
    ]
  );
}

async function listRunArtifacts(runId: string): Promise<RunArtifact[]> {
  const result = await db.query<RunArtifactRow>(
    `select id, run_id, kind, title, content, created_at
     from run_artifacts
     where run_id = $1
     order by created_at asc`,
    [runId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    runId: row.run_id,
    kind: row.kind,
    title: row.title,
    content: row.content,
    createdAt: toIso(row.created_at)
  }));
}

async function listRunDocumentAccesses(runId: string): Promise<RunDocumentAccess[]> {
  const result = await db.query<RunDocumentAccessRow>(
    `select id, run_id, document_id, title, source_uri, snippet, score, created_at
     from run_document_accesses
     where run_id = $1
     order by created_at asc`,
    [runId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    runId: row.run_id,
    documentId: row.document_id,
    title: row.title,
    sourceUri: row.source_uri,
    snippet: row.snippet,
    score: Number(row.score),
    createdAt: toIso(row.created_at)
  }));
}

function normalizeRunEvent(row: RunEventRow): RunEvent {
  return {
    id: row.id,
    runId: row.run_id,
    type: row.type,
    message: row.message,
    status: row.status,
    createdAt: toIso(row.created_at)
  };
}

function normalizeAnswer(value: unknown): RunAnswer | null {
  if (!value) return null;
  if (typeof value === 'string') {
    return JSON.parse(value) as RunAnswer;
  }
  return value as RunAnswer;
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function requireDsqlHost() {
  if (!config.DSQL_HOST) {
    throw new Error('DSQL_HOST is required when DATABASE_PROVIDER=dsql');
  }
  return config.DSQL_HOST;
}
