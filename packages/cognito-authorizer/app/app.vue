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
import aws_exports from './src/aws-exports';
Amplify.Logger.LOG_LEVEL = 'VERBOSE';
Amplify.configure(aws_exports);

onMounted(async () => {
  const user = await Auth.currentUserCredentials()
  console.log('!!!!!', JSON.stringify(user.identityId))

  PubSub.removePluggable('AWSIoTProvider');
  Amplify.addPluggable(
    new AWSIoTProvider({
      aws_pubsub_region: 'ap-northeast-2',
      aws_pubsub_endpoint:
        'wss://aqg80fobwyg1q-ats.iot.ap-northeast-2.amazonaws.com/mqtt',
      clientId: user.identityId,
    })
  );

  PubSub.subscribe('myTopic').subscribe({
    next: data => console.log('Message received', data),
    error: error => console.error(error),
    complete: () => console.log('Done'),
  });
})

const onPublish = async () => {
  await PubSub.publish('myTopic', { 'msg': 'I am.' });
  console.log('published message')
}
</script>
