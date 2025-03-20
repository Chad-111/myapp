# Build React App
FROM node:20 AS build
# ✅ This creates the `/app` directory
WORKDIR /app 
COPY package.json package-lock.json ./
RUN npm install
# ✅ Copies all frontend files into `/app`
COPY . . 
# ✅ Ensures React builds properly
RUN npm run build 


# Serve with Nginx
FROM nginx:alpine
# ✅ Copies built files to Nginx
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
