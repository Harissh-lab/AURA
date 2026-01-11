import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Brain, Sparkles, User, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle } from '../services/authService';

interface SignUpPageProps {
  onSwitchToLogin: () => void;
  onSignUp: () => void;
}

export function SignUpPage({ onSwitchToLogin, onSignUp }: SignUpPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emergencyContact1Name, setEmergencyContact1Name] = useState('');
  const [emergencyContact1Phone, setEmergencyContact1Phone] = useState('');
  const [emergencyContact1Relationship, setEmergencyContact1Relationship] = useState('');
  const [emergencyContact2Name, setEmergencyContact2Name] = useState('');
  const [emergencyContact2Phone, setEmergencyContact2Phone] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('📝 Attempting signup with data:', { 
        fullName, 
        email, 
        mobileNumber,
        hasContact1: !!emergencyContact1Name,
        hasContact2: !!emergencyContact2Name 
      });
      
      const user = await signUpWithEmail({
        fullName,
        email,
        password,
        mobileNumber,
        emergencyContact1: emergencyContact1Name ? {
          name: emergencyContact1Name,
          phone: emergencyContact1Phone,
          relationship: emergencyContact1Relationship
        } : undefined,
        emergencyContact2: emergencyContact2Name ? {
          name: emergencyContact2Name,
          phone: emergencyContact2Phone
        } : undefined
      });
      
      console.log('✅ Successfully signed up user:', user.uid);
      console.log('✅ Emergency contacts should be saved to Firebase');
      onSignUp();
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      console.log('✅ Successfully signed up with Google');
      onSignUp();
    } catch (error: any) {
      console.error('❌ Google sign up error:', error);
      setError(error.message || 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 my-8">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <Brain className="w-16 h-16 text-teal-400" strokeWidth={1.5} />
            <Sparkles className="w-6 h-6 text-teal-400 absolute -top-1 -right-1" />
          </div>
          <span className="ml-2 text-teal-400 tracking-wide uppercase text-4xl font-black">AURA</span>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-6">
          <h1 className="text-teal-400 mb-2">Create Account</h1>
          <p className="text-gray-600">Start your wellness journey today</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Input */}
          <div>
            <label htmlFor="fullName" className="block text-teal-400 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-teal-400 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Mobile Number Input */}
          <div>
            <label htmlFor="mobileNumber" className="block text-teal-400 mb-2">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                id="mobileNumber"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-teal-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-teal-400 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Emergency Contacts Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-teal-400 mb-4">Emergency Contacts</h3>
            
            {/* Emergency Contact 1 */}
            <div className="space-y-4 mb-4">
              <p className="text-gray-600">Emergency Contact 1</p>
              
              <div>
                <label htmlFor="emergencyContact1Relationship" className="block text-teal-400 mb-2">
                  Relationship
                </label>
                <select
                  id="emergencyContact1Relationship"
                  value={emergencyContact1Relationship}
                  onChange={(e) => setEmergencyContact1Relationship(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                >
                  <option value="">Select relationship</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="sibling">Sibling</option>
                  <option value="spouse">Husband/Wife</option>
                </select>
              </div>

              <div>
                <label htmlFor="emergencyContact1Name" className="block text-teal-400 mb-2">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="emergencyContact1Name"
                    value={emergencyContact1Name}
                    onChange={(e) => setEmergencyContact1Name(e.target.value)}
                    placeholder="Contact name"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="emergencyContact1Phone" className="block text-teal-400 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    id="emergencyContact1Phone"
                    value={emergencyContact1Phone}
                    onChange={(e) => setEmergencyContact1Phone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact 2 */}
            <div className="space-y-4">
              <p className="text-gray-600">Emergency Contact 2</p>

              <div>
                <label htmlFor="emergencyContact2Name" className="block text-teal-400 mb-2">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="emergencyContact2Name"
                    value={emergencyContact2Name}
                    onChange={(e) => setEmergencyContact2Name(e.target.value)}
                    placeholder="Contact name"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="emergencyContact2Phone" className="block text-teal-400 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    id="emergencyContact2Phone"
                    value={emergencyContact2Phone}
                    onChange={(e) => setEmergencyContact2Phone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="w-4 h-4 mt-1 text-teal-400 border-gray-300 rounded focus:ring-teal-400"
            />
            <label htmlFor="agreeToTerms" className="ml-2 text-gray-700 cursor-pointer">
              I agree to the{' '}
              <a href="#" className="text-teal-400 hover:text-teal-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-teal-400 hover:text-teal-500">
                Privacy Policy
              </a>
            </label>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-400 text-white py-3 rounded-xl hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500">Or continue with</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Google Sign Up */}
        <button
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-gray-700">Google</span>
        </button>

        {/* Sign In Link */}
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-teal-400 hover:text-teal-500">
            Sign in
          </button>
        </p>

        {/* Crisis Helpline */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-center text-gray-700">
            <span className="font-semibold">In crisis?</span> Call the National Suicide Prevention Lifeline at{' '}
            <span className="font-semibold">14416</span>
          </p>
        </div>
      </div>
    </div>
  );
}