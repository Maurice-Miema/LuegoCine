-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('YOUTUBE', 'VIMEO', 'DAILYMOTION');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('PLAYING', 'PAUSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomUtilisateur" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "hashedRefreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movies" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "overview" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "releaseDate" TIMESTAMP(3),
    "runtime" INTEGER,
    "voteAverage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_sources" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "provider" "VideoProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT,
    "url" TEXT,
    "isEmbeddable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "videoSourceId" TEXT NOT NULL,
    "title" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "maxParticipants" INTEGER,
    "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_participants" (
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "room_participants_pkey" PRIMARY KEY ("roomId","userId")
);

-- CreateTable
CREATE TABLE "watch_states" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "status" "PlayerStatus" NOT NULL DEFAULT 'PAUSED',
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_nomUtilisateur_key" ON "users"("nomUtilisateur");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "oauth_accounts_userId_idx" ON "oauth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_providerAccountId_key" ON "oauth_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "movies_tmdbId_key" ON "movies"("tmdbId");

-- CreateIndex
CREATE INDEX "movies_title_idx" ON "movies"("title");

-- CreateIndex
CREATE INDEX "video_sources_movieId_idx" ON "video_sources"("movieId");

-- CreateIndex
CREATE INDEX "video_sources_provider_idx" ON "video_sources"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "video_sources_provider_externalId_key" ON "video_sources"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "watch_rooms_code_key" ON "watch_rooms"("code");

-- CreateIndex
CREATE INDEX "watch_rooms_hostId_idx" ON "watch_rooms"("hostId");

-- CreateIndex
CREATE INDEX "watch_rooms_movieId_idx" ON "watch_rooms"("movieId");

-- CreateIndex
CREATE INDEX "watch_rooms_videoSourceId_idx" ON "watch_rooms"("videoSourceId");

-- CreateIndex
CREATE INDEX "watch_rooms_status_idx" ON "watch_rooms"("status");

-- CreateIndex
CREATE INDEX "watch_rooms_scheduledAt_idx" ON "watch_rooms"("scheduledAt");

-- CreateIndex
CREATE INDEX "room_participants_userId_idx" ON "room_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "watch_states_roomId_key" ON "watch_states"("roomId");

-- CreateIndex
CREATE INDEX "watch_states_updatedBy_idx" ON "watch_states"("updatedBy");

-- CreateIndex
CREATE INDEX "messages_roomId_createdAt_idx" ON "messages"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_userId_idx" ON "messages"("userId");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_sources" ADD CONSTRAINT "video_sources_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_rooms" ADD CONSTRAINT "watch_rooms_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_rooms" ADD CONSTRAINT "watch_rooms_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_rooms" ADD CONSTRAINT "watch_rooms_videoSourceId_fkey" FOREIGN KEY ("videoSourceId") REFERENCES "video_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "watch_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_states" ADD CONSTRAINT "watch_states_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "watch_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_states" ADD CONSTRAINT "watch_states_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "watch_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
