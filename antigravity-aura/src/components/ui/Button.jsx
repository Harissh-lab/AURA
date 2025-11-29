import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "w-full font-medium rounded-full py-3 px-6 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
    const variants = {
        primary: "bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-200",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-50",
        outline: "border border-slate-300 text-slate-700 hover:bg-slate-50"
    };

    return (
        <button
            onClick={onClick}
            className={`${baseStyle} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
