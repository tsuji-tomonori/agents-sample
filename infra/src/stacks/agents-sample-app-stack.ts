import path from 'node:path';
import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { RestApiConstruct } from '../constructs/api/rest-api.construct.js';
import { AgentWorkerConstruct } from '../constructs/compute/agent-worker.construct.js';
import { BackendServiceConstruct } from '../constructs/compute/backend-service.construct.js';
import { DsqlClusterConstruct } from '../constructs/data/dsql-cluster.construct.js';
import { CloudFrontSiteConstruct } from '../constructs/edge/cloudfront-site.construct.js';
import { AppSyncRealtimeConstruct } from '../constructs/realtime/appsync-realtime.construct.js';
import { SiteBucketsConstruct } from '../constructs/storage/site-buckets.construct.js';

export interface AgentsSampleAppStackProps extends StackProps {
  readonly projectName: string;
  readonly environmentName: string;
  readonly repoRoot: string;
  readonly webAclArn: string;
  readonly dsqlUser: string;
  readonly dsqlDatabase: string;
  readonly dsqlDeletionProtection: boolean;
  readonly bedrockRegion: string;
  readonly bedrockModelId: string;
  readonly apiMemorySize: number;
  readonly apiTimeoutSeconds: number;
  readonly workerMemorySize: number;
  readonly workerTimeoutSeconds: number;
}

export class AgentsSampleAppStack extends Stack {
  constructor(scope: Construct, id: string, props: AgentsSampleAppStackProps) {
    super(scope, id, props);

    const buckets = new SiteBucketsConstruct(this, 'SiteBuckets', {
      projectName: props.projectName,
      environmentName: props.environmentName
    });

    const dsqlCluster = new DsqlClusterConstruct(this, 'DsqlCluster', {
      projectName: props.projectName,
      environmentName: props.environmentName,
      deletionProtection: props.dsqlDeletionProtection
    });

    const agentWorker = new AgentWorkerConstruct(this, 'AgentWorker', {
      projectName: props.projectName,
      environmentName: props.environmentName,
      logBucket: buckets.logBucket,
      bedrockRegion: props.bedrockRegion,
      bedrockModelId: props.bedrockModelId,
      memorySize: props.workerMemorySize,
      timeoutSeconds: props.workerTimeoutSeconds
    });

    const backend = new BackendServiceConstruct(this, 'BackendService', {
      projectName: props.projectName,
      environmentName: props.environmentName,
      repoRoot: props.repoRoot,
      appRegion: this.region,
      dsqlCluster,
      dsqlUser: props.dsqlUser,
      dsqlDatabase: props.dsqlDatabase,
      bedrockRegion: props.bedrockRegion,
      bedrockModelId: props.bedrockModelId,
      agentWorker,
      memorySize: props.apiMemorySize,
      timeoutSeconds: props.apiTimeoutSeconds
    });

    const restApi = new RestApiConstruct(this, 'RestApi', {
      projectName: props.projectName,
      environmentName: props.environmentName,
      handler: backend.function
    });

    const realtime = new AppSyncRealtimeConstruct(this, 'Realtime', {
      projectName: props.projectName,
      environmentName: props.environmentName,
      repoRoot: props.repoRoot,
      workerFunction: agentWorker.function
    });

    const site = new CloudFrontSiteConstruct(this, 'CloudFrontSite', {
      projectName: props.projectName,
      environmentName: props.environmentName,
      spaBucket: buckets.spaBucket,
      logBucket: buckets.logBucket,
      apiDomainName: restApi.domainName,
      apiOriginPath: restApi.originPath,
      appsyncGraphqlDomainName: realtime.graphqlDomainName,
      appsyncRealtimeDomainName: realtime.realtimeDomainName,
      webAclArn: props.webAclArn
    });

    new BucketDeployment(this, 'DeploySpa', {
      destinationBucket: buckets.spaBucket,
      sources: [Source.asset(path.join(props.repoRoot, 'apps', 'web', '.output', 'public'))],
      distribution: site.distribution,
      distributionPaths: ['/*']
    });

    new CfnOutput(this, 'SiteBucketName', {
      value: buckets.spaBucket.bucketName
    });
    new CfnOutput(this, 'LogBucketName', {
      value: buckets.logBucket.bucketName
    });
  }
}
