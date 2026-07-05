import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(8787),
  DATABASE_PROVIDER: z.enum(['postgres', 'dsql']).default('postgres'),
  DATABASE_URL: z.string().default('postgres://chat:chat@localhost:5432/chat'),
  DATABASE_SSL: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  LLM_PROVIDER: z.enum(['ollama', 'bedrock']).default('ollama'),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:0.5b'),
  AWS_REGION: z.string().default('ap-northeast-1'),
  BEDROCK_MODEL_ID: z.string().default('anthropic.claude-3-5-sonnet-20240620-v1:0'),
  DSQL_HOST: z.string().optional(),
  DSQL_USER: z.string().default('admin'),
  DSQL_DATABASE: z.string().default('postgres')
});

export const config = schema.parse(process.env);
