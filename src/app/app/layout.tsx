"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Video, ListVideo, LayoutTemplate, Link2, CreditCard, Settings, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Create Video', href: '/app/create', icon: Video },
    { name: 'Queue', href: '/app/queue', icon: ListVideo },
    { name: 'Templates', href: '/app/templates', icon: LayoutTemplate },
    { name: 'Connect', href: '/app/connect', icon: Link2 },
    { name: 'Billing', href: '/app/billing', icon: CreditCard },
    { name: 'Settings', href: '/app/settings', icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    return (
        <div className="flex">
            {/* Sidebar */}
            <aside className="sidebar">
                <div style={{ padding: '1.5rem' }}>
                    <h1 className="text-2xl font-bold gradient-text">
                        AutoReels AI
                    </h1>
                </div>

                <nav style={{ flex: 1, padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`nav-link ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
                        <p className="text-xs text-muted" style={{ textTransform: 'uppercase', fontWeight: 600 }}>Credits</p>
                        <div className="flex items-center gap-1" style={{ marginTop: '0.25rem' }}>
                            <span className="text-2xl font-bold">30</span>
                            <span className="text-sm text-muted">left</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="nav-link"
                        style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content flex-1">
                {children}
            </main>
        </div>
    );
}
