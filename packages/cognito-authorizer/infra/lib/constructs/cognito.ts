import * as path from 'path';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { CfnOutput, aws_wafv2 as wafv2 } from 'aws-cdk-lib';

interface IProps {
  redirectUri: string;
}

interface ITriggerFunctions {
  preSignup?: lambda.IFunction;
  postConfirmation?: lambda.IFunction;
  preAuthentication?: lambda.IFunction;
  postAuthentication?: lambda.IFunction;
}

export class CognitoUserPool extends Construct {
  public readonly userPool: cognito.IUserPool;
  public readonly userPoolClient: cognito.IUserPoolClient;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    const ns = this.node.tryGetContext('ns') as string;

    const triggerFunctions = this.newTriggerFunctions(ns);
    const userPool = this.newUserPool(ns, triggerFunctions);
    const userPoolClient = this.newUserPoolClient(
      ns,
      userPool,
      props.redirectUri
    );
    const identityPool = this.newIdentityPool(ns, userPool, userPoolClient);

    new CfnOutput(this, 'UserPoolIdOutput', {
      value: userPool.userPoolId,
    });
    new CfnOutput(this, 'UserPoolWebClientIdOutput', {
      value: userPoolClient.userPoolClientId,
    });
    new CfnOutput(this, 'IdentityPoolIdOutput', {
      value: identityPool.logicalId,
    });

    this.userPool = userPool;
    this.userPoolClient = userPoolClient;
  }

  private newTriggerFunctions(ns: string): ITriggerFunctions {
    const postAuthentication = new lambdaNodejs.NodejsFunction(
      this,
      `PreAuthenticationFunction`,
      {
        functionName: `${ns}PreAuthenticationTrigger`,
        entry: path.resolve(
          __dirname,
          '..',
          'functions',
          'post-authentication.ts'
        ),
        runtime: lambda.Runtime.NODEJS_18_X,
      }
    );

    return {
      postAuthentication,
    };
  }

  private newUserPool(
    ns: string,
    triggerFunctions: ITriggerFunctions
  ): cognito.UserPool {
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${ns}UserPool`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true },
      },
      customAttributes: {
        provider: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        requireDigits: true,
        requireSymbols: false,
        requireLowercase: true,
        requireUppercase: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      lambdaTriggers: {
        preSignUp: triggerFunctions.preSignup,
        postConfirmation: triggerFunctions.postConfirmation,
        preAuthentication: triggerFunctions.preAuthentication,
        postAuthentication: triggerFunctions.postAuthentication,
      },
    });
    new cognito.UserPoolDomain(this, `UserPoolDomain`, {
      userPool,
      cognitoDomain: {
        domainPrefix: ns.toLowerCase(),
      },
    });

    // WAF
    const webACL = new wafv2.CfnWebACL(this, 'CognitoWebACL', {
      scope: 'REGIONAL',
      name: ns,
      defaultAction: {
        allow: {},
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesAmazonIpReputationList',
          priority: 10,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesAmazonIpReputationList',
          },
        },
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 20,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
              // Excluding generic RFI body rule for sns notifications
              // https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-list.html
              excludedRules: [
                { name: 'GenericRFI_BODY' },
                { name: 'SizeRestrictions_BODY' },
              ],
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesCommonRuleSet',
          },
        },
      ],
      visibilityConfig: {
        metricName: ns,
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: false,
      },
    });
    new wafv2.CfnWebACLAssociation(this, 'CognitoWebACLAssociation', {
      resourceArn: userPool.userPoolArn,
      webAclArn: webACL.attrArn,
    });

    return userPool;
  }

  private newUserPoolClient(
    ns: string,
    userPool: cognito.UserPool,
    redirectUri: string
  ): cognito.UserPoolClient {
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPoolClientName: `${ns}UserPoolClient`,
      userPool,
      authFlows: {
        adminUserPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        callbackUrls: [redirectUri],
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.OPENID,
        ],
      },
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });
    return userPoolClient;
  }

  private newIdentityPool(
    ns: string,
    userPool: cognito.UserPool,
    userPoolClient: cognito.UserPoolClient
  ): cognito.CfnIdentityPool {
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: `${ns}IdentityPool`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    // role assignment
    const authenticatedRole = new iam.Role(
      this,
      'CognitoDefaultAuthenticatedRole',
      {
        assumedBy: new iam.FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': identityPool.ref,
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'authenticated',
            },
          },
          'sts:AssumeRoleWithWebIdentity'
        ),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('AWSIoTDataAccess'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AWSIoTConfigAccess'),
        ],
      }
    );
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'mobileanalytics:PutEvents',
          'cognito-sync:*',
          'cognito-identity:*',
        ],
        resources: ['*'],
      })
    );
    const unauthenticatedRole = new iam.Role(
      this,
      'CognitoDefaultUnauthenticatedRole',
      {
        assumedBy: new iam.FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': identityPool.ref,
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'unauthenticated',
            },
          },
          'sts:AssumeRoleWithWebIdentity'
        ),
      }
    );
    unauthenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['mobileanalytics:PutEvents', 'cognito-sync:*'],
        resources: ['*'],
      })
    );
    new cognito.CfnIdentityPoolRoleAttachment(this, 'AuthRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
        unauthenticated: unauthenticatedRole.roleArn,
      },
    });

    return identityPool;
  }
}
