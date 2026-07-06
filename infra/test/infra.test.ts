import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { describe, it } from 'node:test';
import { RestApiConstruct } from '../src/constructs/api/rest-api.construct.js';
import { AgentWorkerConstruct } from '../src/constructs/compute/agent-worker.construct.js';
import { DsqlClusterConstruct } from '../src/constructs/data/dsql-cluster.construct.js';
import { CloudFrontSiteConstruct } from '../src/constructs/edge/cloudfront-site.construct.js';
import { AppSyncRealtimeConstruct } from '../src/constructs/realtime/appsync-realtime.construct.js';
import { WebAclConstruct } from '../src/constructs/security/web-acl.construct.js';
import { SiteBucketsConstruct } from '../src/constructs/storage/site-buckets.construct.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const snapshotPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '__snapshots__',
  'infra-resource-summary.json'
);

describe('CDK infrastructure template', () => {
  it('matches the resource summary snapshot', () => {
    const template = buildTemplate();
    const summary = summarizeResources(template.toJSON());
    assert.deepEqual(summary, readSnapshot());
  });

  it('defines DSQL as an L1 AWS::DSQL::Cluster with deletion protection', () => {
    const template = buildTemplate();

    template.resourceCountIs('AWS::DSQL::Cluster', 1);
    template.hasResourceProperties('AWS::DSQL::Cluster', {
      DeletionProtectionEnabled: true
    });
  });

  it('defines the edge and realtime resources without Route 53', () => {
    const template = buildTemplate();

    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    template.resourceCountIs('AWS::AppSync::GraphQLApi', 1);
    assert.equal(countResources(template.toJSON(), 'AWS::Route53::HostedZone'), 0);
    assert.equal(countResources(template.toJSON(), 'AWS::Route53::RecordSet'), 0);
  });

  it('configures public ingress controls and service logging', () => {
    const template = buildTemplate();

    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      Scope: 'CLOUDFRONT'
    });
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Logging: {}
      }
    });
    template.hasResourceProperties('AWS::AppSync::GraphQLApi', {
      LogConfig: {
        FieldLogLevel: 'ERROR'
      }
    });
  });
});

function buildTemplate() {
  const app = new App();
  const stack = new Stack(app, 'InfraUnitTestStack', {
    env: {
      account: '111111111111',
      region: 'ap-northeast-1'
    }
  });

  const buckets = new SiteBucketsConstruct(stack, 'SiteBuckets', {
    projectName: 'agents-sample',
    environmentName: 'test'
  });
  new DsqlClusterConstruct(stack, 'DsqlCluster', {
    projectName: 'agents-sample',
    environmentName: 'test',
    deletionProtection: true
  });
  const worker = new AgentWorkerConstruct(stack, 'AgentWorker', {
    projectName: 'agents-sample',
    environmentName: 'test',
    logBucket: buckets.logBucket,
    bedrockRegion: 'ap-northeast-1',
    bedrockModelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    memorySize: 1024,
    timeoutSeconds: 60
  });
  const apiHandler = new Function(stack, 'ApiHandler', {
    runtime: Runtime.NODEJS_22_X,
    handler: 'index.handler',
    code: Code.fromInline('exports.handler = async () => ({ statusCode: 200, body: "ok" });')
  });
  const restApi = new RestApiConstruct(stack, 'RestApi', {
    projectName: 'agents-sample',
    environmentName: 'test',
    handler: apiHandler
  });
  const realtime = new AppSyncRealtimeConstruct(stack, 'Realtime', {
    projectName: 'agents-sample',
    environmentName: 'test',
    repoRoot,
    workerFunction: worker.function
  });
  const webAcl = new WebAclConstruct(stack, 'WebAcl', {
    projectName: 'agents-sample',
    environmentName: 'test',
    rateLimit: 2000
  });
  new CloudFrontSiteConstruct(stack, 'CloudFrontSite', {
    projectName: 'agents-sample',
    environmentName: 'test',
    spaBucket: buckets.spaBucket,
    logBucket: buckets.logBucket,
    apiDomainName: restApi.domainName,
    apiOriginPath: restApi.originPath,
    appsyncGraphqlDomainName: realtime.graphqlDomainName,
    appsyncRealtimeDomainName: realtime.realtimeDomainName,
    webAclArn: webAcl.webAcl.attrArn
  });

  return Template.fromStack(stack);
}

function summarizeResources(template: Record<string, unknown>) {
  const resources = template.Resources as Record<string, { Type: string; Properties?: Record<string, unknown> }>;
  const counts = Object.values(resources)
    .map((resource) => resource.Type)
    .sort()
    .reduce<Record<string, number>>((acc, type) => {
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});

  return {
    counts,
    dsql: selectFirstResource(resources, 'AWS::DSQL::Cluster'),
    waf: selectFirstResource(resources, 'AWS::WAFv2::WebACL'),
    appsync: selectFirstResource(resources, 'AWS::AppSync::GraphQLApi'),
    cloudfront: selectFirstResource(resources, 'AWS::CloudFront::Distribution')
  };
}

function selectFirstResource(
  resources: Record<string, { Type: string; Properties?: Record<string, unknown> }>,
  type: string
) {
  const resource = Object.values(resources).find((item) => item.Type === type);
  return {
    Type: resource?.Type,
    Properties: resource?.Properties
  };
}

function countResources(template: Record<string, unknown>, type: string) {
  const resources = template.Resources as Record<string, { Type: string }>;
  return Object.values(resources).filter((resource) => resource.Type === type).length;
}

function readSnapshot() {
  if (process.env.UPDATE_SNAPSHOTS === '1') {
    mkdirSync(path.dirname(snapshotPath), { recursive: true });
    const summary = summarizeResources(buildTemplate().toJSON());
    writeFileSync(snapshotPath, `${JSON.stringify(summary, null, 2)}\n`);
    return summary;
  }

  return JSON.parse(readFileSync(snapshotPath, 'utf8'));
}
