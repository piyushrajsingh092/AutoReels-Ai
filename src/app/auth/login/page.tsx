"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/app/dashboard");
            router.refresh();
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center" style={{ minHeight: '100vh', display: 'flex' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <div className="text-center" style={{ marginBottom: '2rem' }}>
                    <div className="btn-primary" style={{ width: '48px', height: '48px', margin: '0 auto 1.5rem', borderRadius: '0.75rem' }}>
                        <Zap size={24} />
                    </div>
                    <h2 className="text-3xl font-bold">Welcome Back</h2>
                    <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>Sign in to your AutoReels account</p>
                </div>

                <form className="flex-col flex gap-4" onSubmit={handleLogin}>
                    <div className="flex-col flex gap-4">
                        <div>
                            <input
                                id="email"
                                type="email"
                                required
                                className="input"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                type="password"
                                required
                                className="input"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm" style={{ color: 'var(--badge-red)', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <div className="text-center text-sm" style={{ marginTop: '1.5rem' }}>
                    <p className="text-muted">
                        Don't have an account?{" "}
                        <Link href="/auth/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
