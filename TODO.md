# Rental App Development Checklist

## Frontend (Web)
- [ ] LandingPageSite - (Arvin)
- [ X ] AuthFlow - (Ben)
- [ ] OnboardingFlow - (arv)
- [ ] AppDashboard - (Ben & arv)
- [ ] PhotoChecklistFlow - (arv)
- [ ] ContractReviewFlow - (arv)
- [ ] RepairRequestFlow - (arv)
- [ ] RentRaiseChecker - (Ben)
- [ ] FlatmateAgreementBuilder - (Ben)
- [ ] TimelineTracker - (Ben)
- [ ] DepositReturnHelper - (Ben)
<!-- - [ ] AILegalChat - (Ben) -->
- [ ] DocumentLibrary - (Ben)
- [ ] SettingsSupport - (Ben)

## Mobile App (Flutter)
- [ ] MobileLanding - (Arvin)
- [ ] MobileGuestMode - (Arvin)
- [ ] MobileAuthFlow - (Arvin)
- [ ] MobileOnboarding - (Arvin)
- [ ] MobileDashboard - (Arvin)
- [ ] ChecklistCameraFlow - (Arvin)
- [ ] MobileContractReview - (Arvin)
- [ ] MobileRepairFlow - (Arvin)
- [ ] MobileRentCheck - (Arvin)
- [ ] FlatmateToolMobile - (Arvin)
- [ ] MobileTimeline - (Arvin)
- [ ] DepositToolMobile - (Arvin)
- [ ] LegalChatMobile - (Arvin)
- [ ] DocsVaultMobile - (Arvin)
- [ ] MobileSettingsHelp - (Arvin)

## Backend (APIs / AI / DB / Logic)
- [ ] RegionSettingsService - (arv - ON THE SIGN UP FLOW) - Service that determines which regional laws apply (Scotland vs England) to handle differences in rental regulations, notice periods, and deposit protection schemes.

- [ ] ContractAnalysisEngine - (Arvin) - AI-powered system that analyzes rental contracts to extract key information like rent amount, duration, notice periods, and special clauses.

- [ X ] PhotoUploadService - (Ben - simple S3 with Supabase, use service role only to access) - Handles upload, storage and retrieval of property photos using S3 via Supabase, including condition documentation and repair evidence.
- [ ] RepairEmailGenerator - (Ben - SMTP needed, GSuite) - Creates and sends formatted repair request emails to landlords/property managers with relevant details and photo attachments via GSuite SMTP.

- [ ] TimelineSyncEngine - (Ben) - Manages important rental timeline events including lease dates, payment deadlines, inspection schedules, and maintenance visits across the platform.

<!-- - [ ] RentComparisonEngine - (Arvin) - Analyzes local rental markets to help users understand fair market rates, track rent changes, and evaluate if increases are reasonable. (after) -->

- [ ] FlatmateAgreementBuilder - (Ben) - Creates agreements between roommates covering rent splitting, utilities, responsibilities, and conflict resolution procedures.

- [ ] DepositDeadlineTracker - (Arvin) - Monitors deposit-related deadlines, protection scheme requirements, possible deductions, and provides dispute resolution guidance.

<!-- - [ ] LegalQAChatbot - (Ben - GPT wrapper, realtime Supabase DB) -->

- [ ] DocumentStorageService - (Ben) - Secure system for storing and organizing all tenant/landlord documents including leases, receipts, insurance documents, correspondence, and inspection reports.

<!-- - [ ] ReminderNotificationService - (Arvin - push notifications for iOS) - Sends timely push notifications about rent payments, lease expiration, inspections, maintenance visits, and document renewals. (not for now)-->

- [ ] AdminSupportTools - (Arvin, Ben - analytics and whatever) - Backend tools for platform administrators to monitor user activity, generate analytics, provide support, and manage system operations. 