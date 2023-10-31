#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/stacks/auth-stack';
import { Config } from '../config/loader';

const ns = Config.app.ns;
const app = new cdk.App({
  context: {
    ns,
  },
});

new AuthStack(app, `${ns}AuthStack`, {
  redirectUri: Config.auth.redirectUri,
});
