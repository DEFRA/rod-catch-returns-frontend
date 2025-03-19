ARG PARENT_VERSION=2.3.0-node20.15.0

# https://github.com/DEFRA/defra-docker-node
FROM defradigital/node:${PARENT_VERSION} AS base

USER root

WORKDIR /app

# Install app dependencies
COPY / /app
RUN npm install pm2 -g --ignore-scripts \
    && npm install --ignore-scripts

# Default service port
ARG PORT=5000

EXPOSE ${PORT}

ENTRYPOINT [ "pm2-dev", "ecosystem.config.yml" ]
