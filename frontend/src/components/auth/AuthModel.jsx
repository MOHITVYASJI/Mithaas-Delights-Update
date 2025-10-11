import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { User, Lock, Mail, Phone } from 'lucide-react';
import './AnimatedAuth.css';

export const AuthModals = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { login, register } = useAuth();

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.classList.contains('dark');
      setIsDark(theme);
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (mode === 'login') {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.name, formData.email, formData.password, formData.phone);
      }

      if (result.success) {
        onClose();
        setFormData({ name: '', email: '', phone: '', password: '' });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden" data-testid="auth-modal">
        <div className={`animated-auth-container ${mode === 'register' ? 'active' : ''} ${isDark ? 'dark-mode' : 'light-mode'}`}>
          <div className="animated-auth-curved-shape shape1"></div>
          <div className="animated-auth-curved-shape shape2"></div>

          {/* Login Form */}
          <div className="animated-auth-form-box login">
            <h2 className="animation" style={{ '--S': 21, '--D': 0 }}>Login</h2>
            {error && mode === 'login' && (
              <Alert variant="destructive" data-testid="auth-error" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <div className="animated-auth-input-box animation" style={{ '--S': 22, '--D': 1 }}>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  data-testid="auth-email-input"
                />
                <label>Email or Phone</label>
                <Mail className="w-5 h-5" />
              </div>

              <div className="animated-auth-input-box animation" style={{ '--S': 23, '--D': 2 }}>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  data-testid="auth-password-input"
                />
                <label>Password</label>
                <Lock className="w-5 h-5" />
              </div>

              <div className="animated-auth-input-box animation" style={{ '--S': 24, '--D': 3 }}>
                <button 
                  className="animated-auth-btn" 
                  type="submit"
                  disabled={loading}
                  data-testid="auth-submit-button"
                >
                  {loading ? 'Please wait...' : 'Login'}
                </button>
              </div>

              <div className="animated-auth-link animation" style={{ '--S': 25, '--D': 4 }}>
                <p>Don't have an account? <br /> <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }} data-testid="auth-toggle-mode">Sign Up</a></p>
              </div>
            </form>
          </div>

          {/* Login Info Content */}
          <div className="animated-auth-info-content login">
            <h2 className="animation" style={{ '--S': 20, '--D': 0 }}>WELCOME BACK!</h2>
            <p className="animation" style={{ '--S': 21, '--D': 1 }}>We are happy to have you with us again. If you need anything, we are here to help.</p>
          </div>

          {/* Register Form */}
          <div className="animated-auth-form-box register">
            <h2 className="animation" style={{ '--li': 17, '--S': 0 }}>Register</h2>
            {error && mode === 'register' && (
              <Alert variant="destructive" data-testid="auth-error" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <div className="animated-auth-input-box animation" style={{ '--li': 18, '--S': 1 }}>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  data-testid="auth-name-input"
                />
                <label>Username</label>
                <User className="w-5 h-5" />
              </div>

              <div className="animated-auth-input-box animation" style={{ '--li': 19, '--S': 2 }}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <label>Email</label>
                <Mail className="w-5 h-5" />
              </div>

              <div className="animated-auth-input-box animation" style={{ '--li': 19, '--S': 3 }}>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  data-testid="auth-phone-input"
                />
                <label>Phone</label>
                <Phone className="w-5 h-5" />
              </div>

              <div className="animated-auth-input-box animation" style={{ '--li': 20, '--S': 4 }}>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <label>Password</label>
                <Lock className="w-5 h-5" />
              </div>

              <div className="animated-auth-input-box animation" style={{ '--li': 21, '--S': 5 }}>
                <button 
                  className="animated-auth-btn" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : 'Register'}
                </button>
              </div>

              <div className="animated-auth-link animation" style={{ '--li': 22, '--S': 6 }}>
                <p>Already have an account? <br /> <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }}>Sign In</a></p>
              </div>
            </form>
          </div>

          {/* Register Info Content */}
          <div className="animated-auth-info-content register">
            <h2 className="animation" style={{ '--li': 17, '--S': 0 }}>WELCOME!</h2>
            <p className="animation" style={{ '--li': 18, '--S': 1 }}>We're delighted to have you here. If you need any assistance, feel free to reach out.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};