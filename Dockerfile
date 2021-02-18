FROM node:14.4

WORKDIR /webfm
COPY ./package*.json ./
RUN npm ci
EXPOSE 8564 8564
ENV NODE_ENV "production"
