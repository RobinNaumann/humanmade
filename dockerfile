FROM oven/bun

LABEL version="0.2.5"

RUN mkdir /build
WORKDIR /build

# RUN rm -f bun.lockb
COPY package.json bun.lock ./
RUN mkdir /app
RUN bun install --frozen-lockfile
RUN cp -rT /build/node_modules /app/node_modules

# copy all files not ignored by .dockerignore
COPY ./ ./

# build the application
RUN bun run --env-file .env.production build
RUN cp -rT /build/dist /app
RUN rm -rf /build

# set up runtime environment
EXPOSE 80

# set volume for persistent data
VOLUME /data

WORKDIR /app
ENTRYPOINT ["bun", "./server/app.server.js"]