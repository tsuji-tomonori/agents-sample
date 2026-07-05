import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  LambdaMicrovmsClient,
  RunMicrovmCommand,
  TerminateMicrovmCommand
} from '@aws-sdk/client-lambda-microvms';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { config } from './config.js';
import type { ChatMessage } from './db.js';

type ProviderMessage = Pick<ChatMessage, 'role' | 'content'>;

type MicrovmStatus = {
  agent?: string;
  exit_code?: number;
  raw_exit_code?: number;
  final_text?: string;
  stderr_tail?: string;
};

type MicrovmResult = {
  final_text?: string;
  stderr_tail?: string;
};

const s3 = new S3Client({});
const microvms = new LambdaMicrovmsClient({});

export async function generateWithMicrovm(messages: ProviderMessage[]) {
  const bucket = config.ARTIFACT_BUCKET;
  if (!bucket) {
    throw new Error('ARTIFACT_BUCKET is required when LLM_PROVIDER=microvm');
  }

  const agent = config.MICROVM_AGENT;
  const imageIdentifier = resolveMicrovmImageIdentifier(agent);
  if (!imageIdentifier) {
    throw new Error(`${agent.toUpperCase()}_MICROVM_IMAGE_IDENTIFIER or MICROVM_IMAGE_IDENTIFIER is required`);
  }

  const runId = safeName(`chat-${Date.now()}-${randomUUID()}`);
  const outputPrefixBase = ensureTrailingSlash(config.OUTPUT_PREFIX);
  const outputPrefix = `${outputPrefixBase}${runId}/`;
  const jobKey = `microvm-jobs/${runId}.json`;
  const task = buildChatTask(messages);

  const jobEvent = removeUndefined({
    agent,
    run_id: runId,
    bucket,
    task,
    output_prefix: outputPrefixBase,
    output_file: 'reply.md',
    persist_final: true,
    inline_context: true,
    bedrock_region: config.BEDROCK_REGION || config.AWS_REGION,
    model: agent === 'codex' ? config.CODEX_MODEL : config.CLAUDE_MODEL_ID,
    codex_shell_tool: agent === 'codex' ? false : undefined,
    codex_bypass_sandbox: false
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: jobKey,
      Body: JSON.stringify(jobEvent, null, 2),
      ContentType: 'application/json'
    })
  );

  const runResp = await microvms.send(
    new RunMicrovmCommand(
      removeUndefined({
        imageIdentifier,
        imageVersion: config.MICROVM_IMAGE_VERSION,
        executionRoleArn: config.MICROVM_EXECUTION_ROLE_ARN,
        runHookPayload: JSON.stringify({ job_bucket: bucket, job_key: jobKey }),
        maximumDurationInSeconds: config.MICROVM_MAXIMUM_DURATION_SECONDS,
        ingressNetworkConnectors: parseJsonOrCsv(config.MICROVM_INGRESS_NETWORK_CONNECTORS),
        egressNetworkConnectors: parseJsonOrCsv(config.MICROVM_EGRESS_NETWORK_CONNECTORS),
        idlePolicy: parseJsonValue(config.MICROVM_IDLE_POLICY)
      })
    )
  );

  const microvmId = runResp.microvmId || (runResp as { microvmIdentifier?: string }).microvmIdentifier;
  try {
    const status = await waitForS3Json<MicrovmStatus>({
      bucket,
      key: `${outputPrefix}logs/agent-run.json`,
      timeoutMs: config.MICROVM_RESULT_TIMEOUT_MS,
      intervalMs: 2000
    });
    const detail = await readS3JsonOrNull<MicrovmResult>({
      bucket,
      key: `${outputPrefix}logs/microvm-result.json`,
      timeoutMs: config.MICROVM_RESULT_DETAIL_TIMEOUT_MS,
      intervalMs: 1000
    });

    const finalText = normalizeFinalText(detail?.final_text || status.final_text || '');
    if ((status.exit_code ?? 1) !== 0 && !finalText) {
      throw new Error(`MicroVM ${agent} run failed: ${detail?.stderr_tail || status.stderr_tail || 'no stderr available'}`);
    }

    return finalText || '応答を生成できませんでした。';
  } finally {
    if (microvmId && config.MICROVM_TERMINATE) {
      try {
        await microvms.send(new TerminateMicrovmCommand({ microvmIdentifier: microvmId }));
      } catch (err) {
        console.error(JSON.stringify({
          event: 'microvm.terminate_failed',
          microvm_id: microvmId,
          message: err instanceof Error ? err.message : String(err)
        }));
      }
    }
  }
}

function buildChatTask(messages: ProviderMessage[]) {
  const history = messages
    .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
    .join('\n\n');
  return `${config.MICROVM_TASK_SYSTEM_PROMPT}\n\nConversation history:\n${history}\n\nReturn only the assistant reply text.`;
}

function resolveMicrovmImageIdentifier(agent: 'codex' | 'claude') {
  if (agent === 'claude') {
    return config.CLAUDE_MICROVM_IMAGE_IDENTIFIER || config.MICROVM_IMAGE_IDENTIFIER;
  }
  return config.CODEX_MICROVM_IMAGE_IDENTIFIER || config.MICROVM_IMAGE_IDENTIFIER;
}

async function waitForS3Json<T>({ bucket, key, timeoutMs, intervalMs }: {
  bucket: string;
  key: string;
  timeoutMs: number;
  intervalMs: number;
}) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown = null;
  while (Date.now() <= deadline) {
    try {
      const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const text = await bodyToString(response.Body);
      return JSON.parse(text) as T;
    } catch (err) {
      lastError = err;
      await sleep(intervalMs);
    }
  }
  const message = lastError instanceof Error ? lastError.message : 'not found';
  throw new Error(`Timed out waiting for s3://${bucket}/${key}: ${message}`);
}

async function readS3JsonOrNull<T>(options: {
  bucket: string;
  key: string;
  timeoutMs: number;
  intervalMs: number;
}) {
  try {
    return await waitForS3Json<T>(options);
  } catch {
    return null;
  }
}

async function bodyToString(body: unknown) {
  if (!body) return '';
  if (typeof (body as { transformToString?: () => Promise<string> }).transformToString === 'function') {
    return (body as { transformToString: () => Promise<string> }).transformToString();
  }
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf8');
  }
  return String(body);
}

function parseJsonValue(value?: string) {
  if (!value) return undefined;
  return JSON.parse(value);
}

function parseJsonOrCsv(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return JSON.parse(trimmed);
  return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function normalizeFinalText(text: string) {
  const value = text.trim();
  const match = value.match(/^```(?:markdown|md|text)?\s*\n([\s\S]*?)\n```\s*$/i);
  return match ? match[1].trimEnd() : value;
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, '-').slice(0, 80) || randomUUID();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
