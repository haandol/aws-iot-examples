# IoT Core Cognito Authorizer

<img src="https://miro.medium.com/v2/resize:fit:1400/1*5Lwi-RU4Sq1DYvKn91dukg.png" />

# Prerequisites

- awscli
- node.js 18+
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

## Connect to MQTT over Websocket

1. install dependencies

```bash
$ cd app
$ yarn install
```

2. open [env/dev.env](env/dev.env) and fill the values. you can find the values from output of `cdk deploy` result except `aws_pubsub_endpoint`.

you can get `aws_pubsub_endpoint` with following command.

```bash
$ aws iot describe-endpoint --endpoint-type iot:Data-ATS --query endpointAddress --output text
```

and then, copy `dev.env` file under env folder with name `.env`

```bash
$ cp env/dev.env .env
```

2. run build and web server

```bash
$ yarn build
$ node .output/server/index.mjs
```

3. visit web page

```bash
$ open localhost:3000
```

4. sign up by email and signin with it. then you can find out the identity id on the page.

5. attach iot policy to user federated identity id.

```bash
$ aws iot attach-principal-policy --policy-name IoTCogAuthorizerDevIoTDataPolicy --principal YOUR_IDENTITY_ID
```

6. refresh the page and press publish button.
