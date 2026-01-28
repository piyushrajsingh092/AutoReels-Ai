"use client";

import { useState } from "react";
import { Sparkles, Video, Clock, Globe, FileText, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateVideo() {
    const [mode, setMode] = useState<"auto" | "manual">("auto");
    const [niche, setNiche] = useState("Motivation");
    const [manualScript, setManualScript] = useState("");
    const [language, setLanguage] = useState("English");
    const [duration, setDuration] = useState(30);
    const [provider, setProvider] = useState("openai");
    const [style, setStyle] = useState("text_subtitles");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const body = {
                niche: mode === "auto" ? niche : "Manual",
                language,
                duration_sec: duration,
                style,
                provider,
                script_text: mode === "manual" ? manualScript : null,
                is_manual: mode === "manual"
            };

            const res = await fetch("/api/video-projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                router.push("/app/queue");
            } else {
                const errorData = await res.json();
                console.error("API Error:", errorData);
                alert(`Error: ${errorData.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert("Network Error: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-col gap-8 flex">
            <div>
                <h2 className="text-3xl font-bold">Create New Video</h2>
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>Choose your creation mode and model</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="flex-col gap-6 flex">
                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                        <button
                            onClick={() => setMode("auto")}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === "auto" ? "bg-indigo-600 text-white shadow-lg" : "text-muted hover:text-white"}`}
                        >
                            Auto AI Script
                        </button>
                        <button
                            onClick={() => setMode("manual")}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === "manual" ? "bg-indigo-600 text-white shadow-lg" : "text-muted hover:text-white"}`}
                        >
                            Text to Video
                        </button>
                    </div>

                    <form onSubmit={handleCreate} className="card flex-col gap-6 flex">
                        {mode === "auto" ? (
                            <div className="flex-col gap-2 flex">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <Sparkles size={16} className="text-indigo-400" />
                                    Video Niche / Topic
                                </label>
                                <input
                                    className="input"
                                    placeholder="e.g. Daily Motivation, Space Facts..."
                                    value={niche}
                                    onChange={(e) => setNiche(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted">AI will generate a viral script based on this topic.</p>
                            </div>
                        ) : (
                            <div className="flex-col gap-2 flex">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <FileText size={16} className="text-indigo-400" />
                                    Your Video Script
                                </label>
                                <textarea
                                    className="input"
                                    placeholder="Enter the text you want to appear in the video..."
                                    value={manualScript}
                                    onChange={(e) => setManualScript(e.target.value)}
                                    style={{ minHeight: '120px', resize: 'vertical' }}
                                    required
                                />
                                <p className="text-xs text-muted">Provide the exact text you want to use.</p>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex-col gap-2 flex">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <Cpu size={16} className="text-indigo-400" />
                                    AI Provider
                                </label>
                                <select
                                    className="input"
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                    disabled={mode === 'manual'}
                                >
                                    <option value="openai">OpenAI (Pro)</option>
                                    <option value="groq">Groq (Fast/Free)</option>
                                    <option value="gemini">Google Gemini</option>
                                </select>
                            </div>
                            <div className="flex-col gap-2 flex">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <Video size={16} className="text-indigo-400" />
                                    Visual Style
                                </label>
                                <select
                                    className="input"
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value)}
                                >
                                    <option value="text_subtitles">Modern Subtitles</option>
                                    <option value="cinematic">Cinematic</option>
                                    <option value="minimalist">Minimalist</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex-col gap-2 flex">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <Globe size={16} className="text-indigo-400" />
                                    Language
                                </label>
                                <select
                                    className="input"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option>English</option>
                                    <option>Hindi</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                    <option>Hinglish</option>
                                </select>
                            </div>
                            <div className="flex-col gap-2 flex">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <Clock size={16} className="text-indigo-400" />
                                    Duration
                                </label>
                                <select
                                    className="input"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value))}
                                >
                                    <option value={15}>15 Seconds</option>
                                    <option value={30}>30 Seconds</option>
                                    <option value={60}>60 Seconds</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}
                        >
                            {loading ? "Working..." : mode === "auto" ? "Generate AI Video" : "Create Video from Text"}
                        </button>
                    </form>
                </div>

                <div className="card flex items-center justify-center relative overflow-hidden group" style={{ minHeight: '400px', background: 'rgba(0,0,0,0.3)', borderStyle: 'dashed' }}>
                    <div className="text-center z-10">
                        <Video size={48} className="text-muted mb-4 mx-auto group-hover:scale-110 transition-transform" />
                        <p className="text-muted">Preview will appear here after generation</p>
                    </div>
                    {/* Gradient background effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent z-0"></div>
                </div>
            </div>
        </div>
    );
}
