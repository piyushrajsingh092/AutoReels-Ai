import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { video_project_id, platform, scheduled_at } = await request.json();

        // 1. Check if platform connected
        const { data: account } = await supabase
            .from("accounts")
            .select("id")
            .eq("user_id", user.id)
            .eq("platform", platform)
            .eq("status", "connected")
            .single();

        if (!account) {
            return NextResponse.json({ error: `${platform} not connected` }, { status: 400 });
        }

        // 2. Create Post
        const { data: post, error } = await supabase
            .from("posts")
            .insert({
                user_id: user.id,
                video_project_id,
                platform,
                scheduled_at,
                status: 'scheduled'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(post);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
