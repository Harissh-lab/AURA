import React from 'react';

const InputField = ({ label, type = "text", placeholder }) => (
    <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-medium text-slate-600 ml-1">{label}</label>
        <input
            type={type}
            placeholder={placeholder}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 placeholder:text-slate-400"
        />
    </div>
);

export default InputField;
