import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { createAdminClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

// Fixed FFmpeg path for Vercel Serverless
let actualFfmpegPath: string | null = ffmpegPath;

if (process.env.VERCEL === '1') {
    const possiblePaths = [
        ffmpegPath,
        path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg'),
        '/var/task/node_modules/ffmpeg-static/ffmpeg',
        '/opt/bin/ffmpeg'
    ];

    for (const p of possiblePaths) {
        if (p && fs.existsSync(p)) {
            actualFfmpegPath = p;
            break;
        }
    }
} else {
    // Local Windows/MacOS logic
    if (actualFfmpegPath && actualFfmpegPath.startsWith('\\ROOT')) {
        actualFfmpegPath = path.join(process.cwd(), actualFfmpegPath.replace('\\ROOT', ''));
    }
    if (actualFfmpegPath && !actualFfmpegPath.includes(':') && !actualFfmpegPath.startsWith('\\\\')) {
        actualFfmpegPath = path.join(process.cwd(), actualFfmpegPath);
    }
}

if (actualFfmpegPath) {
    ffmpeg.setFfmpegPath(actualFfmpegPath);
}

// Helper to escape text for FFmpeg drawtext
function escapeFFmpegText(text: string) {
    return text
        .replace(/\\/g, '\\\\\\\\')
        .replace(/'/g, "'\\''")
        .replace(/:/g, '\\:')
}

export async function renderVideo({
    projectId,
    script,
    duration,
    logger = (msg: string) => console.log(msg)
}: {
    projectId: string;
    script: { hook: string; body_lines: string[]; cta: string };
    duration: number;
    logger?: (msg: string) => void;
}) {
    logger('🎬 Starting video render for project: ' + projectId);
    logger('🔧 FFmpeg path being used: ' + actualFfmpegPath);

    if (!actualFfmpegPath || !fs.existsSync(actualFfmpegPath)) {
        logger('❌ FFmpeg binary not found at ' + actualFfmpegPath);
        throw new Error('FFmpeg binary not found');
    }

    const supabase = await createAdminClient();

    // Ensure bucket exists
    try {
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.find(b => b.id === 'videos')) {
            console.log('📦 Creating "videos" bucket...');
            await supabase.storage.createBucket('videos', { public: true });
        }
    } catch (e) {
        console.warn('⚠️ Bucket check failed (might already exist):', e);
    }

    const isVercel = process.env.VERCEL === '1';
    const tempDir = isVercel ? '/tmp' : path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const outputFileName = `${uuidv4()}.mp4`;
    const outputPath = path.join(tempDir, outputFileName);

    // BACKGROUND LOGIC: Check for video or image assets
    const bgVideoPath = path.join(process.cwd(), 'public', 'assets', 'broll', 'default.mp4');
    const bgImagePath = path.join(process.cwd(), 'public', 'assets', 'broll', 'default.png');
    const bgJpgPath = path.join(process.cwd(), 'public', 'assets', 'broll', 'default.jpg');

    let inputSource = "";
    let isImage = false;

    if (fs.existsSync(bgVideoPath)) {
        inputSource = bgVideoPath;
        isImage = false;
    } else if (fs.existsSync(bgImagePath)) {
        inputSource = bgImagePath;
        isImage = true;
    } else if (fs.existsSync(bgJpgPath)) {
        inputSource = bgJpgPath;
        isImage = true;
    }

    if (!inputSource) {
        logger('❌ No background asset found. Please ensure public/assets/broll/default.png exists.');
        throw new Error('Background asset missing');
    }

    logger(`🎥 Using background: ${isImage ? 'Image' : 'Video'} (${path.basename(inputSource)})`);

    return new Promise((resolve, reject) => {
        let command = ffmpeg();

        if (isImage) {
            command.input(inputSource).inputOptions(['-loop', '1']);
        } else {
            command.input(inputSource).inputOptions(['-stream_loop', '-1']);
        }

        const escapedText = escapeFFmpegText(script.hook);

        // Vercel FFmpeg is VERY limited. 
        // Code 8 "Filter not found" often refers to drawtext itself if the binary was compiled without it.
        // Let's try the absolute simplest possible scale/crop filter first.

        logger('🛠 Applying ULTIMATE SAFE filters...');

        // If drawtext keeps failing, it means the ffmpeg-static binary on Vercel was compiled WITHOUT drawtext support.
        // We will try one more time with a very clean filter chain.
        const videoFilters = [
            'scale=1080:1920:force_original_aspect_ratio=increase',
            'crop=1080:1920',
            'setsar=1',
            `drawtext=text='${escapedText}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.5`
        ].join(',');

        command
            .videoFilter(videoFilters)
            .outputOptions([
                '-t', duration.toString(),
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-pix_fmt', 'yuv420p',
                '-movflags', '+faststart'
            ])
            .output(outputPath)
            .on('start', (cmdLine) => logger('🚀 FFmpeg started: ' + cmdLine))
            .on('end', async () => {
                try {
                    logger('✅ FFmpeg finished rendering. Uploading...');
                    const fileBuffer = fs.readFileSync(outputPath);
                    const { data, error } = await supabase.storage
                        .from('videos')
                        .upload(`${projectId}/${outputFileName}`, fileBuffer, {
                            contentType: 'video/mp4',
                            upsert: true
                        });

                    if (error) {
                        logger('❌ Supabase Upload Error: ' + error.message);
                        throw error;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('videos')
                        .getPublicUrl(`${projectId}/${outputFileName}`);

                    logger('🔗 Public URL generated: ' + publicUrl);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    resolve(publicUrl);
                } catch (e: any) {
                    logger('❌ Error in post-render step: ' + e.message);
                    reject(e);
                }
            })
            .on('error', (err, stdout, stderr) => {
                logger('❌ FFmpeg Error: ' + err.message);
                logger('FFmpeg STDOUT: ' + stdout);
                logger('FFmpeg STDERR: ' + stderr);
                reject(err);
            })
            .run();
    });
}
