FROM node:14.4

WORKDIR /webfm
COPY ./package*.json ./
RUN npm ci
COPY ./ ./
COPY ./server ./server
COPY ./webpack* ./
COPY ./.babelrc ./
COPY ./tsconfig.json ./tsconfig.json
# COPY ./data/Frontiersin-YW-Patient-1 ./data/Frontiersin-YW-Patient-1
# COPY ./data/Frontiersin-YW-Patient-2 ./data/Frontiersin-YW-Patient-2
# COPY ./data/Frontiersin-YW-Patient-3 ./data/Frontiersin-YW-Patient-3
# COPY ./data/Frontiersin-YW-Patient-4 ./data/Frontiersin-YW-Patient-4
# COPY ./data/Frontiersin-YW-Patient-5 ./data/Frontiersin-YW-Patient-5
EXPOSE 8564 8564
ENV NODE_ENV "production"
# CMD [ "npm", "run","start" ]