FROM node:20-alpine

WORKDIR /app

# Install angular cli globally
RUN npm install -g @angular/cli@21

# Since we don't have package.json yet, we just provide a basic structure
# COPY package*.json ./
# RUN npm install
# COPY . .

EXPOSE 4200

# Start command
# CMD ["ng", "serve", "--host", "0.0.0.0"]
CMD ["sh", "-c", "echo 'Frontend container ready. Waiting for project initialization...' && tail -f /dev/null"]
