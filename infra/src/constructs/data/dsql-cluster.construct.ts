import { CfnOutput, CfnResource, Stack } from 'aws-cdk-lib';
import { type IGrantable, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface DsqlClusterConstructProps {
  readonly projectName: string;
  readonly environmentName: string;
  readonly deletionProtection: boolean;
}

export class DsqlClusterConstruct extends Construct {
  readonly cluster: CfnResource;
  readonly identifier: string;
  readonly endpoint: string;
  readonly resourceArn: string;
  readonly vpcEndpointServiceName: string;

  constructor(scope: Construct, id: string, props: DsqlClusterConstructProps) {
    super(scope, id);

    this.cluster = new CfnResource(this, 'Cluster', {
      type: 'AWS::DSQL::Cluster',
      properties: {
        DeletionProtectionEnabled: props.deletionProtection,
        Tags: [
          { Key: 'Application', Value: props.projectName },
          { Key: 'Environment', Value: props.environmentName }
        ]
      }
    });

    this.identifier = this.cluster.ref;
    this.endpoint = this.cluster.getAtt('Endpoint').toString();
    this.resourceArn = this.cluster.getAtt('ResourceArn').toString();
    this.vpcEndpointServiceName = this.cluster.getAtt('VpcEndpointServiceName').toString();

    new CfnOutput(this, 'DsqlClusterIdentifier', {
      value: this.identifier
    });
    new CfnOutput(this, 'DsqlClusterEndpoint', {
      value: this.endpoint
    });
    new CfnOutput(this, 'DsqlVpcEndpointServiceName', {
      value: this.vpcEndpointServiceName
    });
  }

  grantConnect(grantee: IGrantable) {
    grantee.grantPrincipal.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['dsql:DbConnect', 'dsql:DbConnectAdmin'],
        resources: [this.resourceArn]
      })
    );
  }

  get postgresConnectionHost(): string {
    return this.endpoint;
  }

  get clusterRegion(): string {
    return Stack.of(this).region;
  }
}
