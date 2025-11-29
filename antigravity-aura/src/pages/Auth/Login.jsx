import React, { useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';

const Login = ({ onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            onLogin();
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-teal-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50" />

            <div className="w-full max-w-sm z-10 flex flex-col gap-8 animate-fade-in-up">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-400 to-indigo-500 text-white shadow-xl shadow-teal-200 mb-4">
                        <Sparkles size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Welcome to Aura</h1>
                    <p className="text-slate-500">Your safe space for mental wellness.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <InputField label="Email" type="email" placeholder="hello@example.com" />
                    <InputField label="Password" type="password" placeholder="••••••••" />

                    <div className="flex justify-end">
                        <button type="button" className="text-sm text-teal-600 font-medium hover:text-teal-700">Forgot Password?</button>
                    </div>

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <span className="animate-pulse">Signing in...</span>
                        ) : (
                            <>Sign In <ChevronRight size={18} /></>
                        )}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-400">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="text-sm">Google</Button>
                    <Button variant="outline" className="text-sm">Apple</Button>
                </div>
            </div>
        </div>
    );
};

export default Login;
