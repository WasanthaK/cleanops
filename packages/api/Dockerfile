FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm run build
CMD ["node", "dist/main.js"]
