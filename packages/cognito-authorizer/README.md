# IoT Core Cognito Authorizer

# Prerequisites

- awscli
- node.js 18+
- AWS Account and locally configured AWS credential

# Installation

1. Deploy Infra
2. Connect device
   c

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
