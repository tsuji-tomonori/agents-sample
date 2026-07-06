import { CfnOutput, Duration } from 'aws-cdk-lib';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  Function as CloudFrontFunction,
  FunctionCode,
  FunctionEventType,
  OriginRequestPolicy,
  PriceClass,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import type { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface CloudFrontSiteConstructProps {
  readonly projectName: string;
  readonly environmentName: string;
  readonly spaBucket: IBucket;
  readonly logBucket: IBucket;
  readonly apiDomainName: string;
  readonly apiOriginPath: string;
  readonly appsyncGraphqlDomainName: string;
  readonly appsyncRealtimeDomainName: string;
  readonly webAclArn?: string;
}

export class CloudFrontSiteConstruct extends Construct {
  readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: CloudFrontSiteConstructProps) {
    super(scope, id);

    const spaRewriteFunction = new CloudFrontFunction(this, 'SpaRewriteFunction', {
      functionName: `${props.projectName}-${props.environmentName}-spa-rewrite`,
      code: FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var isApi = uri.indexOf('/api/') === 0 || uri === '/health' || uri.indexOf('/graphql') === 0;
  var hasExtension = uri.split('/').pop().indexOf('.') !== -1;
  if (!isApi && !hasExtension) {
    request.uri = '/index.html';
  }
  return request;
}
`)
    });

    this.distribution = new Distribution(this, 'Distribution', {
      comment: `${props.projectName}-${props.environmentName} Agentic RAG QA Console`,
      defaultRootObject: 'index.html',
      enableLogging: true,
      logBucket: props.logBucket,
      logFilePrefix: 'cloudfront/site/',
      priceClass: PriceClass.PRICE_CLASS_200,
      webAclId: props.webAclArn,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(props.spaBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: ResponseHeadersPolicy.SECURITY_HEADERS,
        functionAssociations: [
          {
            function: spaRewriteFunction,
            eventType: FunctionEventType.VIEWER_REQUEST
          }
        ]
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new HttpOrigin(props.apiDomainName, {
            originPath: props.apiOriginPath,
            readTimeout: Duration.seconds(30),
            keepaliveTimeout: Duration.seconds(5)
          }),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          cachePolicy: CachePolicy.CACHING_DISABLED,
          originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS
        },
        '/health': {
          origin: new HttpOrigin(props.apiDomainName, {
            originPath: props.apiOriginPath
          }),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: CachePolicy.CACHING_DISABLED,
          originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          responseHeadersPolicy: ResponseHeadersPolicy.SECURITY_HEADERS
        },
        '/graphql': {
          origin: new HttpOrigin(props.appsyncGraphqlDomainName),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          cachePolicy: CachePolicy.CACHING_DISABLED,
          originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS
        },
        '/graphql/realtime': {
          origin: new HttpOrigin(props.appsyncRealtimeDomainName),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          cachePolicy: CachePolicy.CACHING_DISABLED,
          originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS
        }
      }
    });

    new CfnOutput(this, 'CloudFrontDomainName', {
      value: this.distribution.distributionDomainName
    });
  }
}
