FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Use host 0.0.0.0 to allow access from outside
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
