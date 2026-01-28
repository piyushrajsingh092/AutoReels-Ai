"use client";

import { LayoutTemplate, Search, Filter } from "lucide-react";

export default function TemplatesPage() {
    const categories = ["All", "Motivation", "Facts", "Business", "Sports", "Nature"];

    return (
        <div className="flex-col gap-8 flex">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold">Video Templates</h2>
                    <p className="text-muted" style={{ marginTop: '0.5rem' }}>Jumpstart your creativity with proven styles</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <input className="input" placeholder="Search templates..." style={{ paddingLeft: '2.5rem', width: '250px' }} />
                        <Search size={18} className="text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                    <button className="btn btn-outline flex gap-2"><Filter size={18} /> Filters</button>
                </div>
            </div>

            <div className="flex gap-2" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {categories.map(cat => (
                    <button key={cat} className={`btn ${cat === 'All' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="card overflow-hidden" style={{ padding: 0 }}>
                        <div style={{ height: '200px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                            <LayoutTemplate size={48} className="text-muted" />
                        </div>
                        <div style={{ padding: '1.25rem' }}>
                            <h3 className="font-bold">Modern Subtitles #{i}</h3>
                            <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>High-energy captions with dynamic backgrounds</p>
                            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.875rem' }}>Use Template</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
