import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { createAdminClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

let actualFfmpegPath = ffmpegPath;
if (actualFfmpegPath && actualFfmpegPath.startsWith('\\ROOT')) {
    actualFfmpegPath = path.join(process.cwd(), actualFfmpegPath.replace('\\ROOT', ''));
}
// Also handle cases where it might be relative or missing drive letter
if (actualFfmpegPath && !actualFfmpegPath.includes(':') && !actualFfmpegPath.startsWith('\\\\')) {
    actualFfmpegPath = path.join(process.cwd(), actualFfmpegPath);
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

    // Placeholder background
    const bgVideoPath = path.join(process.cwd(), 'public', 'assets', 'broll', 'default.mp4');
    const input = fs.existsSync(bgVideoPath) ? bgVideoPath : 'color=c=black:s=1080x1920:d=' + duration;
    const isGeneratedBg = !fs.existsSync(bgVideoPath);

    logger(`🎥 Using background: ${isGeneratedBg ? 'Generated (lavfi)' : 'Asset'}`);

    // Try to find a font on Windows, fallback to default
    const fontCandidates = [
        path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf'),
        'C:/Windows/Fonts/arial.ttf',
        'Arial'
    ];
    let selectedFont = '';
    for (const font of fontCandidates) {
        if (fs.existsSync(font) || font === 'Arial') {
            selectedFont = font;
            break;
        }
    }
    logger('🔤 Selected Font: ' + selectedFont);

    return new Promise((resolve, reject) => {
        let command = ffmpeg();

        if (isGeneratedBg) {
            command.input(input).inputOptions(['-f', 'lavfi']);
        } else {
            command.input(input);
            command.inputOptions(['-stream_loop', '-1']);
        }

        // Complex filter to draw text
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

