FROM node:20.18-alpine

WORKDIR /frontend

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build
