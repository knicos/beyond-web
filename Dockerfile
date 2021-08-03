FROM node:16-alpine AS build

WORKDIR /usr/src/app

RUN mkdir ./packages

COPY ./package.json ./yarn.lock ./lerna.json ./
COPY ./packages/player/package.json ./packages/player/
COPY ./packages/protocol/package.json ./packages/protocol/
COPY ./packages/common/package.json ./packages/common/
COPY ./packages/stream-service/package.json ./packages/stream-service/
COPY ./packages/index-service/package.json ./packages/index-service/

RUN yarn install

COPY ./packages ./packages

RUN yarn build

EXPOSE 8080

USER node
