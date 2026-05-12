FROM node:22-slim

  WORKDIR /app

  # Copy only standalone server files (not monorepo)
  COPY server.js ./
  COPY package.json ./

  # Install only server.js dependencies
  RUN npm install --ignore-scripts

  EXPOSE 8080

  CMD ["node", "server.js"]
  