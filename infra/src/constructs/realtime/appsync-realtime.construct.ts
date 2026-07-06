import fs from 'node:fs';
import path from 'node:path';
import { Aws, CfnOutput, Stack } from 'aws-cdk-lib';
import {
  CfnApiKey,
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
  CfnResolver
} from 'aws-cdk-lib/aws-appsync';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import type { IFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface AppSyncRealtimeConstructProps {
  readonly projectName: string;
  readonly environmentName: string;
  readonly repoRoot: string;
  readonly workerFunction: IFunction;
}

export class AppSyncRealtimeConstruct extends Construct {
  readonly api: CfnGraphQLApi;
  readonly apiId: string;
  readonly graphqlUrl: string;
  readonly realtimeUrl: string;
  readonly graphqlDomainName: string;
  readonly realtimeDomainName: string;

  constructor(scope: Construct, id: string, props: AppSyncRealtimeConstructProps) {
    super(scope, id);

    const logsRole = new Role(this, 'AppSyncLogsRole', {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')
      ]
    });

    this.api = new CfnGraphQLApi(this, 'GraphqlApi', {
      name: `${props.projectName}-${props.environmentName}-realtime`,
      authenticationType: 'API_KEY',
      xrayEnabled: true,
      logConfig: {
        cloudWatchLogsRoleArn: logsRole.roleArn,
        fieldLogLevel: 'ERROR',
        excludeVerboseContent: true
      }
    });

    this.apiId = this.api.attrApiId;
    this.graphqlUrl = this.api.attrGraphQlUrl;
    this.realtimeUrl = this.api.attrRealtimeUrl;
    this.graphqlDomainName = `${this.apiId}.appsync-api.${Stack.of(this).region}.${Aws.URL_SUFFIX}`;
    this.realtimeDomainName = `${this.apiId}.appsync-realtime-api.${Stack.of(this).region}.${Aws.URL_SUFFIX}`;

    const schemaBody = fs.readFileSync(
      path.join(props.repoRoot, 'infra', 'graphql', 'realtime.graphql'),
      'utf8'
    );
    const schema = new CfnGraphQLSchema(this, 'Schema', {
      apiId: this.apiId,
      definition: schemaBody
    });

    new CfnApiKey(this, 'DefaultApiKey', {
      apiId: this.apiId,
      description: `${props.projectName}-${props.environmentName} browser realtime key`
    });

    const appsyncRole = new Role(this, 'AppSyncWorkerRole', {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com')
    });
    appsyncRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['lambda:InvokeFunction'],
        resources: [props.workerFunction.functionArn]
      })
    );

    const workerDataSource = new CfnDataSource(this, 'WorkerDataSource', {
      apiId: this.apiId,
      name: 'AgentWorkerLambda',
      type: 'AWS_LAMBDA',
      serviceRoleArn: appsyncRole.roleArn,
      lambdaConfig: {
        lambdaFunctionArn: props.workerFunction.functionArn
      }
    });
    workerDataSource.addDependency(schema);

    const healthDataSource = new CfnDataSource(this, 'HealthDataSource', {
      apiId: this.apiId,
      name: 'HealthNone',
      type: 'NONE'
    });
    healthDataSource.addDependency(schema);

    const publishResolver = new CfnResolver(this, 'PublishAgentEventResolver', {
      apiId: this.apiId,
      typeName: 'Mutation',
      fieldName: 'publishAgentEvent',
      dataSourceName: workerDataSource.name,
      requestMappingTemplate: `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": $util.toJson($context)
}`,
      responseMappingTemplate: '$util.toJson($context.result)'
    });
    publishResolver.addDependency(workerDataSource);

    const healthResolver = new CfnResolver(this, 'HealthResolver', {
      apiId: this.apiId,
      typeName: 'Query',
      fieldName: 'health',
      dataSourceName: healthDataSource.name,
      requestMappingTemplate: JSON.stringify({ version: '2018-05-29', payload: { status: 'ok' } }),
      responseMappingTemplate: '$util.toJson("ok")'
    });
    healthResolver.addDependency(healthDataSource);

    new CfnOutput(this, 'AppSyncGraphqlUrl', {
      value: this.graphqlUrl
    });
    new CfnOutput(this, 'AppSyncRealtimeUrl', {
      value: this.realtimeUrl
    });
  }
}
