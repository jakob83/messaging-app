/*
  Warnings:

  - A unique constraint covering the columns `[receiverId,senderId,state]` on the table `friendrequests` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "friendrequests_receiverId_senderId_key";

-- CreateIndex
CREATE UNIQUE INDEX "friendrequests_receiverId_senderId_state_key" ON "friendrequests"("receiverId", "senderId", "state");
