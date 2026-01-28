import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { niche, language, duration_sec, style, provider, script_text, is_manual } = await request.json();

        // 1. Check credits
        const { data: profile } = await supabase
            .from("users_profile")
            .select("credits_remaining")
            .eq("user_id", user.id)
            .single();

        if (!profile || profile.credits_remaining < 1) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        // 2. Create Project
        const insertData: any = {
            user_id: user.id,
            niche,
            language,
            duration_sec,
            style,
            status: "rendering",
            title: is_manual ? `Video: ${niche}` : `Video about ${niche}`,
        };

        // If manual, we save the script immediately as an object compatible with the renderer
        if (is_manual && script_text) {
            insertData.script_text = JSON.stringify({
                hook: script_text,
                body_lines: [],
                cta: ""
            });
        }

        const { data: project, error } = await supabase
            .from("video_projects")
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;

        // 3. Deduct Credit
        const { error: rpcError } = await supabase.rpc('decrement_credits', { userid: user.id, count: 1 });

        if (rpcError) {
            console.log("RPC failed, using raw update fallback:", rpcError.message);
            // Fallback if RPC doesn't exist
            await supabase
                .from("users_profile")
                .update({ credits_remaining: profile.credits_remaining - 1 })
                .eq("user_id", user.id);
        }

        // 4. Enqueue Job in Redis
        const { enqueueRenderJob } = await import("@/lib/queue/redis");
        await enqueueRenderJob(project.id, { provider, is_manual });

        return NextResponse.json(project);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: projects, error } = await supabase
        .from("video_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(projects);
}
