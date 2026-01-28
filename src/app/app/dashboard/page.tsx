"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Calendar, CheckCircle, XCircle, Clock, Play, RefreshCw } from "lucide-react";

export default function DashboardPage() {
    const [stats, setStats] = useState({
        scheduled: 0,
        posted: 0,
        failed: 0,
        credits: 30
    });
    const [recentProjects, setRecentProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Fetch stats
                const { data: profile } = await supabase
                    .from("users_profile")
                    .select("credits_remaining")
                    .eq("user_id", user.id)
                    .single();

                if (profile) {
                    setStats(prev => ({ ...prev, credits: profile.credits_remaining }));
                }

                // Fetch recent projects
                const res = await fetch("/api/video-projects");
                const data = await res.json();
                if (Array.isArray(data)) {
                    setRecentProjects(data.slice(0, 5));

                    // Basic stats calculation for now
                    const failed = data.filter((p: any) => p.status === 'error').length;
                    setStats(prev => ({ ...prev, failed }));
                }
            }
            setLoading(false);
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="flex-col gap-8 flex">
            <div>
                <h2 className="text-3xl font-bold">Dashboard</h2>
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>Overview of your AutoReels activity</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6">
                <StatsCard
                    title="Scheduled Today"
                    value={stats.scheduled}
                    icon={Calendar}
                    badgeClass="badge-indigo"
                />
                <StatsCard
                    title="Posted Today"
                    value={stats.posted}
                    icon={CheckCircle}
                    badgeClass="badge-emerald"
                />
                <StatsCard
                    title="Failed Tasks"
                    value={stats.failed}
                    icon={XCircle}
                    badgeClass="badge-red"
                />
                <StatsCard
                    title="Credits Left"
                    value={stats.credits}
                    icon={Clock}
                    badgeClass="badge-amber"
                />
            </div>

            {/* Recent Posts */}
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                    <a href="/app/queue" className="text-sm font-medium text-primary hover:underline" style={{ color: 'var(--primary)' }}>View All</a>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <RefreshCw className="animate-spin text-muted" size={32} />
                    </div>
                ) : recentProjects.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {recentProjects.map((project) => (
                            <div key={project.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                                        <Play size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Video about {project.niche}</p>
                                        <p className="text-xs text-muted">Created {new Date(project.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <StatusBadge status={project.status} />
                                    {project.video_url && (
                                        <a href={project.video_url} target="_blank" className="btn btn-sm btn-outline">Preview</a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 0', background: 'rgba(0,0,0,0.2)', borderRadius: '0.75rem', border: '1px dashed var(--border)' }}>
                        <p className="text-muted">No posts yet. Create your first video to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'ready':
            return <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Ready</span>;
        case 'rendering':
            return <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse">Rendering</span>;
        case 'error':
            return <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Failed</span>;
        default:
            return <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Queued</span>;
    }
}

function StatsCard({ title, value, icon: Icon, badgeClass }: any) {
    return (
        <div className="card stats-card">
            <div>
                <p className="text-sm font-medium text-muted">{title}</p>
                <p className="text-3xl font-bold" style={{ marginTop: '0.5rem' }}>{value}</p>
            </div>
            <div className={`badge ${badgeClass}`} style={{ padding: '0.75rem' }}>
                <Icon size={24} />
            </div>
        </div>
    );
}
