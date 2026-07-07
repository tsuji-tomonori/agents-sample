import { CfnOutput } from 'aws-cdk-lib';
import { CfnWebACL } from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface WebAclConstructProps {
  readonly projectName: string;
  readonly environmentName: string;
  readonly rateLimit: number;
}

export class WebAclConstruct extends Construct {
  readonly webAcl: CfnWebACL;

  constructor(scope: Construct, id: string, props: WebAclConstructProps) {
    super(scope, id);

    const metricPrefix = `${props.projectName}${props.environmentName}`.replace(/[^A-Za-z0-9]/g, '');
    this.webAcl = new CfnWebACL(this, 'WebAcl', {
      name: `${props.projectName}-${props.environmentName}-cloudfront-web-acl`,
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${metricPrefix}WebAcl`,
        sampledRequestsEnabled: true
      },
      rules: [
        {
          name: 'AwsManagedCommonRuleSet',
          priority: 10,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `${metricPrefix}Common`,
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'RateLimit',
          priority: 20,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: props.rateLimit,
              aggregateKeyType: 'IP'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `${metricPrefix}RateLimit`,
            sampledRequestsEnabled: true
          }
        }
      ]
    });

    new CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn
    });
  }
}
