// Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../configs/FirebaseConfigs';
import ShopNexLogo from '../../assets/images/ShopNex-2-TransP.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const themeColors = {
    primary: '#1B262C',    // Dark navy
    secondary: '#0F4C75',  // Deep blue
    tertiary: '#3282B8',   // Medium blue
    light: '#BBE1FA'       // Light blue
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in successfully:', userCredential.user);
      
      // Navigate to home page after successful login
      navigate('/home');
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific Firebase error codes
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        default:
          setError('Failed to log in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          .login-container {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            min-height: 100vh;
            width: 100vw;
            background-color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            color: ${themeColors.primary};
          }

          .login-card {
            background: linear-gradient(145deg, #ffffff 0%, rgba(187, 225, 250, 0.1) 100%);
            border: 2px solid rgba(187, 225, 250, 0.3);
            border-radius: 24px;
            padding: 3rem 2rem;
            width: 100%;
            max-width: 450px;
            box-shadow: 0 15px 35px rgba(27, 38, 44, 0.1);
            text-align: center;
          }

          .login-title {
            font-size: 2.2rem;
            font-weight: 700;
            background: linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .login-subtitle {
            font-size: 1rem;
            color: ${themeColors.primary};
            opacity: 0.7;
            margin-bottom: 2rem;
          }

          .error-message {
            background-color: #fee;
            border: 1px solid #fcc;
            color: #c33;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            text-align: left;
          }

          .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
          }

          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: ${themeColors.primary};
            font-size: 0.9rem;
          }

          .form-group input {
            width: calc(100% - 24px);
            padding: 12px;
            border: 1px solid rgba(187, 225, 250, 0.6);
            border-radius: 12px;
            font-size: 1rem;
            color: ${themeColors.primary};
            background-color: rgba(187, 225, 250, 0.1);
            transition: all 0.3s ease;
          }

          .form-group input:focus {
            outline: none;
            border-color: ${themeColors.tertiary};
            box-shadow: 0 0 0 3px rgba(50, 130, 184, 0.2);
          }

          .form-group input:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .login-button {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, ${themeColors.tertiary} 0%, ${themeColors.secondary} 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 1rem;
          }

          .login-button:hover:not(:disabled) {
            opacity: 0.9;
            box-shadow: 0 8px 25px rgba(15, 76, 117, 0.4);
          }

          .login-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}
      </style>
      <div className="login-container">
        <div className="login-card">
          <img 
            src={ShopNexLogo} 
            alt="ShopNex Logo" 
            style={{ 
              maxWidth: '150px', 
              marginBottom: '1.5rem', 
              display: 'block', 
              margin: '0 auto 1.5rem auto' 
            }} 
          />
          <h1 className="login-title">Welcome</h1>
          <p className="login-subtitle">Please sign in to your account using your registered E-mail & Password</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;