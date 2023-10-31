import * as awsLambda from 'aws-lambda';

export const handler = async (
  event: awsLambda.PreAuthenticationTriggerEvent,
  context: any
): Promise<awsLambda.PreAuthenticationTriggerEvent> => {
  console.log(JSON.stringify(event, null, 2));
  return event;
};
