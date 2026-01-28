import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Credits
    const { data: profile } = await supabase
        .from("users_profile")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .single();

    // 2. Post Stats
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();

    // Scheduled today
    const { count: scheduledToday } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "scheduled")
        .gte("scheduled_at", startOfDay);

    // Posted today
    const { count: postedToday } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "posted")
        .gte("posted_at", startOfDay);

    // Failed
    const { count: failed } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "failed");

    return NextResponse.json({
        scheduled: scheduledToday || 0,
        posted: postedToday || 0,
        failed: failed || 0,
        credits: profile?.credits_remaining || 0
    });
}
