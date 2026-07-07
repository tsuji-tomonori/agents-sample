import type { App } from 'aws-cdk-lib';

function readContext(app: App, key: string): string | undefined {
  const value = app.node.tryGetContext(key);
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

function readNumber(app: App, key: string, fallback: number): number {
  const raw = readContext(app, key);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`CDK context ${key} must be a number. Received: ${raw}`);
  }
  return parsed;
}

function readBoolean(app: App, key: string, fallback: boolean): boolean {
  const raw = readContext(app, key);
  if (!raw) return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`CDK context ${key} must be true or false. Received: ${raw}`);
}

export interface AgentsSampleInfraConfig {
  readonly account?: string;
  readonly appRegion: string;
  readonly edgeRegion: string;
  readonly projectName: string;
  readonly environmentName: string;
  readonly dsqlUser: string;
  readonly dsqlDatabase: string;
  readonly dsqlDeletionProtection: boolean;
  readonly bedrockRegion: string;
  readonly bedrockModelId: string;
  readonly apiMemorySize: number;
  readonly apiTimeoutSeconds: number;
  readonly workerMemorySize: number;
  readonly workerTimeoutSeconds: number;
  readonly wafRateLimit: number;
}

export function loadConfig(app: App): AgentsSampleInfraConfig {
  const appRegion = readContext(app, 'appRegion') ?? process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1';

  return {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    appRegion,
    edgeRegion: readContext(app, 'edgeRegion') ?? 'us-east-1',
    projectName: readContext(app, 'projectName') ?? 'agents-sample',
    environmentName: readContext(app, 'environmentName') ?? 'dev',
    dsqlUser: readContext(app, 'dsqlUser') ?? 'admin',
    dsqlDatabase: readContext(app, 'dsqlDatabase') ?? 'postgres',
    dsqlDeletionProtection: readBoolean(app, 'dsqlDeletionProtection', true),
    bedrockRegion: readContext(app, 'bedrockRegion') ?? appRegion,
    bedrockModelId:
      readContext(app, 'bedrockModelId') ?? 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    apiMemorySize: readNumber(app, 'apiMemorySize', 1024),
    apiTimeoutSeconds: readNumber(app, 'apiTimeoutSeconds', 30),
    workerMemorySize: readNumber(app, 'workerMemorySize', 2048),
    workerTimeoutSeconds: readNumber(app, 'workerTimeoutSeconds', 120),
    wafRateLimit: readNumber(app, 'wafRateLimit', 2000)
  };
}
