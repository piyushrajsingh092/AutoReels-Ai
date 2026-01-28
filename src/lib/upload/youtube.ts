import { google } from 'googleapis';
import { createAdminClient } from '@/utils/supabase/server';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_APP_URL + "/api/auth/callback/google"
);

export async function uploadToYouTube({
    userId,
    videoUrl,
    title,
    description,
    tags
}: {
    userId: string;
    videoUrl: string;
    title: string;
    description: string;
    tags: string[];
}) {
    const supabase = await createAdminClient();

    // 1. Get Tokens
    const { data: account } = await supabase
        .from('accounts')
        .select('access_token, refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'youtube')
        .single();

    if (!account) throw new Error("YouTube not connected");

    oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
    });

    // 2. Download Video Stream
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    // 3. Upload
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const res = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: title.substring(0, 100), // Max 100 chars
                description: description + "\n\n#shorts",
                tags: tags,
            },
            status: {
                privacyStatus: 'public',
                selfDeclaredMadeForKids: false,
            },
        },
        media: {
            body: require('stream').Readable.from(buffer),
        },
    });

    return {
        videoId: res.data.id,
        url: `https://youtube.com/shorts/${res.data.id}`
    };
}
