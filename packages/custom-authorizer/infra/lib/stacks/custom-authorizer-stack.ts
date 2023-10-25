import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';

export class CustomAuthorizerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ns = this.node.tryGetContext('ns') as string;

    const fn = new lambdaNodejs.NodejsFunction(this, 'AuthorizerFunction', {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.resolve(__dirname, '..', 'functions', 'authorizer.ts'),
      environment: {
        ACCOUNT: this.account,
        REGION: this.region,
        TOPIC: 'hello/world',
      },
    });
    fn.grantInvoke(new iam.ServicePrincipal('iot.amazonaws.com'));

    new iot.CfnAuthorizer(this, `CustomAuthorizer`, {
      authorizerName: `${ns}CustomAuthorizer`,
      authorizerFunctionArn: fn.functionArn,
      signingDisabled: true,
      status: 'ACTIVE',
      //      enableCachingForHttp: true,
    });
  }
}
