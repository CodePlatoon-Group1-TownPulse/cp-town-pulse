# Build the react app
# Use slim node build
FROM node:20-slim AS build

# set workdir
WORKDIR /app

# copy the package files
COPY package*.json ./

# install 
RUN npm install

# copy everything here
COPY . .

# build it (and they will come)
RUN npm run build

# Take those files and serve then with Nginx
FROM nginx:alpine

# copy the build output
COPY --from=build /app/dist /usr/share/nginx/html

# copy over the config

# port
EXPOSE 80

# run it
CMD ["nginx", "-g", "daemon off;"]
