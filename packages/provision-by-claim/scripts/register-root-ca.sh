#!/bin/sh

print_usage() {
  echo "Usage: $0 <PROFILE>"
  exit 2
}

if [ -n "$1" ];
then PROFILE=$1
else
  print_usage
fi

pushd .
cd certs

pwd
aws iot register-ca-certificate --ca-certificate file://Certificate.pem --verification-cert file://verification.pem --set-as-active --allow-auto-registration --profile $PROFILE

popd
