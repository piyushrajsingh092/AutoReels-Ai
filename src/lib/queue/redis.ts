import { Redis } from '@upstash/redis';

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function enqueueRenderJob(projectId: string, metadata: any = {}) {
    // Add to render queue with metadata (like provider, is_manual)
    await redis.rpush('render_queue', JSON.stringify({ project_id: projectId, ...metadata }));
}

export async function enqueueUploadJob(postId: string) {
    // Add to upload queue
    await redis.rpush('upload_queue', JSON.stringify({ post_id: postId }));
}
