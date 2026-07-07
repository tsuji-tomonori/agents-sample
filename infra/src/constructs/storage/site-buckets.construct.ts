import { RemovalPolicy, Tags } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketAccessControl, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface SiteBucketsConstructProps {
  readonly projectName: string;
  readonly environmentName: string;
}

export class SiteBucketsConstruct extends Construct {
  readonly spaBucket: Bucket;
  readonly logBucket: Bucket;

  constructor(scope: Construct, id: string, props: SiteBucketsConstructProps) {
    super(scope, id);

    this.logBucket = new Bucket(this, 'LogBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
      removalPolicy: RemovalPolicy.RETAIN
    });

    this.spaBucket = new Bucket(this, 'SpaBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      serverAccessLogsBucket: this.logBucket,
      serverAccessLogsPrefix: 's3/spa/',
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN
    });

    for (const bucket of [this.logBucket, this.spaBucket]) {
      Tags.of(bucket).add('Application', props.projectName);
      Tags.of(bucket).add('Environment', props.environmentName);
    }
  }
}
