#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { App, Aspects, Tags } from 'aws-cdk-lib';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { loadConfig } from '../src/config.js';
import { AgentsSampleAppStack } from '../src/stacks/agents-sample-app-stack.js';
import { EdgeSecurityStack } from '../src/stacks/edge-security-stack.js';

const app = new App();
const config = loadConfig(app);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const edgeStack = new EdgeSecurityStack(app, `${config.projectName}-${config.environmentName}-edge`, {
  env: {
    account: config.account,
    region: config.edgeRegion
  },
  crossRegionReferences: true,
  projectName: config.projectName,
  environmentName: config.environmentName,
  wafRateLimit: config.wafRateLimit
});

const appStack = new AgentsSampleAppStack(app, `${config.projectName}-${config.environmentName}-app`, {
  env: {
    account: config.account,
    region: config.appRegion
  },
  crossRegionReferences: true,
  projectName: config.projectName,
  environmentName: config.environmentName,
  repoRoot,
  webAclArn: edgeStack.webAclArn,
  dsqlUser: config.dsqlUser,
  dsqlDatabase: config.dsqlDatabase,
  dsqlDeletionProtection: config.dsqlDeletionProtection,
  bedrockRegion: config.bedrockRegion,
  bedrockModelId: config.bedrockModelId,
  apiMemorySize: config.apiMemorySize,
  apiTimeoutSeconds: config.apiTimeoutSeconds,
  workerMemorySize: config.workerMemorySize,
  workerTimeoutSeconds: config.workerTimeoutSeconds
});
appStack.addDependency(edgeStack);

for (const stack of [edgeStack, appStack]) {
  Tags.of(stack).add('Application', config.projectName);
  Tags.of(stack).add('Environment', config.environmentName);
  Tags.of(stack).add('ManagedBy', 'aws-cdk');
}

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));

NagSuppressions.addStackSuppressions(appStack, [
  {
    id: 'AwsSolutions-IAM4',
    reason:
      'AWS managed policies are used by CDK-managed deployment and Lambda support roles where replacing them would add broad custom policy duplication.'
  },
  {
    id: 'AwsSolutions-IAM5',
    reason:
      'Wildcard permissions are limited to framework-generated asset deployment/logging and Bedrock model invocation where model ARNs vary by region and provider.'
  },
  {
    id: 'AwsSolutions-APIG2',
    reason:
      'The REST API is a Lambda proxy API. Request validation is implemented in Hono and Zod handlers because payload shape varies by route.'
  },
  {
    id: 'AwsSolutions-APIG4',
    reason:
      'The MVP API is intentionally public behind CloudFront and WAF. User authentication is outside this infrastructure slice.'
  },
  {
    id: 'AwsSolutions-COG4',
    reason:
      'The MVP does not provision Cognito. Authentication will be added as a separate product decision.'
  },
  {
    id: 'AwsSolutions-L1',
    reason:
      'CDK-generated custom resource Lambdas may use runtimes selected by the CDK library version; application-owned Lambdas use Node.js 22.'
  },
  {
    id: 'AwsSolutions-CFR4',
    reason:
      'Route 53 and custom certificates are intentionally not provisioned. The distribution uses the default CloudFront certificate.'
  },
  {
    id: 'AwsSolutions-ASC3',
    reason:
      'The AppSync L1 resource sets LogConfig with ERROR field logging; this suppression covers cdk-nag L1 detection mismatch.'
  },
  {
    id: 'AwsSolutions-APIG3',
    reason:
      'The public edge is protected by the CloudFront WAF WebACL. The regional REST API is reached through CloudFront in the intended topology.'
  },
  {
    id: 'AwsSolutions-CFR1',
    reason:
      'Geo restriction is not a current product requirement for this global console endpoint.'
  }
]);

NagSuppressions.addStackSuppressions(edgeStack, [
  {
    id: 'AwsSolutions-WAF3',
    reason:
      'WAF logging destination is intentionally deferred until an operations log destination and retention policy are chosen for the environment.'
  }
]);
