/**
 * AuthModal Component
 * Handles user registration and login
 * 
 * Features:
 * - Switch between register and login modes
 * - Input validation with real-time feedback
 * - Strength indicators for abbreviation and PIN
 * - Optional recovery code generation
 * - Optional email for recovery code delivery
 * - Error handling and user feedback
 */

import { useState, useEffect } from 'react';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, onSuccess, mode: initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'recover'
  const [formData, setFormData] = useState({
    username: '',
    abbreviation: '',
    pin: '',
    recoveryCode: '',
    email: ''
  });
  
  const [options, setOptions] = useState({
    generateRecoveryCode: true,
    sendToEmail: false
  });

  const [validation, setValidation] = useState({
    username: { valid: null, error: '' },
    abbreviation: { valid: null, error: '', strength: '' },
    pin: { valid: null, error: '', strength: '' }
  });

  const [generatedRecoveryCode, setGeneratedRecoveryCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form when mode changes
  useEffect(() => {
    setFormData({
      username: '',
      abbreviation: '',
      pin: '',
      recoveryCode: '',
      email: ''
    });
    setError('');
    setSuccess('');
    setGeneratedRecoveryCode(null);
  }, [mode]);

  // Validate username
  const validateUsername = (username) => {
    if (!username) return { valid: null, error: '' };
    
    if (username.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters' };
    }
    if (username.length > 30) {
      return { valid: false, error: 'Username must be 30 characters or less' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, error: 'Only letters, numbers, and underscores allowed' };
    }
    
    return { valid: true, error: '' };
  };

  // Validate abbreviation
  const validateAbbreviation = (abbreviation, username) => {
    if (!abbreviation) return { valid: null, error: '', strength: '' };
    
    const abb = abbreviation.toLowerCase();
    
    if (abb.length < 4) {
      return { valid: false, error: 'Abbreviation must be at least 4 characters', strength: 'weak' };
    }
    if (abb.length > 5) {
      return { valid: false, error: 'Abbreviation must be 5 characters or less', strength: 'weak' };
    }
    if (!/^[a-z0-9]+$/.test(abb)) {
      return { valid: false, error: 'Only letters and numbers allowed', strength: 'weak' };
    }
    
    // Check similarity to username
    if (username && abb === username.toLowerCase().substring(0, 5)) {
      return { valid: false, error: 'Too similar to username', strength: 'weak' };
    }
    
    // Check for repeated characters
    if (/^(.)\1+$/.test(abb)) {
      return { valid: false, error: 'Cannot be all same character', strength: 'weak' };
    }
    
    // Check for sequential
    if (isSequential(abb)) {
      return { valid: false, error: 'Cannot be sequential', strength: 'weak' };
    }
    
    // Calculate strength
    const strength = calculateAbbreviationStrength(abb);
    
    return { valid: true, error: '', strength };
  };

  // Validate PIN
  const validatePIN = (pin) => {
    if (!pin) return { valid: null, error: '', strength: '' };
    
    if (pin.length < 5) {
      return { valid: false, error: 'PIN must be at least 5 digits', strength: 'weak' };
    }
    if (pin.length > 7) {
      return { valid: false, error: 'PIN must be 7 digits or less', strength: 'weak' };
    }
    if (!/^[0-9]+$/.test(pin)) {
      return { valid: false, error: 'Only numbers allowed', strength: 'weak' };
    }
    
    // Check for repeated digits
    if (/^(\d)\1+$/.test(pin)) {
      return { valid: false, error: 'Cannot be all same digit', strength: 'weak' };
    }
    
    // Check for sequential
    if (isSequential(pin)) {
      return { valid: false, error: 'Cannot be sequential', strength: 'weak' };
    }
    
    // Check for common PINs
    const commonPins = ['12345', '54321', '123456', '654321', '11111', '00000'];
    if (commonPins.includes(pin)) {
      return { valid: false, error: 'This PIN is too common', strength: 'weak' };
    }
    
    // Calculate strength
    const strength = calculatePINStrength(pin);
    
    return { valid: true, error: '', strength };
  };

  // Helper: Check if sequential
  const isSequential = (str) => {
    if (str.length < 3) return false;
    
    let ascending = true;
    let descending = true;
    
    for (let i = 1; i < str.length; i++) {
      const diff = str.charCodeAt(i) - str.charCodeAt(i - 1);
      if (diff !== 1) ascending = false;
      if (diff !== -1) descending = false;
      if (!ascending && !descending) return false;
    }
    
    return ascending || descending;
  };

  // Helper: Calculate abbreviation strength
  const calculateAbbreviationStrength = (abb) => {
    let score = 0;
    if (abb.length === 5) score += 2;
    if (/[a-z]/.test(abb) && /[0-9]/.test(abb)) score += 3;
    if (new Set(abb).size === abb.length) score += 2;
    if (!/(.)\1\1/.test(abb)) score += 1;
    
    if (score >= 6) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
  };

  // Helper: Calculate PIN strength
  const calculatePINStrength = (pin) => {
    let score = 0;
    if (pin.length >= 6) score += 2;
    if (pin.length === 7) score += 1;
    
    const uniqueDigits = new Set(pin).size;
    if (uniqueDigits >= 4) score += 2;
    if (uniqueDigits >= 5) score += 1;
    
    if (!/(\d)\1\1/.test(pin)) score += 1;
    if (!/(\d)\1(\d)\2/.test(pin)) score += 1;
    
    if (score >= 6) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    if (mode === 'register') {
      if (name === 'username') {
        setValidation(prev => ({ ...prev, username: validateUsername(value) }));
      } else if (name === 'abbreviation') {
        setValidation(prev => ({ ...prev, abbreviation: validateAbbreviation(value, formData.username) }));
      } else if (name === 'pin') {
        setValidation(prev => ({ ...prev, pin: validatePIN(value) }));
      }
    }
  };

  // Handle checkbox change
  const handleOptionChange = (e) => {
    const { name, checked } = e.target;
    setOptions(prev => ({ ...prev, [name]: checked }));
  };

  // Handle register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate all fields
      const usernameValidation = validateUsername(formData.username);
      const abbreviationValidation = validateAbbreviation(formData.abbreviation, formData.username);
      const pinValidation = validatePIN(formData.pin);

      if (!usernameValidation.valid || !abbreviationValidation.valid || !pinValidation.valid) {
        setError('Please fix validation errors before submitting');
        setLoading(false);
        return;
      }

      // Call API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          abbreviation: formData.abbreviation,
          pin: formData.pin,
          generateRecoveryCode: options.generateRecoveryCode,
          email: options.sendToEmail ? formData.email : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Success!
      setGeneratedRecoveryCode(data.data.recoveryCode);
      setSuccess('Account created successfully!');
      
      // Don't close modal yet - show recovery code
      // User must acknowledge before closing

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          abbreviation: formData.abbreviation,
          pin: formData.pin
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save token to localStorage
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('username', data.data.user.username);

      // Call success callback
      onSuccess(data.data);
      onClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle recovery
  const handleRecover = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          recoveryCode: formData.recoveryCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Recovery failed');
      }

      // Store reset token temporarily
      sessionStorage.setItem('resetToken', data.data.resetToken);
      
      // Redirect to reset page or show reset form
      setSuccess('Recovery code verified! You can now reset your credentials.');
      
      // TODO: Navigate to reset page

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle recovery code acknowledgment
  const handleRecoveryCodeAcknowledged = () => {
    onSuccess({ username: formData.username });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>

        {/* Show recovery code if generated */}
        {generatedRecoveryCode ? (
          <div className="recovery-code-display">
            <h2>✅ Account Created!</h2>
            <p>Save your recovery code:</p>
            
            <div className="recovery-code-box">
              {generatedRecoveryCode}
            </div>

            <div className="recovery-code-actions">
              <button onClick={() => navigator.clipboard.writeText(generatedRecoveryCode)}>
                📋 Copy
              </button>
              <button onClick={() => {
                const blob = new Blob([`Lorem Type Recovery Code\n\nUsername: ${formData.username}\nRecovery Code: ${generatedRecoveryCode}\n\nKeep this safe!`], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `lorem-type-recovery-${formData.username}.txt`;
                a.click();
              }}>
                💾 Download
              </button>
            </div>

            <div className="warning-box">
              <strong>⚠️ Important:</strong> This code will only be shown once. Save it now!
            </div>

            <button className="primary-button" onClick={handleRecoveryCodeAcknowledged}>
              I've Saved It
            </button>
          </div>
        ) : (
          <>
            {/* Mode tabs */}
            <div className="auth-tabs">
              <button 
                className={mode === 'login' ? 'active' : ''}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button 
                className={mode === 'register' ? 'active' : ''}
                onClick={() => setMode('register')}
              >
                Register
              </button>
              <button 
                className={mode === 'recover' ? 'active' : ''}
                onClick={() => setMode('recover')}
              >
                Recover
              </button>
            </div>

            {/* Error/Success messages */}
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Login Form */}
            {mode === 'login' && (
              <form onSubmit={handleLogin}>
                <h2>Login</h2>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    autoComplete="username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="abbreviation">Abbreviation</label>
                  <input
                    type="text"
                    id="abbreviation"
                    name="abbreviation"
                    value={formData.abbreviation}
                    onChange={handleInputChange}
                    maxLength={5}
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pin">PIN</label>
                  <input
                    type="password"
                    id="pin"
                    name="pin"
                    value={formData.pin}
                    onChange={handleInputChange}
                    maxLength={7}
                    required
                    autoComplete="off"
                  />
                </div>

                <button type="submit" disabled={loading} className="primary-button">
                  {loading ? 'Logging in...' : 'Login'}
                </button>

                <p className="form-footer">
                  Forgot your credentials? <button type="button" onClick={() => setMode('recover')}>Recover Account</button>
                </p>
              </form>
            )}

            {/* Register Form */}
            {mode === 'register' && (
              <form onSubmit={handleRegister}>
                <h2>Create Account</h2>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    autoComplete="username"
                  />
                  {validation.username.error && (
                    <span className="validation-error">{validation.username.error}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="abbreviation">Abbreviation (4-5 chars)</label>
                  <input
                    type="text"
                    id="abbreviation"
                    name="abbreviation"
                    value={formData.abbreviation}
                    onChange={handleInputChange}
                    maxLength={5}
                    required
                    autoComplete="off"
                  />
                  {validation.abbreviation.error && (
                    <span className="validation-error">{validation.abbreviation.error}</span>
                  )}
                  {validation.abbreviation.strength && (
                    <span className={`strength-indicator ${validation.abbreviation.strength}`}>
                      Strength: {validation.abbreviation.strength}
                    </span>
                  )}
                  <small>Choose a random code. Don't use your username!</small>
                </div>

                <div className="form-group">
                  <label htmlFor="pin">PIN (5-7 digits)</label>
                  <input
                    type="password"
                    id="pin"
                    name="pin"
                    value={formData.pin}
                    onChange={handleInputChange}
                    maxLength={7}
                    required
                    autoComplete="off"
                  />
                  {validation.pin.error && (
                    <span className="validation-error">{validation.pin.error}</span>
                  )}
                  {validation.pin.strength && (
                    <span className={`strength-indicator ${validation.pin.strength}`}>
                      Strength: {validation.pin.strength}
                    </span>
                  )}
                  <small>Avoid sequential or repeated numbers.</small>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="generateRecoveryCode"
                      checked={options.generateRecoveryCode}
                      onChange={handleOptionChange}
                    />
                    Generate recovery code (recommended)
                  </label>
                </div>

                {options.generateRecoveryCode && (
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="sendToEmail"
                        checked={options.sendToEmail}
                        onChange={handleOptionChange}
                      />
                      Send recovery code to email
                    </label>
                  </div>
                )}

                {options.sendToEmail && (
                  <div className="form-group">
                    <label htmlFor="email">Email (optional)</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      autoComplete="email"
                    />
                    <small>We do NOT store your email. It's only used to send the code.</small>
                  </div>
                )}

                <div className="info-box">
                  <strong>ℹ️ Security Note:</strong>
                  <ul>
                    <li>Choose random, unique values</li>
                    <li>Your recovery code will be shown only once</li>
                    <li>Without it, you can't recover a forgotten account</li>
                  </ul>
                </div>

                <button type="submit" disabled={loading} className="primary-button">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

            {/* Recover Form */}
            {mode === 'recover' && (
              <form onSubmit={handleRecover}>
                <h2>Recover Account</h2>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="recoveryCode">Recovery Code</label>
                  <input
                    type="text"
                    id="recoveryCode"
                    name="recoveryCode"
                    value={formData.recoveryCode}
                    onChange={handleInputChange}
                    placeholder="LOREM-XXXX-XXXX-XXXX"
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className="primary-button">
                  {loading ? 'Verifying...' : 'Verify Recovery Code'}
                </button>

                <div className="info-box">
                  <strong>ℹ️ Don't have a recovery code?</strong>
                  <p>Unfortunately, without a recovery code, we cannot verify your identity. You'll need to create a new account.</p>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
