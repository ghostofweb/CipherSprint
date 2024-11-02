import React, { useState } from 'react';
import { Button, TextField, Box, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { auth, firestore } from '../firebaseConfig'; 
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { useTheme } from '../Context/ThemeContext';
import { Bounce, toast } from 'react-toastify';
import { doc, setDoc } from 'firebase/firestore';

const validateUsername = (username) => /^[a-zA-Z0-9_]+$/.test(username);

export const SignupForm = ({ onSuccess }) => { // Accept onSuccess as prop
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
    
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
    
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
      onSuccess(); // Call onSuccess to close modal
    } catch (error) {
      toast.error(`Error: ${error.message}`, {
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
      <TextField
        label="Username"
        variant="outlined"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        inputProps={{ style: { color: theme.textColor, fontSize: '1.2rem' } }} // Increased font size
        InputLabelProps={{ style: { color: theme.textColor, fontSize: '1.2rem' } }} // Increased font size
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} // Optional: round the corners
      />
      <TextField
        label="Email"
        variant="outlined"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        inputProps={{ style: { color: theme.textColor, fontSize: '1.2rem' } }} // Increased font size
        InputLabelProps={{ style: { color: theme.textColor, fontSize: '1.2rem' } }} // Increased font size
      />
      <TextField
        label="Password"
        type={showPassword ? 'text' : 'password'}
        variant="outlined"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        inputProps={{ style: { color: theme.textColor, fontSize: '1.2rem' } }} // Increased font size
        InputLabelProps={{ style: { color: theme.textColor, fontSize: '1.2rem' } }} // Increased font size
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <TextField
        label="Confirm Password"
        type={showPassword ? 'text' : 'password'}
        variant="outlined"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        inputProps={{ style: { color: theme.textColor, fontSize: '1.2rem' } }} // Increased font size
        InputLabelProps={{ style: { color: theme.textColor, fontSize: '1.2rem' } }} // Increased font size
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{
          background: theme.background,
          color: theme.textColor,
          fontSize: '1.2rem', // Increased button font size
          padding: '10px 20px', // Increased padding for a larger button
        }}
      >
        Sign Up
      </Button>
    </Box>
  );
  
};

export default SignupForm;
