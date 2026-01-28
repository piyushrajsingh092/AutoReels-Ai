"use client";

import { CreditCard, Check, Zap } from "lucide-react";

export default function BillingPage() {
    return (
        <div className="flex-col gap-8 flex">
            <div>
                <h2 className="text-3xl font-bold">Subscription & Billing</h2>
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>Manage your plan and video generation credits</p>
            </div>

            {/* Usage Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="card text-center flex-col gap-2 flex">
                    <p className="text-sm text-muted">Current Plan</p>
                    <p className="text-2xl font-bold">Free Trial</p>
                </div>
                <div className="card text-center flex-col gap-2 flex">
                    <p className="text-sm text-muted">Credits Remaining</p>
                    <p className="text-2xl font-bold text-indigo-400">30 / 50</p>
                </div>
                <div className="card text-center flex-col gap-2 flex">
                    <p className="text-sm text-muted">Next Reset</p>
                    <p className="text-2xl font-bold">Feb 28, 2026</p>
                </div>
            </div>

            {/* Plans */}
            <div className="grid md:grid-cols-3 gap-8" style={{ marginTop: '2rem' }}>
                <PlanCard
                    name="Starter"
                    price="0"
                    features={["10 Videos / month", "Standard Templates", "720p Resolution"]}
                />
                <PlanCard
                    name="Pro"
                    price="29"
                    featured
                    features={["50 Videos / month", "Premium Templates", "1080p Export", "Auto-Scheduling", "Priority Rendering"]}
                />
                <PlanCard
                    name="Agency"
                    price="99"
                    features={["Unlimited Videos", "Custom Templates", "4K Export", "Multiple Accounts", "API Access"]}
                />
            </div>
        </div>
    );
}

function PlanCard({ name, price, features, featured }: any) {
    return (
        <div className={`card flex-col gap-6 flex ${featured ? 'border-primary' : ''}`} style={{ position: 'relative', borderColor: featured ? 'var(--primary)' : 'var(--border)' }}>
            {featured && (
                <div className="badge badge-indigo" style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '2px 12px' }}>
                    Most Popular
                </div>
            )}
            <div className="text-center">
                <h3 className="text-xl font-bold">{name}</h3>
                <div className="flex justify-center items-baseline gap-1" style={{ marginTop: '1rem' }}>
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-muted">/mo</span>
                </div>
            </div>

            <div className="flex-col gap-3 flex" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                {features.map((f: string) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                        <Check size={16} className="text-emerald-400" />
                        {f}
                    </div>
                ))}
            </div>

            <button className={`btn ${featured ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', marginTop: 'auto' }}>
                {price === "0" ? "Current Plan" : "Upgrade Now"}
            </button>
        </div>
    );
}
