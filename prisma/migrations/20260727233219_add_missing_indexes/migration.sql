-- CreateIndex
CREATE INDEX "AIAgent_userId_idx" ON "AIAgent"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_agencyId_idx" ON "ActivityLog"("agencyId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_dateStr_idx" ON "ActivityLog"("dateStr");

-- CreateIndex
CREATE INDEX "Agency_referredById_idx" ON "Agency"("referredById");

-- CreateIndex
CREATE INDEX "AgencyDocument_agencyId_idx" ON "AgencyDocument"("agencyId");

-- CreateIndex
CREATE INDEX "AppErrorLog_userId_idx" ON "AppErrorLog"("userId");

-- CreateIndex
CREATE INDEX "AppErrorLog_agencyId_idx" ON "AppErrorLog"("agencyId");

-- CreateIndex
CREATE INDEX "Client_agencyId_idx" ON "Client"("agencyId");

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "CommissionLedger_sellerId_idx" ON "CommissionLedger"("sellerId");

-- CreateIndex
CREATE INDEX "CommissionLedger_agencyId_idx" ON "CommissionLedger"("agencyId");

-- CreateIndex
CREATE INDEX "CompanyProfile_userId_idx" ON "CompanyProfile"("userId");

-- CreateIndex
CREATE INDEX "Cotizacion_agencyId_idx" ON "Cotizacion"("agencyId");

-- CreateIndex
CREATE INDEX "Cotizacion_userId_idx" ON "Cotizacion"("userId");

-- CreateIndex
CREATE INDEX "DiscountCode_sellerId_idx" ON "DiscountCode"("sellerId");

-- CreateIndex
CREATE INDEX "DraftPost_aiAgentId_idx" ON "DraftPost"("aiAgentId");

-- CreateIndex
CREATE INDEX "FeedbackSurvey_userId_idx" ON "FeedbackSurvey"("userId");

-- CreateIndex
CREATE INDEX "InteractionLog_aiAgentId_idx" ON "InteractionLog"("aiAgentId");

-- CreateIndex
CREATE INDEX "InteractionLog_userId_idx" ON "InteractionLog"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeAsset_agentId_idx" ON "KnowledgeAsset"("agentId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_agencyId_idx" ON "KnowledgeDocument"("agencyId");

-- CreateIndex
CREATE INDEX "Meeting_userId_idx" ON "Meeting"("userId");

-- CreateIndex
CREATE INDEX "PackDocument_packId_idx" ON "PackDocument"("packId");

-- CreateIndex
CREATE INDEX "PerformanceReview_agencyId_idx" ON "PerformanceReview"("agencyId");

-- CreateIndex
CREATE INDEX "PerformanceReview_agentId_idx" ON "PerformanceReview"("agentId");

-- CreateIndex
CREATE INDEX "PerformanceReview_evaluatorId_idx" ON "PerformanceReview"("evaluatorId");

-- CreateIndex
CREATE INDEX "Policy_agencyId_idx" ON "Policy"("agencyId");

-- CreateIndex
CREATE INDEX "Policy_clientId_idx" ON "Policy"("clientId");

-- CreateIndex
CREATE INDEX "Policy_userId_idx" ON "Policy"("userId");

-- CreateIndex
CREATE INDEX "PollOption_pollId_idx" ON "PollOption"("pollId");

-- CreateIndex
CREATE INDEX "PollVote_optionId_idx" ON "PollVote"("optionId");

-- CreateIndex
CREATE INDEX "PollVote_agencyId_idx" ON "PollVote"("agencyId");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- CreateIndex
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");

-- CreateIndex
CREATE INDEX "Ticket_agencyId_idx" ON "Ticket"("agencyId");

-- CreateIndex
CREATE INDEX "User_agencyId_idx" ON "User"("agencyId");

-- CreateIndex
CREATE INDEX "User_reportsToId_idx" ON "User"("reportsToId");

-- CreateIndex
CREATE INDEX "examen_intentos_email_idx" ON "examen_intentos"("email");

