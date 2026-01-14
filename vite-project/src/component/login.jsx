import { useState } from 'react';

// 1. We receive 'onLogin' here
function LoginForm({ onLogin }){ 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
      e.preventDefault(); 
      // 2. We use the prop to tell App.js to switch tabs
      onLogin(true); 
  }

  return(
      <div className='loginBody'>
        {/* The form handles the submit event */}
        <form onSubmit={handleLogin}>
          <input 
            className='emailTextbox'
            type='text' 
            placeholder='University email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input 
            className='passwordTextbox'
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <br/>

          {/* 3. Removed onClick here. The form's onSubmit handles it now. */}
          <button type='submit' className='submitButton'>Log In</button>
          
          <br/>
          {/* If you keep this button, it must also use onLogin, not isLoggedIn */}
          <button type="button" onClick={() => onLogin(true)}>
            Click me to view dashboard
          </button>
        </form>
      </div>
  )
}

export default LoginForm;