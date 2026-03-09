FROM node:20-alpine

WORKDIR /app

RUN npm install -g @angular/cli@21

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/reports && npm run test:coverage -- --coverage

EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0", "--configuration", "development"]
