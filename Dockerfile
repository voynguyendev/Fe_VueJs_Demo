# Stage 1: Build the Vue 3 application
FROM node:16 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
#ENV VITE_API_BASE_URL=http://10.0.0.170:4000
#ENV VITE_API_BASE_URL_DEVICE_RFID=http://10.0.0.170:5001

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

# Expose port 80