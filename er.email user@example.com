warning: in the working copy of 'src/app/recommender/page.tsx', LF will be replaced by CRLF the next time Git touches it
M	.vercel.json
M	next.config.js
M	package.json
M	src/app/admin/page.tsx
M	src/app/api/cards/details/route.ts
M	src/app/api/cards/search/route.ts
M	src/app/auth/login/page.tsx
M	src/app/auth/reset-password/page.tsx
M	src/app/auth/signup/page.tsx
M	src/app/auth/verify-email/page.tsx
M	src/app/cards/page.tsx
M	src/app/consultation/page.tsx
M	src/app/layout.tsx
M	src/app/profile/page.tsx
M	src/app/recommender/page.tsx
M	src/app/review/[cardId]/page.tsx
M	src/app/review/page.tsx
M	src/components/AdminCardManager.js
M	src/components/AdminLayout.tsx
M	src/components/CardDisplay.tsx
M	src/components/ErrorBoundary.tsx
M	src/components/FeatureTable.tsx
M	src/components/ImprovementsButton.tsx
M	src/components/Navigation.tsx
M	src/components/Pagination.tsx
M	src/components/Providers.tsx
M	src/components/RecommenderNav.tsx
M	src/components/auth/AuthErrorBoundary.tsx
M	src/components/auth/EmailVerificationBanner.tsx
D	src/components/auth/authService.js
M	src/contexts/AuthContext.tsx
M	src/hooks/useCards.ts
M	src/lib/contexts/FirebaseContext.tsx
M	src/types/cards.ts
M	src/utils/auth/authService.js
M	src/utils/auth/authService.ts
M	src/utils/monitoring/simpleMonitor.ts
