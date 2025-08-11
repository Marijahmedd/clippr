FROM node:22-slim

RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y openssl
WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm i prisma 

COPY . .
RUN npx prisma generate
RUN npm run build

CMD ["npm", "run", "start"]
