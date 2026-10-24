# The adventure repository service. Built from the repository root (it takes the shared protocol file):
#   docker build -f server/Dockerfile -t scrying-glass-repo .
FROM node:24-alpine
WORKDIR /app
COPY server/package.json server/
COPY server/src server/src
COPY src/shared/repo.ts src/shared/repo.ts
# The shared file is an ES module too.
RUN echo '{"type":"module"}' > package.json
ENV NODE_ENV=production PORT=8080
EXPOSE 8080
USER node
CMD ["node", "server/src/main.ts"]
