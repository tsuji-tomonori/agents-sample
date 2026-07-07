import { Duration } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import type { DsqlClusterConstruct } from '../data/dsql-cluster.construct.js';
import type { AgentWorkerConstruct } from './agent-worker.construct.js';

export interface BackendServiceConstructProps {
  readonly projectName: string;
  readonly environmentName: string;
  readonly repoRoot: string;
  readonly appRegion: string;
  readonly dsqlCluster: DsqlClusterConstruct;
  readonly dsqlUser: string;
  readonly dsqlDatabase: string;
  readonly bedrockRegion: string;
  readonly bedrockModelId: string;
  readonly agentWorker: AgentWorkerConstruct;
  readonly memorySize: number;
  readonly timeoutSeconds: number;
}

export class BackendServiceConstruct extends Construct {
  readonly function: DockerImageFunction;

  constructor(scope: Construct, id: string, props: BackendServiceConstructProps) {
    super(scope, id);

    this.function = new DockerImageFunction(this, 'Function', {
      functionName: `${props.projectName}-${props.environmentName}-hono-api`,
      code: DockerImageCode.fromImageAsset(props.repoRoot, {
        file: 'infra/docker/api-lambda.Dockerfile',
        exclude: ['.git', 'infra/cdk.out', 'node_modules', 'apps/api/node_modules', 'apps/web/node_modules']
      }),
      memorySize: props.memorySize,
      timeout: Duration.seconds(props.timeoutSeconds),
      logRetention: RetentionDays.ONE_MONTH,
      environment: {
        PORT: '8080',
        DATABASE_PROVIDER: 'dsql',
        DATABASE_SSL: 'true',
        DSQL_HOST: props.dsqlCluster.postgresConnectionHost,
        DSQL_USER: props.dsqlUser,
        DSQL_DATABASE: props.dsqlDatabase,
        LLM_PROVIDER: 'bedrock',
        BEDROCK_REGION: props.bedrockRegion,
        BEDROCK_MODEL_ID: props.bedrockModelId,
        AGENT_WORKER_FUNCTION_NAME: props.agentWorker.function.functionName
      }
    });

    props.dsqlCluster.grantConnect(this.function);
    props.agentWorker.function.grantInvoke(this.function);
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
