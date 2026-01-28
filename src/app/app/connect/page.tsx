"use client";

import { Youtube, Instagram, ExternalLink, CheckCircle } from "lucide-react";

export default function ConnectPage() {
    const platforms = [
        {
            name: "YouTube",
            icon: Youtube,
            color: "#ff0000",
            description: "Post your generated videos as YouTube Shorts automatically.",
            status: "Connected",
            action: "Manage"
        },
        {
            name: "Instagram",
            icon: Instagram,
            color: "#e4405f",
            description: "Schedule and auto-post Reels to your Instagram Business account.",
            status: "Not Connected",
            action: "Connect Account"
        }
    ];

    const handleConnect = (platform: string) => {
        if (platform === "YouTube") {
            alert("Redirecting to Google OAuth... (Setup required in .env)");
        } else {
            alert("Redirecting to Meta OAuth... (Setup required in .env)");
        }
    };

    return (
        <div className="flex-col gap-8 flex">
            <div>
                <h2 className="text-3xl font-bold">Connect Platforms</h2>
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>Link your social media accounts for auto-posting</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {platforms.map((p) => (
                    <div key={p.name} className="card flex-col gap-6 flex">
                        <div className="flex justify-between items-start">
                            <div className="badge flex items-center justify-center" style={{ background: `${p.color}20`, padding: '1rem', borderRadius: '1rem' }}>
                                <p.icon size={32} style={{ color: p.color }} />
                            </div>
                            {p.status === "Connected" && (
                                <div className="badge badge-emerald flex items-center gap-1">
                                    <CheckCircle size={12} />
                                    Active
                                </div>
                            )}
                        </div>

                        <div className="flex-col gap-2 flex">
                            <h3 className="text-xl font-bold">{p.name}</h3>
                            <p className="text-muted text-sm">{p.description}</p>
                        </div>

                        <button
                            onClick={() => handleConnect(p.name)}
                            className={`btn ${p.status === 'Connected' ? 'btn-outline' : 'btn-primary'} flex gap-2`}
                            style={{ width: '100%' }}
                        >
                            {p.action}
                            <ExternalLink size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                <h4 className="font-semibold text-lg" style={{ marginBottom: '0.5rem' }}>Need Help?</h4>
                <p className="text-muted text-sm">Follow our guide on how to set up Meta Business and Google Cloud for seamless integration.</p>
                <button className="btn btn-outline" style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.75rem' }}>Read Docs</button>
            </div>
        </div>
    );
}
