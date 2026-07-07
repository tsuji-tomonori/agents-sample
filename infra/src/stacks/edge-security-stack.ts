import { Stack, type StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebAclConstruct } from '../constructs/security/web-acl.construct.js';

export interface EdgeSecurityStackProps extends StackProps {
  readonly projectName: string;
  readonly environmentName: string;
  readonly wafRateLimit: number;
}

export class EdgeSecurityStack extends Stack {
  readonly webAclArn: string;

  constructor(scope: Construct, id: string, props: EdgeSecurityStackProps) {
    super(scope, id, props);

    const webAcl = new WebAclConstruct(this, 'WebAcl', {
      projectName: props.projectName,
      environmentName: props.environmentName,
      rateLimit: props.wafRateLimit
    });

    this.webAclArn = webAcl.webAcl.attrArn;
  }
}
