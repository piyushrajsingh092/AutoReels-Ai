"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { RefreshCw, Play, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function QueuePage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/video-projects");
            const data = await res.json();
            if (Array.isArray(data)) {
                setProjects(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return (
        <div className="flex-col gap-8 flex">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold">Project Queue</h2>
                    <p className="text-muted" style={{ marginTop: '0.5rem' }}>Monitor your AI video generations</p>
                </div>
                <button
                    onClick={fetchProjects}
                    className="btn btn-outline flex gap-2"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <RefreshCw className="animate-spin text-primary" size={48} />
                    <p className="text-muted">Loading your projects...</p>
                </div>
            ) : projects.length > 0 ? (
                <div className="video-grid">
                    {projects.map((project) => (
                        <div key={project.id} className="card video-card">
                            <div className="video-preview-container">
                                {project.video_url ? (
                                    <video
                                        src={project.video_url}
                                        controls={false}
                                        onMouseOver={(e) => e.currentTarget.play()}
                                        onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                        muted
                                        poster="/assets/video-placeholder.png"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-muted">
                                        {project.status === 'error' ? <AlertCircle size={48} className="text-red-400" /> : <Clock size={48} className="animate-pulse" />}
                                        <span className="text-sm font-medium">
                                            {project.status === 'error'
                                                ? 'Failed'
                                                : project.progress
                                                    ? `Processing ${project.progress}%`
                                                    : 'Processing...'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="video-info">
                                <div className="flex justify-between items-start">
                                    <StatusBadge status={project.status} />
                                    <span className="text-xs text-muted">{new Date(project.created_at).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-bold text-lg leading-tight">Video about {project.niche}</h4>
                                <p className="text-xs text-muted">{project.duration_sec}s • {project.language}</p>

                                <div className="video-actions">
                                    {project.video_url && (
                                        <a href={project.video_url} target="_blank" className="btn btn-primary btn-sm flex-1">
                                            Download
                                        </a>
                                    )}
                                    <button className="btn btn-outline btn-sm">
                                        Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card flex flex-col items-center justify-center py-24 gap-4" style={{ textAlign: 'center' }}>
                    <div className="p-4 bg-white/5 rounded-full">
                        <Play size={48} className="text-muted" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">No projects yet</h3>
                        <p className="text-muted mt-2">Create your first AI video to see it here!</p>
                    </div>
                    <a href="/app/create" className="btn btn-primary mt-4">Create Video</a>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'ready':
            return <span className="badge badge-emerald flex items-center gap-1" style={{ width: 'fit-content' }}><CheckCircle size={12} /> Ready</span>;
        case 'rendering':
            return <span className="badge badge-indigo flex items-center gap-1 anim-pulse" style={{ width: 'fit-content' }}><RefreshCw size={12} /> Rendering</span>;
        case 'error':
            return <span className="badge badge-red flex items-center gap-1" style={{ width: 'fit-content' }}><AlertCircle size={12} /> Failed</span>;
        default:
            return <span className="badge badge-amber flex items-center gap-1" style={{ width: 'fit-content' }}><Clock size={12} /> Queued</span>;
    }
}
