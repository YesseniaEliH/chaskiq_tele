#!/usr/bin/env bash

docker build --build-arg APP_ENV=production \
             --build-arg RUBY_VERSION=3.2.0 \
             --build-arg PG_MAJOR=11 \
             --build-arg NODE_MAJOR=16 \
             --build-arg YARN_VERSION=1.13.0 \
             --build-arg BUNDLER_VERSION=2.3.26 \
             -f Dockerfile \
             -t  teleatiendo_chaskiq_test:v1.0 \
             .
