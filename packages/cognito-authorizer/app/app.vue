<template>
  <div>
    <Authenticator>
      <template v-slot="{ user, signOut }">
        <h1>Hello {{ user.username }}!</h1>
        <button @click="signOut">Sign Out</button>
        <button @click="onPublish">Publish</button>
      </template>
    </Authenticator>
  </div>
</template>

<script setup lang="ts">
import { Amplify, Auth, PubSub } from 'aws-amplify';
import { Authenticator } from "@aws-amplify/ui-vue"
import { AWSIoTProvider } from '@aws-amplify/pubsub';
import "@aws-amplify/ui-vue/styles.css";
Amplify.Logger.LOG_LEVEL = 'VERBOSE';

const runtimeConfig = useRuntimeConfig()
Amplify.configure({
  aws_project_region: runtimeConfig.app.awsProjectRegion,
  aws_cognito_identity_pool_id: runtimeConfig.app.awsCognitoIdentityPoolId,
  aws_cognito_region: runtimeConfig.app.awsCognitoRegion,
  aws_user_pools_id: runtimeConfig.app.awsUserPoolsId,
  aws_user_pools_web_client_id: runtimeConfig.app.awsUserPoolsWebClientId,
});

onMounted(async () => {
  const user = await Auth.currentUserCredentials()
  console.log(`identityID: ${JSON.stringify(user.identityId)}`)

  PubSub.removePluggable('AWSIoTProvider');
  Amplify.addPluggable(
    new AWSIoTProvider({
      aws_pubsub_region: runtimeConfig.public.awsRegion,
      aws_pubsub_endpoint: runtimeConfig.public.awsPubsubEndpoint,
      clientId: user.identityId,
    })
  );

  PubSub.subscribe(runtimeConfig.app.topic).subscribe({
    next: data => console.log('Message received', data),
    error: error => console.error(error),
    complete: () => console.log('Done'),
  });
})

const onPublish = async () => {
  await PubSub.publish(runtimeConfig.app.topic, { 'msg': 'I am.' });
  console.log('published message')
}
</script>
