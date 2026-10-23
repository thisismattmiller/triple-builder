FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts: rdf-canonize 0.2.x tries to node-gyp a C++ addon at install
# time and fails on modern Node; the module falls back to its pure-JS implementation.
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY index.js ./
COPY assets ./assets
COPY views ./views

# Runtime state lives in these three dirs (bind-mounted in docker-compose.yml).
RUN mkdir -p subsets subsetsshare subsetsshareimages \
 && chown -R node:node /app

USER node
ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "require('http').get('http://127.0.0.1:3000/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "index.js"]
