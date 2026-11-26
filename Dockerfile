ARG PROVIDERS=local

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json .npmrc ./
RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
    npm config set //npm.pkg.github.com/:_authToken="$(cat /run/secrets/NODE_AUTH_TOKEN 2>/dev/null)" && \
    npm install && \
    npm config delete //npm.pkg.github.com/:_authToken
RUN for p in $(echo "$PROVIDERS" | tr ',' ' '); do \
      case "$p" in \
        aws)       npm install @commonkads/provider-aws ;; \
        anthropic) npm install @commonkads/provider-anthropic ;; \
        google)    npm install @commonkads/provider-google ;; \
        local)     ;; \
      esac; \
    done
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run compile
RUN npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
