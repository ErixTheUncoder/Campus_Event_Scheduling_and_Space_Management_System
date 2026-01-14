import { useState } from 'react';

function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
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

      // Backend returns: { message, user }
      onLoginSuccess(data.user);
    } catch (err) {
      setError("Cannot connect to backend. Is Flask running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='loginBody'>
      <form onSubmit={handleSubmit}>
        <input
          className='emailTextbox'
          type='text'
          placeholder='University email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br />

        <input
          className='passwordTextbox'
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />

        {error && <p style={{ color: "salmon" }}>{error}</p>}

        <button type='submit' className='submitButton' disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
