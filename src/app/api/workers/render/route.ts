import { NextResponse } from "next/server";
import { redis } from "@/lib/queue/redis";
import { createAdminClient } from "@/utils/supabase/server";
import { generateScript, generateMetadata } from "@/lib/ai/script-generator";

const logger = (msg: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${msg}`);
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('cron_secret') || request.headers.get('authorization')?.replace('Bearer ', '');

    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // Vercel Serverless Function pattern for background processing
    // We must return a response quickly, but we can use waitUntil() to keep the function alive
    // However, since we are in a simple route handler, we will start the async process and return immediately.
    // Note: Vercel may kill the process if it takes too long unless using Background Functions or specific config.
    // But for now, we ensure we don't timeout the HTTP request itself.

    const processJob = async () => {
        try {
            logger("🚀 Worker API Triggered");
            const supabase = await createAdminClient();

            const rawJobData = await redis.lpop('render_queue');
            if (!rawJobData) {
                logger("ℹ️ No jobs in queue");
                return;
            }

            let jobData: any;
            if (typeof rawJobData === 'string') {
                try {
                    jobData = JSON.parse(rawJobData);
                } catch (e) {
                    logger(`❌ Failed to parse jobData as string: ${rawJobData}`);
                    return;
                }
            } else {
                jobData = rawJobData;
            }

            const project_id = jobData.project_id;
            const provider = jobData.provider || 'openai';
            const isManual = jobData.is_manual || false;

            if (!project_id) throw new Error("Missing project_id in job");

            logger(`🎬 Worker started for project: ${project_id} (Manual: ${isManual}, Provider: ${provider})`);

            const { data: project, error: fetchError } = await supabase
                .from("video_projects")
                .select("*")
                .eq("id", project_id.trim())
                .single();

            if (fetchError || !project) {
                logger(`❌ Project fetch failed: ${fetchError?.message || 'Project not found'}`);
                return;
            }

            let script: any;
            let metadata: any;

            if (isManual && project.script_text) {
                logger('📝 Step 2: Using manual script...');
                try {
                    script = JSON.parse(project.script_text);
                } catch (e) {
                    script = { hook: project.script_text, body_lines: [], cta: "" };
                }

                if (!project.title || project.title.startsWith('Video:')) {
                    metadata = await generateMetadata({
                        niche: project.niche,
                        language: project.language,
                        script: script.hook,
                        provider
                    });
                } else {
                    metadata = { title: project.title, caption: project.caption, hashtags: project.hashtags };
                }
            } else {
                logger('🤖 Step 2: Generating AI script...');
                script = await generateScript({
                    niche: project.niche,
                    language: project.language,
                    duration_sec: project.duration_sec,
                    cta: true,
                    provider
                });

                logger('📝 Step 3: Generating metadata...');
                metadata = await generateMetadata({
                    niche: project.niche,
                    language: project.language,
                    script: typeof script === 'string' ? script : JSON.stringify(script),
                    provider
                });
            }

            logger('💾 Step 4: Saving script & metadata...');
            const scriptJson = typeof script === 'string' ? script : JSON.stringify(script);
            await supabase.from("video_projects").update({
                script_text: scriptJson,
                title: metadata.title,
                caption: metadata.caption,
                hashtags: metadata.hashtags
            }).eq("id", project_id);

            logger('🎥 Step 5: Rendering video...');
            const { renderVideo } = await import("@/lib/render/video-renderer");
            const videoUrl = await renderVideo({
                projectId: project_id,
                script,
                duration: project.duration_sec,
                language: project.language,
                logger: logger
            });

            logger('💾 Step 6: Updating final status...');
            await supabase.from("video_projects").update({
                status: "ready",
                video_url: videoUrl as string,
            }).eq("id", project_id);

            logger('✅ Worker completed successfully!');

        } catch (error: any) {
            const errorMsg = error.message || "Unknown error";
            logger(`❌ FATAL Worker Error: ${errorMsg}`);
        }
    };

    // Trigger processing in background (without await)
    // We pass the promise to waitUntil if available (Edge/Serverless best practice)
    // In standard node serverless, we just trigger it.

    /* @ts-ignore */
    if (typeof waitUntil === 'function') {
        /* @ts-ignore */
        waitUntil(processJob());
    } else {
        processJob();
    }

    return NextResponse.json({ status: "processing_started", message: "Job triggered in background" });
}
