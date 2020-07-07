FROM node:14.4

WORKDIR /webfm
COPY ./package*.json ./
RUN npm ci
EXPOSE 8090
COPY ./ ./
RUN npm run build
CMD [ "npm", "run","dev" ]