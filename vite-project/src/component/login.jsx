import { useState } from 'react';

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
    <div className='loginBody'>
      <form onSubmit={handleLogin}>
        <h2>Login</h2>

        <input
          className='emailTextbox'
          type='text'
          placeholder='University email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />

        <input
          className='passwordTextbox'
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />

        {error && <p style={{ color: "salmon" }}>{friendlyErrorMessage(error)}</p>}

        <button type='submit' className='submitButton' disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          Have problem logging in? <br />Please contact the administrator.
        </p>
      </form>
    </div>
  );
}

export default LoginForm;
