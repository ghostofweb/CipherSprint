// SignupForm.js
import React, { useState } from 'react';
import { Button, TextField, Box, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { auth, firestore } from '../firebaseConfig'; // Import Firestore
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { useTheme } from '../Context/ThemeContext';
import { Bounce, toast } from 'react-toastify';
import { doc, setDoc } from 'firebase/firestore';

// Helper function to validate username
const validateUsername = (username) => /^[a-zA-Z0-9_]+$/.test(username);

export const SignupForm = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email || !username || !password || !confirmPassword) {
      toast.warning('Please fill all the fields', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
      return;
    }

    if (!validateUsername(username)) {
      toast.warning('Username can only contain letters, numbers, and underscores', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
      return;
    }

    if (password.length < 6) {
      toast.warning('Password should be at least 6 characters', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.warning('Passwords do not match', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
      return;
    }

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        toast.error('User with the same email already exists', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Bounce,
        });
        return;
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save username to Firestore under users collection
      await setDoc(doc(firestore, "users", user.uid), {
        username: username,
        email: email,
      });

      toast.success('User created successfully', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    } catch (err) {
      console.log(err)
      toast.error('Something went wrong: ' + err.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }
   
};

  const handleKeyDown = (e)=>{
    if(e.key === "Enter"){
        handleSubmit();
    }
}

  return (
    <Box component="form" noValidate autoComplete="off"  sx={{
        display: 'flex',
        flexDirection: 'column',
        padding: 2,
        backgroundColor: theme.background,
        color: theme.textColor,
        borderRadius: 1,
        height: '100%', // Ensure the Box has height
    }}>
      <TextField
        onKeyDown={handleKeyDown}
        required
        label="Email"
        type="email"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)
        }
        InputProps={{
            style: { color: theme.textColor },
          }}
          InputLabelProps={{
            style: { color: theme.textColor },
          }}/>
      <TextField
        onKeyDown={handleKeyDown}
        required
        label="Username"
        fullWidth
        margin="normal"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        InputProps={{
            style: { color: theme.textColor },
          }}
          InputLabelProps={{
            style: { color: theme.textColor },
          }}/>
      <TextField
        onKeyDown={handleKeyDown}
        required
        label="Password"
        type={showPassword ? 'text' : 'password'}
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
          InputLabelProps={{
            style: { color: theme.textColor },
          }}
        InputProps={{
            style: { color: theme.textColor},
          endAdornment: (
            <InputAdornment position="end" >
              <IconButton onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <VisibilityOff sx={{ color: theme.textColor }}/> : <Visibility sx={{ color: theme.textColor }}/>}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <TextField
        onKeyDown={handleKeyDown}
        required
        label="Confirm Password"
        type={showPassword ? 'text' : 'password'}
        fullWidth
        margin="normal"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        InputProps={{
            style: { color: theme.textColor },
          }}
          InputLabelProps={{
            style: { color: theme.textColor },
          }}/>
      <Button variant="contained" color="primary" onClick={handleSubmit} sx={{display:"flex", alignContent:"center" , background:theme.background}}>
        Sign Up
      </Button>
    </Box>
  );
};

export default SignupForm;