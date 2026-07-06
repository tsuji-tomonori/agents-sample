import { Duration, Stack } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface AgentWorkerConstructProps {
  readonly projectName: string;
  readonly environmentName: string;
  readonly logBucket: IBucket;
  readonly bedrockRegion: string;
  readonly bedrockModelId: string;
  readonly memorySize: number;
  readonly timeoutSeconds: number;
}

export class AgentWorkerConstruct extends Construct {
  readonly function: Function;

  constructor(scope: Construct, id: string, props: AgentWorkerConstructProps) {
    super(scope, id);

    this.function = new Function(this, 'Function', {
      functionName: `${props.projectName}-${props.environmentName}-agent-worker`,
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      memorySize: props.memorySize,
      timeout: Duration.seconds(props.timeoutSeconds),
      logRetention: RetentionDays.ONE_MONTH,
      environment: {
        LOG_BUCKET_NAME: props.logBucket.bucketName,
        BEDROCK_REGION: props.bedrockRegion,
        BEDROCK_MODEL_ID: props.bedrockModelId,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        AWS_ACCOUNT_ID: Stack.of(this).account
      },
      code: Code.fromInline(`
const crypto = require('crypto');

exports.handler = async (event) => {
  const input = event?.arguments?.input ?? event ?? {};
  const payload = typeof input.payload === 'string'
    ? input.payload
    : JSON.stringify(input.payload ?? input ?? {});

  const response = {
    id: input.id ?? crypto.randomUUID(),
    conversationId: input.conversationId ?? 'system',
    kind: input.kind ?? 'agent.worker.accepted',
    payload,
    createdAt: new Date().toISOString()
  };

  console.log(JSON.stringify({ response }));
  return response;
};
`)
    });

    props.logBucket.grantPut(this.function);
    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
          'bedrock:Converse',
          'bedrock:ConverseStream'
        ],
        resources: ['*']
      })
    );
  }
}
