FROM node:14.4

WORKDIR /webfm
COPY ./package*.json ./
RUN npm i
EXPOSE 8090
COPY ./ ./
CMD [ "npm", "run","dev" ]