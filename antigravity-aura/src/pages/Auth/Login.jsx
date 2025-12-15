import React, { useState } from 'react';
import { signIn, signUp, resetPassword } from '../../services/authService';
import { createUserProfile } from '../../services/firestoreService';
import './Login.css';

const Login = ({ onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUpMode, setIsSignUpMode] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: ''
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            if (isResetMode) {
                // Password reset
                const result = await resetPassword(formData.email);
                if (result.success) {
                    setSuccessMessage('Password reset email sent! Check your inbox.');
                    setTimeout(() => {
                        setIsResetMode(false);
                        setSuccessMessage('');
                    }, 3000);
                } else {
                    setError(result.error);
                }
            } else if (isSignUpMode) {
                // Sign up
                if (!formData.displayName.trim()) {
                    setError('Please enter your name');
                    return;
                }
                const result = await signUp(formData.email, formData.password, formData.displayName);
                if (result.success) {
                    // Create user profile
                    await createUserProfile(result.user.uid, {
                        displayName: formData.displayName,
                        email: formData.email,
                        chatMode: 'friend'
                    });
                    onLogin();
                } else {
                    setError(result.error);
                }
            } else {
                // Sign in
                const result = await signIn(formData.email, formData.password);
                if (result.success) {
                    onLogin();
                } else {
                    setError(result.error);
                }
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Auth error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = () => {
        setIsSignUpMode(true);
        setIsResetMode(false);
        setError('');
        setSuccessMessage('');
    };

    const handleForgotPassword = () => {
        setIsResetMode(true);
        setIsSignUpMode(false);
        setError('');
        setSuccessMessage('');
    };

    const handleBackToLogin = () => {
        setIsSignUpMode(false);
        setIsResetMode(false);
        setError('');
        setSuccessMessage('');
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
        }}>
            <form className="form" onSubmit={handleLogin}>
                <p id="heading">
                    {isResetMode ? 'Reset Password' : isSignUpMode ? 'Sign Up' : 'Login'}
                </p>
                
                {error && (
                    <div style={{
                        background: '#fee',
                        border: '1px solid #fcc',
                        color: '#c33',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div style={{
                        background: '#efe',
                        border: '1px solid #cfc',
                        color: '#3c3',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {successMessage}
                    </div>
                )}

                {isSignUpMode && (
                    <div className="field">
                        <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
                        </svg>
                        <input 
                            autoComplete="off" 
                            placeholder="Name" 
                            className="input-field" 
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                            required
                        />
                    </div>
                )}
                
                <div className="field">
                    <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z"></path>
                    </svg>
                    <input 
                        autoComplete="off" 
                        placeholder="Email" 
                        className="input-field" 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                    />
                </div>
                
                {!isResetMode && (
                    <div className="field">
                        <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
                        </svg>
                        <input 
                            placeholder="Password" 
                            className="input-field" 
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                        />
                    </div>
                )}
                
                <div className="btn">
                    <button className="button1" type="submit" disabled={isLoading}>
                        {isLoading ? 'Please wait...' : isResetMode ? 'Send Reset Link' : isSignUpMode ? 'Create Account' : 'Login'}
                    </button>
                    {!isResetMode && !isSignUpMode && (
                        <button className="button2" type="button" onClick={handleSignUp}>Sign Up</button>
                    )}
                </div>
                
                {!isResetMode && !isSignUpMode && (
                    <button className="button3" type="button" onClick={handleForgotPassword}>Forgot Password</button>
                )}

                {(isResetMode || isSignUpMode) && (
                    <button className="button3" type="button" onClick={handleBackToLogin}>Back to Login</button>
                )}
            </form>
        </div>
    );
};

export default Login;
