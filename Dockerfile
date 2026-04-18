FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server ./server
COPY client ./client

EXPOSE 3001 5173

CMD ["npm", "start"]