import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iot from 'aws-cdk-lib/aws-iot';

export class IotPolicyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ns = this.node.tryGetContext('ns') as string;

    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'iot:Connect',
            'iot:Publish',
            'iot:Subscribe',
            'iot:Receive',
            'iot:GetThingShadow',
            'iot:UpdateThingShadow',
            'iot:DeleteThingShadow',
            'iot:ListNamedShadowsForThing',
          ],
          Resource: '*',
        },
      ],
    };
    new iot.CfnPolicy(this, 'IoTDataPolicy', {
      policyName: `${ns}IoTDataPolicy`,
      policyDocument,
    });
  }
}
