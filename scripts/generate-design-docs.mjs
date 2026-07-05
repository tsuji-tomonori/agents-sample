import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const checkMode = process.argv.includes('--check');
const root = new URL('../', import.meta.url);
const generatedHeader =
  '<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->\n\n';

const paths = {
  apiApp: new URL('../apps/api/src/app.ts', import.meta.url),
  dbSource: new URL('../apps/api/src/db.ts', import.meta.url),
  webApp: new URL('../apps/web/app.vue', import.meta.url),
  dbMetadata: new URL('../db/docs-metadata.json', import.meta.url),
  dbSchema: new URL('../db/schema.sql', import.meta.url),
  dbDoc: new URL('../docs/database/schema.md', import.meta.url),
  apiList: new URL('../docs/spec/40.apis/apis-list.gen.md', import.meta.url),
  messageIndex: new URL('../docs/spec/40.apis/messages-index.gen.md', import.meta.url),
  screensList: new URL('../docs/spec/45.screens/screens-list.gen.md', import.meta.url),
  openapi: new URL('../openapi/openapi.gen.json', import.meta.url)
};

const routeCatalog = {
  'GET /health': {
    operationId: 'getHealth',
    tag: 'system',
    docSlug: 'health',
    summary: '稼働状態を取得する',
    auth: 'none',
    successStatus: 200,
    successDescription: '稼働状態',
    responseExample: { ok: true, provider: 'ollama' }
  },
  'GET /api/conversations': {
    operationId: 'listConversations',
    tag: 'conversations',
    docSlug: 'list',
    summary: '会話一覧を取得する',
    auth: 'none',
    successStatus: 200,
    successDescription: '会話一覧',
    responseExample: { conversations: [] }
  },
  'POST /api/conversations': {
    operationId: 'createConversation',
    tag: 'conversations',
    docSlug: 'create',
    summary: '新しい会話を作成する',
    auth: 'none',
    successStatus: 201,
    successDescription: '作成した会話',
    responseExample: { conversation: { id: 'uuid', title: 'New chat' } }
  },
  'GET /api/conversations/{id}/messages': {
    operationId: 'listConversationMessages',
    tag: 'conversations',
    docSlug: 'messages',
    summary: '会話のメッセージ一覧を取得する',
    auth: 'none',
    successStatus: 200,
    successDescription: 'メッセージ一覧',
    responseExample: { messages: [] }
  },
  'POST /api/chat': {
    operationId: 'postChat',
    tag: 'chat',
    docSlug: 'post',
    summary: 'AIチャットへメッセージを送信する',
    auth: 'none',
    successStatus: 200,
    successDescription: '生成された assistant メッセージ',
    requestExample: { message: 'こんにちは' },
    responseExample: {
      conversationId: 'uuid',
      message: {
        id: 'uuid',
        conversationId: 'uuid',
        role: 'assistant',
        content: 'こんにちは。何をお手伝いできますか？',
        createdAt: '2026-07-05T00:00:00.000Z'
      }
    }
  }
};

const errorCatalog = {
  400: ['validation_failed', 'WARNING', '入力検証エラー'],
  500: ['unexpected_error', 'ERROR', '想定外エラー']
};

const apiSource = await readFile(paths.apiApp, 'utf8');
const dbSource = await readFile(paths.dbSource, 'utf8');
const webSource = await readFile(paths.webApp, 'utf8');
const dbMetadata = existsSync(fileURLToPath(paths.dbMetadata))
  ? JSON.parse(await readFile(paths.dbMetadata, 'utf8'))
  : { tables: {}, relations: [], crud: {} };

const routes = extractRoutes(apiSource);
const ddl = extractDdl(dbSource);
const tables = parseTables(ddl);
const indexes = parseIndexes(ddl);
const openapi = buildOpenApi(routes);
const files = new Map();

files.set(paths.dbSchema, `${ddl.trim()}\n`);
files.set(paths.openapi, `${JSON.stringify(openapi, null, 2)}\n`);
files.set(paths.dbDoc, renderDatabaseDoc(ddl, tables, indexes, dbMetadata));
files.set(paths.apiList, renderApiList(routes));
files.set(paths.messageIndex, renderMessageIndex(routes));
for (const route of routes) {
  const dir = new URL(`../docs/spec/40.apis/${route.tag}/${route.slug}/`, import.meta.url);
  files.set(new URL('if.gen.md', dir), renderInterfaceDoc(route));
  files.set(new URL('detail-design.gen.md', dir), renderDetailDesignDoc(route));
  files.set(new URL('messages.gen.md', dir), renderMessageDoc(route));
  files.set(new URL('sequence.gen.md', dir), renderSequenceDoc(route));
}
files.set(paths.screensList, renderScreensList(webSource));

const changed = [];
for (const [url, content] of files) {
  const path = fileURLToPath(url);
  const current = existsSync(path) ? await readFile(path, 'utf8') : null;
  if (current !== content) {
    changed.push(path);
    if (!checkMode) {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content);
    }
  }
}

if (checkMode && changed.length > 0) {
  console.error(`generated docs are stale:\n${changed.map((path) => `- ${relative(path)}`).join('\n')}`);
  process.exit(1);
}

console.log(
  checkMode
    ? 'generated docs are up to date'
    : `generated ${files.size} design artifacts`
);

function extractRoutes(source) {
  const matches = [...source.matchAll(/app\.(get|post|put|patch|delete)\('([^']+)'/g)];
  return matches.map(([, method, rawPath]) => {
    const path = rawPath.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
    const key = `${method.toUpperCase()} ${path}`;
    const meta = routeCatalog[key] ?? inferRouteMeta(method, path);
    return {
      method: method.toUpperCase(),
      path,
      rawPath,
      ...meta,
      slug: meta.docSlug ?? slugFromPath(method, path)
    };
  });
}

function inferRouteMeta(method, path) {
  const operationId = `${method}${path
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/[{}]/g, ''))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}`;
  return {
    operationId,
    tag: path.split('/').filter(Boolean)[1] ?? 'system',
    summary: `${method.toUpperCase()} ${path}`,
    auth: 'none',
    successStatus: method === 'post' ? 201 : 200,
    successDescription: '成功',
    responseExample: {}
  };
}

function extractDdl(source) {
  const match = source.match(/await db\.query\(`([\s\S]*?)`\);/);
  if (!match) {
    throw new Error('Could not find migration DDL in apps/api/src/db.ts');
  }
  return normalizeSql(match[1]);
}

function normalizeSql(sql) {
  return sql
    .split('\n')
    .map((line) => line.replace(/^ {4}/, '').trimEnd())
    .join('\n')
    .trim();
}

function parseTables(ddl) {
  return [...ddl.matchAll(/create table if not exists ([a-z_]+) \(([\s\S]*?)\n\);/g)].map(
    ([, name, body]) => {
      const columns = [];
      const constraints = [];
      for (const raw of body.split('\n').map((line) => line.trim()).filter(Boolean)) {
        const line = raw.replace(/,$/, '');
        if (line.startsWith('constraint ')) {
          constraints.push(line);
          continue;
        }
        const firstSpace = line.indexOf(' ');
        if (firstSpace < 1) continue;
        columns.push({
          column: line.slice(0, firstSpace),
          definition: line.slice(firstSpace + 1)
        });
      }
      return { name, columns, constraints };
    }
  );
}

function parseIndexes(ddl) {
  const byTable = new Map();
  for (const [, indexName, tableName, columns] of ddl.matchAll(
    /create index if not exists ([a-z_]+)\s+on ([a-z_]+)\(([^)]+)\);/g
  )) {
    const entries = byTable.get(tableName) ?? [];
    entries.push({ indexName, columns: columns.replace(/\s+/g, ' ') });
    byTable.set(tableName, entries);
  }
  return byTable;
}

function buildOpenApi(routes) {
  const paths = {};
  for (const route of routes) {
    paths[route.path] ??= {};
    paths[route.path][route.method.toLowerCase()] = {
      operationId: route.operationId,
      tags: [route.tag],
      summary: route.summary,
      responses: {
        [route.successStatus]: {
          description: route.successDescription
        },
        400: { description: '入力検証エラー' },
        500: { description: '想定外エラー' }
      }
    };
  }
  return {
    openapi: '3.1.0',
    info: {
      title: 'Agents Sample API',
      version: '0.1.0'
    },
    'x-generated': '自動生成・直接編集禁止: npm run docs:generate で更新',
    paths
  };
}

function renderApiList(routes) {
  return `${generatedHeader}# API一覧

| Method | Path | Operation ID | Summary | Auth |
| --- | --- | --- | --- | --- |
${routes
  .map(
    (route) =>
      `| ${route.method} | \`${route.path}\` | \`${route.operationId}\` | ${route.summary} | ${route.auth} |`
  )
  .join('\n')}
`;
}

function renderMessageIndex(routes) {
  const rows = routes.flatMap((route) =>
    messagesFor(route).map(
      (message, index) =>
        `| \`${route.tag}/${route.slug}\` | \`M${String(index + 1).padStart(3, '0')}\` | \`${message.messageId}\` | \`${message.level}\` | ${message.status} | ${message.summary} |`
    )
  );
  return `${generatedHeader}# API Message catalog index

| API | id | message_id | level | status | ログ概要 |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}
`;
}

function renderInterfaceDoc(route) {
  return `${generatedHeader}# ${route.summary}

## 概要

実装 \`apps/api/src/app.ts\` の \`${route.method} ${route.rawPath}\` から生成しています。

## 基本情報

- Method: \`${route.method}\`
- Path: \`${route.path}\`
- Operation ID: \`${route.operationId}\`
- Tag: \`${route.tag}\`
- 認証方式: \`${route.auth}\`

## レスポンス

| Status | Description |
| --- | --- |
| ${route.successStatus} | ${route.successDescription} |
| 400 | 入力検証エラー |
| 500 | 想定外エラー |

## リクエスト例

\`\`\`json
${JSON.stringify(route.requestExample ?? null, null, 2)}
\`\`\`

## レスポンス例

\`\`\`json
${JSON.stringify(route.responseExample ?? {}, null, 2)}
\`\`\`
`;
}

function renderDetailDesignDoc(route) {
  return `${generatedHeader}# ${route.summary} 詳細設計

## 目的

${route.summary}。

## API契約

- Method: \`${route.method}\`
- Path: \`${route.path}\`
- Operation ID: \`${route.operationId}\`
- Tag: \`${route.tag}\`

## 処理フロー

1. Hono route handler がリクエストを受け取る。
2. 入力がある場合は Zod schema または handler 内の型制約で検証する。
3. DB アクセスが必要な場合は \`apps/api/src/db.ts\` の repository 関数を呼び出す。
4. LLM 応答が必要な場合は \`apps/api/src/llm.ts\` の provider 切り替えを使う。
5. 成功時は JSON response を返す。
6. 例外時は Hono のエラーレスポンスとして返る。

## 主要ソース

- app: \`apps/api/src/app.ts\`
- database: \`apps/api/src/db.ts\`
- llm provider: \`apps/api/src/llm.ts\`
`;
}

function renderMessageDoc(route) {
  const messages = messagesFor(route);
  return `${generatedHeader}# Message catalog: \`${route.tag}/${route.slug}\`

## API

| 項目 | 値 |
| --- | --- |
| operationId | \`${route.operationId}\` |
| method/path | ${route.method} \`${route.path}\` |
| summary | ${route.summary} |
| messages | ${messages.length} |

## メッセージ一覧

| id | message_id | level | status | ログ概要 |
| --- | --- | --- | --- | --- |
${messages
  .map(
    (message, index) =>
      `| \`M${String(index + 1).padStart(3, '0')}\` | \`${message.messageId}\` | \`${message.level}\` | ${message.status} | ${message.summary} |`
  )
  .join('\n')}
`;
}

function renderSequenceDoc(route) {
  return `${generatedHeader}# ${route.operationId} sequence

\`\`\`mermaid
sequenceDiagram
  autonumber
  participant User as User
  participant API as Hono API
  participant DB as PostgreSQL/DSQL
  participant LLM as Ollama/Bedrock
  User->>API: ${route.method} ${route.path}
${route.operationId === 'postChat' ? '  API->>DB: 会話履歴を保存・取得\n  API->>LLM: 履歴から応答を生成\n  LLM-->>API: assistant content\n  API->>DB: assistant message を保存\n' : route.path.includes('conversations') ? '  API->>DB: 会話またはメッセージを読み書き\n' : '  API->>DB: health query\n'}  API-->>User: HTTP ${route.successStatus}
  alt 入力検証エラー
    API-->>User: HTTP 400
  end
  alt 想定外エラー
    API-->>User: HTTP 500
  end
\`\`\`
`;
}

function renderDatabaseDoc(ddl, tables, indexes, metadata) {
  const tableNames = tables.map((table) => table.name);
  const crudEntries = Object.entries(metadata.crud ?? {});
  return `${generatedHeader}# AIチャット データベース定義

このファイルは \`apps/api/src/db.ts\` と \`db/docs-metadata.json\` から自動生成されています。

## ER 図

\`\`\`mermaid
erDiagram
${tables.map((table) => `  ${table.name} {\n${renderMermaidColumns(table)}\n  }`).join('\n')}
${(metadata.relations ?? []).map((relation) => `  ${relation.from} ||--o{ ${relation.to} : "${relation.label}"`).join('\n')}
\`\`\`

## CRUD 図

| API / 処理 | ${tableNames.join(' | ')} |
| --- | ${tableNames.map(() => '---').join(' | ')} |
${crudEntries.map(([actor, access]) => `| ${actor} | ${tableNames.map((name) => access[name] ?? '').join(' | ')} |`).join('\n')}

## テーブル定義

${tables
  .map(
    (table) => `### ${table.name}

${metadata.tables?.[table.name] ?? ''}

| Column | Definition |
| --- | --- |
${table.columns.map(({ column, definition }) => `| \`${column}\` | \`${definition}\` |`).join('\n')}

#### Constraints

${table.constraints.map((constraint) => `- \`${constraint}\``).join('\n') || '- なし'}

#### Indexes

${(indexes.get(table.name) ?? []).map(({ indexName, columns }) => `- \`${indexName}\`: \`${columns}\``).join('\n') || '- なし'}
`
  )
  .join('\n')}

## DDL

\`\`\`sql
${ddl.trim()}
\`\`\`
`;
}

function renderScreensList(source) {
  const usesConversations = source.includes('/api/conversations');
  const usesChat = source.includes('/api/chat');
  return `${generatedHeader}# 画面一覧

| 画面ID | 画面名 | URL | 認証 | 権限 | レイアウト | 実装状態 |
| --- | --- | --- | --- | --- | --- | --- |
| SCR-CHAT-ROOT | AIチャット | / | 不要 | なし | sidebar + chat panel | 実装済み |

## SCR-CHAT-ROOT 画面仕様

| 項目 | 値 |
| --- | --- |
| 目的 | ローカルまたはクラウド LLM と会話する |
| 主要コンポーネント | 会話一覧、新規チャット、メッセージ一覧、送信フォーム |
| 利用API | ${[
    usesConversations ? '`listConversations` / `listConversationMessages`' : '',
    usesChat ? '`postChat`' : ''
  ].filter(Boolean).join(', ')} |
| 状態 | empty, loading/sending, conversation selected, error |
| アクセシビリティ | 送信ボタンは \`aria-label="送信"\` を持つ |
`;
}

function renderMermaidColumns(table) {
  return table.columns
    .map(({ column, definition }) => {
      const type = definition.split(/\s+/).slice(0, 2).join('_').replace(/[,()]/g, '');
      const pk = definition.includes('primary key') ? ' PK' : '';
      return `    ${type} ${column}${pk}`;
    })
    .join('\n');
}

function messagesFor(route) {
  return Object.entries(errorCatalog).map(([status, [code, level, summary]]) => ({
    status,
    level,
    summary,
    messageId: `${route.operationId}.${code}`
  }));
}

function slugFromPath(method, path) {
  const parts = path
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/[{}]/g, ''));
  if (parts[0] === 'api') parts.shift();
  return parts.length > 0 ? `${method}-${parts.join('-')}` : method;
}

function relative(path) {
  return path.replace(fileURLToPath(root), '').replaceAll('\\', '/');
}
