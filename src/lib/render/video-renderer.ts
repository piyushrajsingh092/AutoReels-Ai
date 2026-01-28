import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { createAdminClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

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

// Initialize OpenAI for TTS
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Function to format time for SRT (00:00:00,000)
function formatSrtTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

// Helper to generate SRT content from script
// In a real app, timing would be matched to audio. 
// For now we distribute lines evenly across the duration.
function generateSrt(script: { hook: string; body_lines: string[]; cta: string }, totalDuration: number): string {
    let srt = '';
    const allLines = [script.hook, ...script.body_lines, script.cta].filter(l => l && l.trim());
    const lineDuration = totalDuration / allLines.length;

    allLines.forEach((line, i) => {
        const start = i * lineDuration;
        const end = (i + 1) * lineDuration;
        srt += `${i + 1}\n`;
        srt += `${formatSrtTime(start)} --> ${formatSrtTime(end)}\n`;
        srt += `${line}\n\n`;
    });

    return srt;
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
    logger('🎬 Starting full video render for project: ' + projectId);

    if (!actualFfmpegPath || !fs.existsSync(actualFfmpegPath)) {
        logger('❌ FFmpeg binary not found');
        throw new Error('FFmpeg binary not found');
    }

    const supabase = await createAdminClient();
    const isVercel = process.env.VERCEL === '1';
    const tempDir = isVercel ? '/tmp' : path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const outputFileName = `${uuidv4()}.mp4`;
    const outputPath = path.join(tempDir, outputFileName);
    const srtPath = path.join(tempDir, `${uuidv4()}.srt`);
    const audioPath = path.join(tempDir, `${uuidv4()}.mp3`);

    // 1. GENERATE VOICEOVER (TTS)
    logger('🎙️ Generating voiceover with OpenAI TTS...');
    const fullText = [script.hook, ...script.body_lines, script.cta].filter(l => l && l.trim()).join(' ');

    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy", // alloy, echo, fable, onyx, nova, shimmer
            input: fullText,
        });
        const buffer = Buffer.from(await mp3.arrayBuffer());
        fs.writeFileSync(audioPath, buffer);
        logger('✅ Voiceover saved at ' + audioPath);
    } catch (err: any) {
        logger('❌ TTS Error: ' + err.message);
        throw err;
    }

    // 2. GENERATE SUBTITLES
    const srtContent = generateSrt(script, duration);
    fs.writeFileSync(srtPath, srtContent);
    logger('📝 Subtitles generated at ' + srtPath);

    // 3. DETERMINE BACKGROUND
    const bgVideoPath = path.join(process.cwd(), 'public', 'assets', 'broll', 'default.mp4');
    const bgImagePath = path.join(process.cwd(), 'public', 'assets', 'broll', 'default.png');

    let inputSource = "";
    let isImage = false;

    if (fs.existsSync(bgVideoPath)) {
        inputSource = bgVideoPath;
        isImage = false;
    } else if (fs.existsSync(bgImagePath)) {
        inputSource = bgImagePath;
        isImage = true;
    }

    if (!inputSource) {
        logger('❌ Background asset missing. Ensure public/assets/broll/default.png exists.');
        throw new Error('Background asset missing');
    }

    // 4. FFmpeg MERGE
    return new Promise((resolve, reject) => {
        let command = ffmpeg();

        // Input 0: Background
        if (isImage) {
            command.input(inputSource).inputOptions(['-loop', '1']);
        } else {
            command.input(inputSource).inputOptions(['-stream_loop', '-1']);
        }

        // Input 1: Audio
        command.input(audioPath);

        const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
        const filterStr = [
            'scale=1080:1920:force_original_aspect_ratio=increase',
            'crop=1080:1920',
            'setsar=1',
            `subtitles='${escapedSrtPath}':force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Alignment=2,MarginV=50'`
        ].join(',');

        logger('🛠 Merging background, audio, and subtitles...');

        command
            .videoFilter(filterStr)
            .outputOptions([
                '-t', duration.toString(),
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-pix_fmt', 'yuv420p',
                '-c:a', 'aac',
                '-map', '0:v:0',
                '-map', '1:a:0',
                '-shortest',
                '-movflags', '+faststart'
            ])
            .output(outputPath)
            .on('start', (cmdLine) => logger('🚀 FFmpeg started: ' + cmdLine))
            .on('end', async () => {
                try {
                    logger('✅ Full render finished. Uploading...');
                    const fileBuffer = fs.readFileSync(outputPath);
                    const { data, error } = await supabase.storage
                        .from('videos')
                        .upload(`${projectId}/${outputFileName}`, fileBuffer, {
                            contentType: 'video/mp4',
                            upsert: true
                        });

                    if (error) throw error;

                    const { data: { publicUrl } } = supabase.storage
                        .from('videos')
                        .getPublicUrl(`${projectId}/${outputFileName}`);

                    // Cleanup
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    if (fs.existsSync(srtPath)) fs.unlinkSync(srtPath);
                    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

                    logger('🔗 Final Video URL: ' + publicUrl);
                    resolve(publicUrl);
                } catch (e: any) {
                    logger('❌ Upload failed: ' + e.message);
                    reject(e);
                }
            })
            .on('error', (err, stdout, stderr) => {
                logger('❌ FFmpeg Error: ' + err.message);
                logger('STDOUT: ' + stdout);
                logger('STDERR: ' + stderr);
                reject(err);
            })
            .run();
    });
}
