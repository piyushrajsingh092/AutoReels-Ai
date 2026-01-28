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

    // BACKGROUND LOGIC: Use an image if default video is missing
    const bgVideoPath = path.join(process.cwd(), 'public', 'assets', 'broll', 'default.mp4');
    let inputSource = bgVideoPath;
    let isImage = false;
    let useColorFallback = false;

    if (!fs.existsSync(bgVideoPath)) {
        // Try fallback image
        const bgImagePath = path.join(process.cwd(), 'public', 'assets', 'broll', 'default.jpg');
        if (fs.existsSync(bgImagePath)) {
            inputSource = bgImagePath;
            isImage = true;
        } else {
            // Last resort: color filter
            useColorFallback = true;
        }
    }

    logger(`🎥 Using background: ${useColorFallback ? 'Color' : isImage ? 'Image' : 'Asset'}`);

    // Try to find a font
    const fontCandidates = [
        path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf'),
        'C:/Windows/Fonts/arial.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        'Arial'
    ];
    let selectedFont = '';
    for (const font of fontCandidates) {
        if (font.includes('/') || font.includes('\\')) {
            if (fs.existsSync(font)) {
                selectedFont = font;
                break;
            }
        } else {
            selectedFont = font;
            break;
        }
    }
    logger('🔤 Selected Font: ' + selectedFont);

    return new Promise((resolve, reject) => {
        let command = ffmpeg();

        if (useColorFallback) {
            // Use simple solid color without lavfi if possible, 
            // but since we need duration, let's use a 1-pixel transparent image looped
            // Actually, we'll try a different approach: check if we can just use a simple image
            command.input('color=c=black:s=1080x1920').inputOptions(['-f', 'lavfi', '-t', duration.toString()]);
        } else if (isImage) {
            command.input(inputSource).inputOptions(['-loop', '1']);
        } else {
            command.input(inputSource).inputOptions(['-stream_loop', '-1']);
        }

        const escapedHook = escapeFFmpegText(script.hook);
        const fontArg = selectedFont ? `:fontfile='${selectedFont.replace(/\\/g, '/')}'` : '';

        // Final filter: scale, crop to 9:16, draw text
        let filters = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v0];`;
        filters += `[v0]drawtext=text='${escapedHook}':fontsize=70:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.6:boxborderw=20${fontArg}[out]`;

        logger('🛠 Applying FFmpeg filters...');

        command
            .complexFilter(filters)
            .outputOptions(['-map [out]', '-t', duration.toString()])
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
