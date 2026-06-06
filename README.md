# FuelTrack

FuelTrack is a modern nutrition tracking app focused on calorie tracking, macros, micronutrients, hydration, body weight, analytics, and consistency habits. It is intentionally not a workout tracker.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS with shadcn-style primitives
- Supabase Auth, Postgres, Storage-ready schema, RLS, and Realtime
- TanStack Query
- Recharts
- PWA manifest and service worker
- Vercel-ready deployment

## Product Decisions

FuelTrack prioritizes fast daily logging over complex diary management. The data model supports four search layers:

1. User custom foods and recipes
2. User saved, favorite, recent, and frequently logged foods
3. Cached external food data from USDA FoodData Central and Open Food Facts
4. Curated global seed foods with strong Indian food support

This approach keeps searches fast, lowers API costs, and lets homemade foods like dal, chicken curry, paneer bhurji, and family recipes become first-class nutrition records.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set the environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Without real Supabase values, the app runs with seeded demo data and does not enforce route protection. With real values, `/app/*` routes are protected by middleware.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_fueltrack_schema.sql` in the SQL editor or with Supabase CLI.
3. Enable Email auth and Google auth in Supabase Auth providers.
4. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-vercel-domain.vercel.app/auth/callback`
5. Confirm Realtime is enabled for `food_entries`, `water_logs`, `weight_logs`, and `goals`.

The migration creates:

- `profiles`
- `goals`
- `nutrient_targets`
- `foods`
- `saved_foods`
- `food_entries`
- `water_logs`
- `weight_logs`
- `achievements`
- `user_achievements`
- `streaks`
- `food_search_cache`

It also adds indexes, foreign keys, RLS policies, default user provisioning, and Realtime publication entries.
It creates a public `fueltrack-media` Storage bucket with user-folder scoped upload, update, and delete policies.

## Vercel Deployment

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Add the same Supabase environment variables.
4. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
5. Deploy.

## PWA

FuelTrack includes:

- `public/manifest.webmanifest`
- `public/icon.svg`
- `public/sw.js`
- Production-only service worker registration
- Offline fallback to the dashboard shell

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```
