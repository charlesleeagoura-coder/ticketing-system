FROM node:22-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "--experimental-sqlite", "server.js"]
