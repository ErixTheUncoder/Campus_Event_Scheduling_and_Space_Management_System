import { useState } from 'react';

function LoginForm(){
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  return(
      <div className='loginBody'>
        <form>
          {/* Input for email */}
          <input 
          className='emailTextbox'
          type='text' 
          placeholder='University email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          />

          <br/>

          {/* Input for password */}
          <input 
          className='passwordTextbox'
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          />
          
          <br/>

          <button type='submit' className='submitButton'>Log In</button>
        </form>
      </div>
  )
}

export default LoginForm;