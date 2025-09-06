# Dockerfile for Render deployment (Node.js backend)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build || true
EXPOSE 5000
CMD ["npm", "run", "start"]
