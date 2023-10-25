import {
  IoTCustomAuthorizerEvent,
  Context,
  IoTCustomAuthorizerResult,
} from 'aws-lambda';

const Account = process.env['ACCOUNT'];
const Region = process.env['REGION'];
const Topic = process.env['TOPIC'] || 'hello/world';

export const handler = async (
  event: IoTCustomAuthorizerEvent,
  context: Context
): Promise<IoTCustomAuthorizerResult> => {
  console.log(JSON.stringify(event, null, 2));
  let clientId = event.protocolData.mqtt?.clientId;
  let username = event.protocolData.mqtt?.username;
  let pwd = event.protocolData.mqtt?.password;
  if (!(clientId && username && pwd)) {
    console.log('Denied: Bad Request');
    return generateAuthResponse(clientId || 'unknown', 'Deny');
  }
  console.log(
    `clientId: ${clientId}, username: ${username}, password: ${!!pwd}`
  );

  let buff = Buffer.from(pwd, 'base64');
  let passwd = buff.toString('ascii');
  switch (passwd) {
    case 'test':
      console.log('Allowed');
      return generateAuthResponse(clientId, 'Allow');
    default:
      console.log('Denied: wrong password');
      return generateAuthResponse(clientId, 'Deny');
  }
};

// Helper function to generate the authorization response.
function generateAuthResponse(
  principalId: string,
  effect: string
): IoTCustomAuthorizerResult {
  return {
    isAuthenticated: true,
    principalId,
    disconnectAfterInSeconds: 3600,
    refreshAfterInSeconds: 300,
    policyDocuments: [
      {
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['iot:Connect'],
            Effect: effect,
            Resource: [`arn:aws:iot:${Region}:${Account}:client/*`],
          },
          {
            Action: ['iot:Publish', 'iot:Receive'],
            Effect: effect,
            Resource: [`arn:aws:iot:${Region}:${Account}:topic/${Topic}`],
          },
          {
            Action: ['iot:Subscribe'],
            Effect: effect,
            Resource: [`arn:aws:iot:${Region}:${Account}:topicfilter/${Topic}`],
          },
        ],
      },
    ],
  };
}
