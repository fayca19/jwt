FROM node:18-alpine
WORKDIR /app
COPY package*.json .
COPY . .
ENV NODE_ENV=production
RUN npm ci
CMD ["node","./bin/www"]
