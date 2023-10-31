export default defineNuxtConfig({
  devtools: { enabled: true },
  runtimeConfig: {
    app: {
      topic: 'myTopic',
      awsProjectRegion: process.env.AWS_REGION,
      awsCognitoIdentityPoolId: process.env.AWS_COGNITO_IDENTITY_POOL_ID,
      awsCognitoRegion: process.env.AWS_REGION,
      awsUserPoolsId: process.env.AWS_USER_POOLS_ID,
      awsUserPoolsWebClientId: process.env.AWS_USER_POOLS_WEB_CLIENT_ID,
    },
    public: {
      awsRegion: process.env.AWS_REGION,
      awsPubsubEndpoint: process.env.AWS_PUBSUB_ENDPOINT,
    },
  },
  alias: {
    './runtimeConfig': './runtimeConfig.browser',
  },
  vite: {
    define: {
      'window.global': {},
    },
  },
});
