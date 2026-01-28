"use client";

import { User, Bell, Shield, Palette, Save } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="flex-col gap-8 flex">
            <div>
                <h2 className="text-3xl font-bold">Settings</h2>
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>Configure your account and preferences</p>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
                <aside className="flex-col gap-2 flex">
                    <button className="btn btn-primary" style={{ justifyContent: 'flex-start' }}><User size={18} /> Profile</button>
                    <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}><Bell size={18} /> Notifications</button>
                    <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}><Shield size={18} /> Security</button>
                    <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}><Palette size={18} /> Appearance</button>
                </aside>

                <div className="lg:col-span-3 card flex-col gap-8 flex">
                    <div className="flex-col gap-6 flex">
                        <h3 className="text-xl font-bold border-b border-border" style={{ paddingBottom: '1rem' }}>Profile Information</h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex-col gap-2 flex">
                                <label className="text-sm font-semibold text-muted">Full Name</label>
                                <input className="input" defaultValue="Piyush Kumar" />
                            </div>
                            <div className="flex-col gap-2 flex">
                                <label className="text-sm font-semibold text-muted">Email Address</label>
                                <input className="input" defaultValue="piyush@example.com" disabled />
                            </div>
                        </div>

                        <div className="flex-col gap-2 flex">
                            <label className="text-sm font-semibold text-muted">Bio / Personal Channel Description</label>
                            <textarea className="input" style={{ minHeight: '100px' }} placeholder="Tell us about your content style..." />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                        <button className="btn btn-primary flex gap-2">
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
