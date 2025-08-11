FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./

COPY . .

RUN npm install --legacy-peer-deps

RUN npm run build 

FROM nginx:latest

RUN rm /etc/nginx/conf.d/default.conf

COPY default.conf /etc/nginx/conf.d/

COPY --from=builder /app/dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]



