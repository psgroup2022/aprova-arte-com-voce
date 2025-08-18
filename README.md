# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/44272730-8708-4b09-ba3f-4ab3f8e5196a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/44272730-8708-4b09-ba3f-4ab3f8e5196a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Environment Variables

Create a `.env` file (copy from `.env.example`). Required for local dev & CI:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
```

Do NOT expose the service role key in the frontend (never prefix with `VITE_`). Use it only in server-side automation (GitHub Action self‑hosted runner or Supabase CLI locally).

## CI Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push / PR:

1. Lint (eslint)
2. Typecheck (tsc noEmit)
3. Test matrix (Node 18 & 20)
4. Coverage (Node 20) – uploads `coverage/` artifact
5. Build – uploads production `dist/` artifact

Add the following repository secrets so the build & tests using Supabase client can initialize:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Artifacts retain for 7 days.

## Scripts

Useful npm scripts:

| Script        | Purpose                           |
| ------------- | --------------------------------- |
| dev           | Start Vite dev server (port 8080) |
| build         | Production build                  |
| lint          | ESLint over `src`                 |
| typecheck     | Strict TypeScript check           |
| test          | Vitest run (no watch)             |
| test:watch    | Vitest watch mode                 |
| test:coverage | Vitest with coverage report       |

Coverage output stored in `coverage/` (lcov + summary). You can view HTML report by opening `coverage/index.html` after running `npm run test:coverage` locally.

## Security Notes

Keep the Supabase service role key only in secure backend contexts. RLS policies enforce row ownership; ensure they stay enabled when adding new tables.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/44272730-8708-4b09-ba3f-4ab3f8e5196a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
