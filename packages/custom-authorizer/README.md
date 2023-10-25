# IoT Core Custom Authorizer

[Understanding the custom authentication workflow](https://docs.aws.amazon.com/iot/latest/developerguide/custom-authorizer.html)

# Prerequisites

- awscli
- node.js 16+
- AWS Account and locally configured AWS credential

# Installation

1. Deploy Infra
2. Connect device

## Deploy infrastructure

1. open [**/infra/config/dev.toml**](infra/config/dev.toml) and replace values for your environment

2. copy `dev.toml` file under infra folder with name `.toml`

```bash
$ cd infra
$ cp config/dev.toml .toml
```

3. deploy infrastructure

install cdk

```bash
$ npm i -g aws-cdk@2.100.0
```

deploy cdk

```bash
$ npm i
$ cdk bootstrap
$ cdk deploy "*" --require-apporval never
```

## Connect device

1. install dependencies

```bash
$ npm i -g ts-node
```

```bash
$ cd src
$ npm i
```

2. run main.ts

```bash
$ export THING_NAME=thing01
$ export DATA_ENDPOINT=$(aws iot describe-endpoint --endpoint-type iot:Data-ATS --query endpointAddress --output text)
$ ts-node main.ts -e $DATA_ENDPOINT -n $THING_NAME -c IoTCustomAuthorizerDevCustomAuthorizer -u haandol -p test
```

# References

- https://aws.amazon.com/ko/blogs/iot/how-to-automate-onboarding-of-iot-devices-to-aws-iot-core-at-scale-with-fleet-provisioning/
- https://github.com/aws-samples/aws-iot-fleet-provisioning
