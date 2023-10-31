<template>
  <div>
    <Authenticator>
      <template v-slot="{ user, signOut }">
        <h1>Hello!</h1>
        <h2>Username: {{ user.username }}</h2>
        <h2>IdentityID: {{ identityId }}</h2>
        <div>
          <label>Publish to {{ topic }}: </label>
          <button @click="onPublish">Publish</button>
        </div>
        <div>
          <p>Last message:</p>
          <div> {{ lastMessage }} </div>
        </div>
        <div>
          <button @click="signOut">Sign Out</button>
        </div>
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

const topic = ref<string>('');
const lastMessage = ref<string>('');
const identityId = ref<string>('');

onMounted(async () => {
  const user = await Auth.currentUserCredentials()
  console.log(`identityID: ${JSON.stringify(user.identityId)}`)
  identityId.value = user.identityId;
  topic.value = runtimeConfig.app.topic || 'myTopic';

  PubSub.removePluggable('AWSIoTProvider');
  Amplify.addPluggable(
    new AWSIoTProvider({
      aws_pubsub_region: runtimeConfig.public.awsRegion,
      aws_pubsub_endpoint: runtimeConfig.public.awsPubsubEndpoint,
      clientId: user.identityId,
    })
  );

  PubSub.subscribe(runtimeConfig.app.topic).subscribe({
    next: data => {
      console.log('Message received', data);
      lastMessage.value = JSON.stringify(data);
    },
    error: error => console.error(error),
    complete: () => console.log('Done'),
  });
})

const onPublish = async () => {
  await PubSub.publish(runtimeConfig.app.topic, { 'msg': 'I am 신뢰에요.' });
  console.log('published message')
}
</script>
