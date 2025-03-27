# Stage 1: Build
FROM node:18 AS build

WORKDIR /app

# Only copy the necessary files first
COPY package*.json ./

# Install dependencies with root permissions
RUN npm install --unsafe-perm

# Now copy the rest (after node_modules is installed)
COPY . .

# Ensure react-scripts has the correct permissions
RUN chmod +x node_modules/.bin/react-scripts

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80