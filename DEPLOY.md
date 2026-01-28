# 🚀 Deployment Guide (Vercel)

Your Autoreels AI app is now ready for production. Follow these steps to deploy and automate everything.

## 1. Supabase Preparation
Ensure you have run the `setup_user_profile.sql` in your Supabase SQL Editor. 
Also, verify that you have a `videos` bucket created (the app will try to create it automatically if your Service Role key allows it).

## 2. Environment Variables
When deploying to Vercel, add the following environment variables in the **Vercel Dashboard** (Settings > Environment Variables):

| Variable | Source |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings (keep secret!) |
| `UPSTASH_REDIS_REST_URL` | Upstash Console |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console |
| `OPENAI_API_KEY` | OpenAI Settings |
| `CRON_SECRET` | Create a random string (e.g., `autoreels_super_secret_12345`) |

## 3. Deployment Steps
1. Push your code to GitHub/GitLab/Bitbucket.
2. Connect the repository to Vercel.
3. During the build, Vercel will automatically detect the settings.
4. Once deployed, the Crons defined in `vercel.json` will start running automatically.

## 4. Automation Details
The following processes are now fully automated:

### 🎬 Video Rendering Worker
- **Endpoint**: `/api/workers/render`
- **Schedule**: Every minute (`* * * * *`)
- **Action**: Picks up the latest project from the queue, generates AI content, renders the video using FFmpeg, and uploads it to Supabase.
- **Security**: Protected by your `CRON_SECRET`.

### 🕒 Scheduled Posting
- **Endpoint**: `/api/cron`
- **Schedule**: Every 15 minutes (`*/15 * * * *`)
- **Action**: Checks for posts scheduled to go live and uploads them to YouTube (if configured).
- **Security**: Protected by your `CRON_SECRET`.

## 5. Local Testing
To test the automation locally:
1. Run `npm run dev`.
2. Open `http://localhost:3000/api/workers/render?cron_secret=YOUR_SECRET` in your browser.
3. Check the terminal logs to see the worker pick up and process a project.

---
**Done!** Your app is now a fully automated AI video factory.
