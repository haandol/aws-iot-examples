#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CustomAuthorizerStack } from '../lib/stacks/custom-authorizer-stack';
import { Config } from '../config/loader';

const ns = Config.app.ns;
const app = new cdk.App({
  context: {
    ns,
  },
});

new CustomAuthorizerStack(app, `${ns}CustomAuthorizerStack`);
