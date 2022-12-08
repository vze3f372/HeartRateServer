FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000
EXPOSE 3003

CMD ["node", "index.js"]

#invoke docker build . -t josephh/node-web-app
#docker run -p 3002:3002 -p 1883:1883 -d josephh/node-web-app