FROM node:latest

WORKDIR /webfm
COPY ./package*.json ./
RUN npm ci
EXPOSE 8090
ENV NODE_ENV "production"
RUN npm run build
# CMD [ "npm", "run", "start" ]
