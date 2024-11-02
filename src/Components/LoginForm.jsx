import { Button, TextField, Box, IconButton, InputAdornment, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import React, { useState } from 'react';
import { useTheme } from '../Context/ThemeContext';
import { auth, firestore } from '../firebaseConfig'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Bounce, toast } from 'react-toastify';
import { doc, getDoc } from 'firebase/firestore'; 
import GoogleButton from 'react-google-button';

const LoginForm = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");

  const handleMouseDownPassword = () => setShowPassword(true);
  const handleMouseUpPassword = () => setShowPassword(false);

  const handleSubmit = async () => {
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
    if (!email || !password) {
      toast.error('Fill all the Details', {
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
      await signInWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser; 
      const userDoc = await getDoc(doc(firestore, "users", user.uid)); 
      if (userDoc.exists()) {
        setUsername(userDoc.data().username);
        toast.success(`Hello, ${userDoc.data().username}! Login Successfully`, {
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
    } catch (error) {
      toast.error(`Invalid Credential`, {
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

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Box
      onKeyDown={handleKeyDown}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: 2,
        backgroundColor: theme.background,
        color: theme.textColor,
        borderRadius: 1,
        height: '100%',
      }}
    >
      <TextField
        label="Email"
        variant="outlined"
        fullWidth
        type="email"
        InputProps={{
          style: { color: theme.textColor, fontSize: '1.2rem' }, // Increased font size
        }}
        InputLabelProps={{
          style: { color: theme.textColor, fontSize: '1.2rem' }, // Increased font size
        }}
        sx={{
          '& .MuiOutlinedInput-root .MuiInputBase-input::placeholder': {
            color: theme.background,
          },
        }}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Password"
        type={showPassword ? 'text' : 'password'}
        variant="outlined"
        fullWidth
        onChange={(e) => setPassword(e.target.value)}
        InputProps={{
          style: { color: theme.textColor, fontSize: '1.2rem' }, // Increased font size
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onMouseDown={handleMouseDownPassword}
                onMouseUp={handleMouseUpPassword}
                edge="end"
                aria-label="toggle password visibility"
              >
                {showPassword ? (
                  <Visibility sx={{ color: theme.textColor }} />
                ) : (
                  <VisibilityOff sx={{ color: theme.textColor }} />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
        InputLabelProps={{
          style: { color: theme.textColor, fontSize: '1.2rem' }, // Increased font size
        }}
        sx={{
          '& .MuiOutlinedInput-root .MuiInputBase-input::placeholder': {
            color: theme.background,
          },
        }}
      />
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={handleSubmit}
        sx={{
          background: theme.background,
          color: theme.textColor,
          fontSize: '1.2rem', // Increased button font size
          padding: '10px 20px', // Increased padding for a larger button
        }}
      >
        Login
      </Button>
    </Box>
  );
  
};

export default LoginForm;
