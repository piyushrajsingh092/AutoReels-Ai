# AutoReels AI - Setup Checklist

## ⚠️ Before You Can Create Videos

The error you're seeing is most likely because the **Supabase database tables haven't been created yet**. Follow these steps:

### 1. Create Supabase Database Tables

1. Open your Supabase project: https://vyfwiojipjhchzsrfukl.supabase.co
2. Go to **SQL Editor** (left sidebar)
3. Copy the entire contents from `supabase_schema.sql` artifact
4. Paste into the SQL Editor and click **Run**

This will create:
- `users_profile` table (for credits tracking)
- `video_projects` table (for your AI videos)
- `posts` table (for scheduling)
- `usage_logs` table (for analytics)
- RLS (Row Level Security) policies

### 2. Create Storage Buckets

1. Go to **Storage** in Supabase
2. Create two public buckets:
   - `videos`
   - `thumbnails`

### 3. Test the Fix

After running the SQL schema:

1. **Refresh the Create page** in your browser
2. Try creating a video again
3. The new error message will now show the *specific* error (if any)

### 4. Verify Your User Has a Profile

After signup, you should have a `users_profile` row. If not:

```sql
-- Run this in Supabase SQL Editor (replace with your user ID)
INSERT INTO users_profile (user_id, credits_remaining, plan)
VALUES ('YOUR_USER_ID_HERE', 50, 'free');
```

To find your user ID:
```sql
SELECT id, email FROM auth.users;
```

## 🔍 Debugging Steps

If you still get errors after setup:

1. **Check Browser Console** (F12) for detailed error logs
2. **Check Supabase Logs** in your dashboard
3. **Verify Redis** connection at https://above-skink-18454.upstash.io

## ✅ Ready to Test

Once the database is set up, you should be able to:
- ✅ Create video projects
- ✅ See them in the Queue
- ✅ Track credits in the sidebar
