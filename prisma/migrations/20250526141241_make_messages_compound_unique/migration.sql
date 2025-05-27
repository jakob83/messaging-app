/*
  Warnings:

  - A unique constraint covering the columns `[receiverId,senderId]` on the table `friendrequests` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "friendrequests_receiverId_senderId_key" ON "friendrequests"("receiverId", "senderId");
