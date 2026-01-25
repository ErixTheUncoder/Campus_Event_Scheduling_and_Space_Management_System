import { useState } from 'react';
import mmuLogo from '../Multimedia_University_logo_2020.png';

function LoginForm({ onLoginSuccess }) {
  // login only
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ui state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Error handling messages
  function friendlyErrorMessage(error) {
    if (!error) return "";

    if (error.includes("email and password")) {
      return "Please enter your email and password.";
    }

    if (error.includes("Invalid credentials")) {
      return "Incorrect email or password.";
    }

    if (error.includes("email")) {
      return "Please enter your email.";
    }

    if (error.includes("password")) {
      return "Please enter your password.";
    }

    return error;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      onLoginSuccess(data.user);
    } catch {
      setError("Cannot connect to backend. Is Flask running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='login-container'>
      <div className='login-card'>
        <img src={mmuLogo} alt="MMU Logo" className='login-logo' />
        <h2 className='login-title'>Campus Scheduler</h2>
        
        <form onSubmit={handleLogin} className='login-form'>
          <input
            className='login-input'
            type='text'
            placeholder='University Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className='login-input'
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className='login-error'>{friendlyErrorMessage(error)}</p>}

          <button type='submit' className='login-button' disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>

          <p className='login-help'>
            Need help? Please contact the Administrator.
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
