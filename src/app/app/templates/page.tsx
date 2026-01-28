import { LayoutTemplate, Search, Filter, Sparkles, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TemplatesPage() {
    const router = useRouter();
    const categories = ["All", "Motivation", "Facts", "Business", "Sports", "Nature"];

    const templates = [
        { id: 1, name: "Viral Motivation", niche: "Motivation", desc: "High-energy captions with cinematic overlays", color: "from-blue-600 to-indigo-700" },
        { id: 2, name: "Daily Facts", niche: "Facts", desc: "Clean, educational layout with bold headers", color: "from-amber-500 to-orange-600" },
        { id: 3, name: "Business Growth", niche: "Business", desc: "Professional typography for corporate tips", color: "from-emerald-600 to-teal-700" },
        { id: 4, name: "Sports Recap", niche: "Sports", desc: "Fast-paced motion styles for highlights", color: "from-red-600 to-rose-700" },
        { id: 5, name: "Nature Wonders", niche: "Nature", desc: "Serene, minimalist captions for travel vlogs", color: "from-green-600 to-lime-600" },
        { id: 6, name: "AI Tech News", niche: "Technology", desc: "Futuristic glow effects and neon text", color: "from-purple-600 to-fuchsia-700" },
    ];

    const handleUseTemplate = (niche: string) => {
        router.push(`/app/create?niche=${encodeURIComponent(niche)}`);
    };

    return (
        <div className="flex-col gap-8 flex animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <Sparkles size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Premade Layouts</span>
                    </div>
                    <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Video Templates</h2>
                    <p className="text-muted text-lg mt-2">Jumpstart your viral journey with proven styles</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <input className="input w-full md:w-[280px]" placeholder="Search templates..." style={{ paddingLeft: '2.5rem' }} />
                        <Search size={18} className="text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                    <button className="btn btn-outline flex gap-2"><Filter size={18} /> Filters</button>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {categories.map(cat => (
                    <button key={cat} className={`btn whitespace-nowrap px-6 py-2 rounded-full transition-all ${cat === 'All' ? 'btn-primary' : 'bg-white/5 hover:bg-white/10 border-transparent text-gray-400'}`}>
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map(tmp => (
                    <div key={tmp.id} className="group relative card overflow-hidden p-0 border border-white/5 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
                        <div className={`h-[220px] bg-gradient-to-br ${tmp.color} relative flex items-center justify-center overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                            <LayoutTemplate size={64} className="text-white/30 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <button className="btn btn-primary w-full flex gap-2"><Play size={16} fill="currentColor" /> Preview Style</button>
                            </div>
                        </div>
                        <div className="p-6 bg-black/40 backdrop-blur-xl">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{tmp.name}</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/70 uppercase tracking-tighter capitalize">{tmp.niche}</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed mb-6">{tmp.desc}</p>
                            <button
                                onClick={() => handleUseTemplate(tmp.niche)}
                                className="w-full py-4 rounded-xl bg-white text-black font-black hover:bg-primary hover:text-white transition-all transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                USE THIS TEMPLATE
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
