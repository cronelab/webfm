FROM node:14.4

WORKDIR /webfm
COPY ./package*.json ./
RUN npm ci
# COPY ./ ./
# COPY ./server ./server
COPY ./webpack* ./
COPY ./.babelrc ./
COPY ./tsconfig.json ./tsconfig.json
CMD [ "npm", "run","dev" ]