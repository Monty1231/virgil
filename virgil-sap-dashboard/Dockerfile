# Frontend (Next.js) Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN apk add --no-cache libc6-compat openssl
# Build-time placeholders (fine)
ENV NEXTAUTH_URL=http://localhost:3000 \
    NEXTAUTH_SECRET=build_dummy_secret \
    GOOGLE_CLIENT_ID=build_dummy \
    GOOGLE_CLIENT_SECRET=build_dummy \
    STRIPE_SECRET_KEY=sk_test_build_dummy \
    OPENAI_API_KEY=build_dummy \
    PINECONE_API_KEY=build_dummy \
    PYTHON_TEMPLATE_API_URL=http://localhost:8000
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN apk add --no-cache libc6-compat openssl
COPY --from=build /app ./
EXPOSE 3000

CMD ["npx","next","start","-p","3000","-H","0.0.0.0"]
