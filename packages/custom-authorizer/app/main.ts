import * as pino from 'pino';
import { iot, mqtt } from 'aws-iot-device-sdk-v2';
const logger = pino.pino({ name: 'app' });
const yargs = require('yargs');

type Args = { [index: string]: any };

const argv = yargs
  .usage('Usage: $0 [options]')
  .option('e', {
    alias: 'endpoint',
    type: 'string',
    description: 'device endpoint',
    demandOption: true,
  })
  .option('n', {
    alias: 'client_id',
    type: 'string',
    description: 'client id',
    demandOption: true,
  })
  .option('c', {
    alias: 'custom_authorizer_name',
    type: 'string',
    description: 'custom authorizer name',
    demandOption: true,
  })
  .option('u', {
    alias: 'custom_auth_username',
    type: 'string',
    description: 'custom authentication username',
    demandOption: true,
  })
  .option('p', {
    alias: 'custom_auth_password',
    type: 'string',
    description: 'custom authentication password',
    demandOption: true,
  }).argv;

function buildMqtt5Client(
  endpoint: string,
  clientId: string,
  authorizerName: string,
  username: string,
  password: string
) {
  const configBuilder =
    iot.AwsIotMqttConnectionConfigBuilder.new_default_builder();
  configBuilder.with_clean_session(false);
  configBuilder.with_client_id(clientId);
  configBuilder.with_endpoint(endpoint);
  configBuilder.with_custom_authorizer(username, authorizerName, '', password);

  const client = new mqtt.MqttClient();
  return client.new_connection(configBuilder.build());
}

async function main(argv: Args) {
  logger.info(`Connecting... ${JSON.stringify(argv)}`);

  const conn: mqtt.MqttClientConnection = buildMqtt5Client(
    argv.endpoint,
    argv.client_id,
    argv.custom_authorizer_name,
    argv.custom_auth_username,
    argv.custom_auth_password
  );

  console.log('Connecting...');
  await conn.connect();
  console.log('Connection completed.');

  const timer = setInterval(() => {}, 20 * 1000);

  const onMessage: mqtt.OnMessageCallback = (
    topic: string,
    payload: ArrayBuffer
  ) => {
    console.log(`received message from topic: ${topic} <= ${payload}`);
  };

  const topicName = 'hello/world';
  const subAck = await conn.subscribe(
    topicName,
    mqtt.QoS.AtLeastOnce,
    onMessage
  );
  logger.info('Suback result: ' + JSON.stringify(subAck));

  const pubAck = await conn.publish(
    topicName,
    JSON.stringify('hello world'),
    mqtt.QoS.AtLeastOnce
  );
  logger.info('Publish result: ' + JSON.stringify(pubAck));

  const unsubAck = await conn.unsubscribe(topicName);
  logger.info('Unsuback result: ' + JSON.stringify(unsubAck));

  console.log('Disconnecting...');
  await conn.disconnect();
  console.log('Disconnect completed.');

  clearTimeout(timer);
}

main(argv).catch((e) => {
  console.error(e);
  process.exit(1);
});
