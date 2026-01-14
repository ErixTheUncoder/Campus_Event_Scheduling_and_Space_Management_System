import { useState } from 'react';

function LoginForm({ onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // login/register

  // shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // register only
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // ui state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

// Error handling messages
function friendlyErrorMessage(error) {
  if (!error) return "";

  // Login-specific backend message
  if (error.includes("email and password")) {
    return "Please enter your email and password.";
  }

  // Handle backend messages like: "full_name, email, password are required"
  if (error.includes("are required")) {
    const fieldsPart = error.split("are required")[0] || "";
    const fields = fieldsPart
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const labelMap = {
      full_name: "Full name",
      email: "Email",
      password: "Password",
      phone_number: "Phone number",
      user_role: "Role",
    };

    const missing = fields.map(f => labelMap[f] || f);

    if (missing.length === 1) {
      return `Please enter your ${missing[0].toLowerCase()}.`;
    }
    return `Please fill in: ${missing.join(", ")}.`;
  }

  // Other specific errors
  if (error.includes("Email already registered")) {
    return "This email is already registered.";
  }

  if (error.includes("Invalid credentials")) {
    return "Incorrect email or password.";
  }

  // Fallbacks if backend returns single-field messages
  if (error.includes("phone_number")) return "Please enter your phone number.";
  if (error.includes("full_name")) return "Please enter your full name.";
  if (error.includes("email")) return "Please enter a valid email address.";
  if (error.includes("password")) return "Please enter a password.";

  return error;
}


  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
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

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
          phone_number: phoneNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setSuccess("Registration successful! Please login.");
      setMode("login");
      setPassword("");
      setPhoneNumber("");
    } catch {
      setError("Cannot connect to backend. Is Flask running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='loginBody'>
      {mode === "login" ? (
        <form onSubmit={handleLogin}>
          <h2>Login</h2>

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

          {error && <p style={{ color: "salmon" }}>{friendlyErrorMessage(error)}</p>}
          {success && <p style={{ color: "lightgreen" }}>{success}</p>}

          <button type='submit' className='submitButton' disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>

          <p style={{ marginTop: "1rem" }}>
            New user?{" "}
            <button
              type="button"
              className="linkButton"
              onClick={() => {
                setMode("register");
                setError("");
                setSuccess("");
              }}
            >
              Register User
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <h2>Register User</h2>

          <input
            className='emailTextbox'
            type='text'
            placeholder='Full name'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <br />

          <input
            className='emailTextbox'
            type='text'
            placeholder='University email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />

          <input
            className='emailTextbox'
            type='text'
            placeholder='Phone number'
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
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

          {error && <p style={{ color: "salmon" }}>{friendlyErrorMessage(error)}</p>}

          <button type='submit' className='submitButton' disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>

          <p style={{ marginTop: "1rem" }}>
            Already have an account?{" "}
            <button
              type="button"
              className="linkButton"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
            >
              Back to Login
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

export default LoginForm;
