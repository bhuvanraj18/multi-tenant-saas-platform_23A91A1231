FROM node:18-alpine

WORKDIR /app

COPY package*.json ./


RUN apk add --no-cache curl

RUN npm install

COPY . .

# Run migrations and start server
CMD ["sh", "-c", "npm run migrate && npm start"]
