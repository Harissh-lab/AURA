import React from 'react';
import { X, MessageSquare, Settings, History, LogOut } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed top-0 left-0 h-full w-72 bg-slate-50 z-50 shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-teal-500 to-indigo-500 bg-clip-text text-transparent">Aura</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-2 flex-1">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent</div>
                        <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-200 rounded-xl text-slate-700 text-sm transition-colors text-left">
                            <MessageSquare size={18} />
                            <span className="truncate">Anxiety about upcoming presentation</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-200 rounded-xl text-slate-700 text-sm transition-colors text-left">
                            <MessageSquare size={18} />
                            <span className="truncate">Morning routine ideas</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-200 rounded-xl text-slate-700 text-sm transition-colors text-left">
                            <MessageSquare size={18} />
                            <span className="truncate">Can't sleep help</span>
                        </button>
                    </div>

                    <div className="border-t border-slate-200 pt-4 space-y-2">
                        <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-200 rounded-xl text-slate-700 text-sm">
                            <Settings size={18} /> Settings
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-200 rounded-xl text-slate-700 text-sm">
                            <History size={18} /> Activity
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-rose-50 text-rose-600 rounded-xl text-sm mt-2">
                            <LogOut size={18} /> Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
