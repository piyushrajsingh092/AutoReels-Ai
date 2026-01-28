import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
    // 1. Security Check: Verify CRON_SECRET
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('cron_secret') || request.headers.get('authorization')?.replace('Bearer ', '');

    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = await createAdminClient();
    const now = new Date().toISOString();

    console.log(`[${now}] 🕒 Cron job started: Checking for scheduled posts...`);

    try {
        // 2. Get Scheduled Posts due now
        const { data: posts, error } = await supabase
            .from("posts")
            .select("*, video_projects(*)")
            .eq("status", "scheduled")
            .lte("scheduled_at", now)
            .limit(5); // Limit batch size for serverless safety

        if (error) throw error;
        if (!posts || posts.length === 0) {
            return NextResponse.json({ message: "No posts due" });
        }

        const results = [];

        // 3. Process Uploads
        for (const post of posts) {
            try {
                // Mark processing
                await supabase.from("posts").update({ status: 'processing' }).eq("id", post.id);

                if (post.platform === 'youtube') {
                    const { uploadToYouTube } = await import("@/lib/upload/youtube");
                    const result = await uploadToYouTube({
                        userId: post.user_id,
                        videoUrl: post.video_projects.video_url,
                        title: post.video_projects.title,
                        description: post.video_projects.caption,
                        tags: post.video_projects.hashtags ? post.video_projects.hashtags.split(',') : []
                    });

                    // Success
                    await supabase.from("posts").update({
                        status: 'posted',
                        posted_at: new Date().toISOString(),
                        platform_post_id: result.videoId,
                        platform_post_url: result.url
                    }).eq("id", post.id);

                    results.push({ id: post.id, status: 'posted' });

                } else {
                    await supabase.from("posts").update({ status: 'failed', last_error: "Platform not supported yet" }).eq("id", post.id);
                    results.push({ id: post.id, status: 'failed', reason: 'unsupported' });
                }

            } catch (err: any) {
                console.error(`❌ Upload failed for post ${post.id}:`, err);
                await supabase.from("posts").update({
                    status: 'failed',
                    last_error: err.message,
                    attempts: (post.attempts || 0) + 1
                }).eq("id", post.id);
                results.push({ id: post.id, status: 'failed', error: err.message });
            }
        }

        return NextResponse.json({ processed: results.length, results });

    } catch (error: any) {
        console.error("❌ Cron error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
