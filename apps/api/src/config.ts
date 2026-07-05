import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(8787),
  DATABASE_PROVIDER: z.enum(['postgres', 'dsql']).default('postgres'),
  DATABASE_URL: z.string().default('postgres://chat:chat@localhost:5432/chat'),
  DATABASE_SSL: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  LLM_PROVIDER: z.enum(['ollama', 'bedrock', 'microvm']).default('ollama'),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:0.5b'),
  AWS_REGION: z.string().default('ap-northeast-1'),
  BEDROCK_MODEL_ID: z.string().default('anthropic.claude-3-5-sonnet-20240620-v1:0'),
  BEDROCK_REGION: z.string().optional(),
  MICROVM_AGENT: z.enum(['codex', 'claude']).default('codex'),
  ARTIFACT_BUCKET: z.string().optional(),
  OUTPUT_PREFIX: z.string().default('chat-runs/'),
  MICROVM_IMAGE_IDENTIFIER: z.string().optional(),
  CODEX_MICROVM_IMAGE_IDENTIFIER: z.string().optional(),
  CLAUDE_MICROVM_IMAGE_IDENTIFIER: z.string().optional(),
  MICROVM_IMAGE_VERSION: z.string().optional(),
  MICROVM_EXECUTION_ROLE_ARN: z.string().optional(),
  MICROVM_MAXIMUM_DURATION_SECONDS: z.coerce.number().default(900),
  MICROVM_RESULT_TIMEOUT_MS: z.coerce.number().default(840000),
  MICROVM_RESULT_DETAIL_TIMEOUT_MS: z.coerce.number().default(10000),
  MICROVM_INGRESS_NETWORK_CONNECTORS: z.string().optional(),
  MICROVM_EGRESS_NETWORK_CONNECTORS: z.string().optional(),
  MICROVM_IDLE_POLICY: z.string().optional(),
  MICROVM_TERMINATE: z
    .string()
    .optional()
    .transform((value) => value !== 'false'),
  CODEX_MODEL: z.string().optional(),
  CLAUDE_MODEL_ID: z.string().optional(),
  MICROVM_TASK_SYSTEM_PROMPT: z
    .string()
    .default('You are a concise Japanese AI assistant. Answer the latest user message using the conversation history.'),
  DSQL_HOST: z.string().optional(),
  DSQL_USER: z.string().default('admin'),
  DSQL_DATABASE: z.string().default('postgres')
});

export const config = schema.parse(process.env);
