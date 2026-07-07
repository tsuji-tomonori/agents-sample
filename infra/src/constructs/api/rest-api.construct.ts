import { Aws, CfnOutput, Stack } from 'aws-cdk-lib';
import {
  AccessLogFormat,
  LambdaIntegration,
  LogGroupLogDestination,
  MethodLoggingLevel,
  RestApi
} from 'aws-cdk-lib/aws-apigateway';
import type { IFunction } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface RestApiConstructProps {
  readonly projectName: string;
  readonly environmentName: string;
  readonly handler: IFunction;
}

export class RestApiConstruct extends Construct {
  readonly restApi: RestApi;
  readonly domainName: string;
  readonly originPath: string;

  constructor(scope: Construct, id: string, props: RestApiConstructProps) {
    super(scope, id);

    const accessLogGroup = new LogGroup(this, 'AccessLogs', {
      logGroupName: `/aws/apigateway/${props.projectName}-${props.environmentName}-rest-api`,
      retention: RetentionDays.ONE_MONTH
    });

    this.restApi = new RestApi(this, 'RestApi', {
      restApiName: `${props.projectName}-${props.environmentName}-rest-api`,
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        accessLogDestination: new LogGroupLogDestination(accessLogGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields()
      }
    });

    const integration = new LambdaIntegration(props.handler, { proxy: true });
    this.restApi.root.addMethod('ANY', integration);
    this.restApi.root.addResource('{proxy+}').addMethod('ANY', integration);

    this.domainName = `${this.restApi.restApiId}.execute-api.${Stack.of(this).region}.${Aws.URL_SUFFIX}`;
    this.originPath = `/${this.restApi.deploymentStage.stageName}`;

    new CfnOutput(this, 'RestApiEndpoint', {
      value: this.restApi.url
    });
  }
}
