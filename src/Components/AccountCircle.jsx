import React, { useState } from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { AppBar, Box, Modal, Tab, Tabs, Typography } from '@mui/material';
import { useTheme } from '../Context/ThemeContext'; 
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import GoogleButton from 'react-google-button';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Bounce, toast } from 'react-toastify';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from 'react-router-dom';

function AccountCircle() {
  const { theme } = useTheme();  
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(0);
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleValueChange = (e, v) => {
    setValue(v);
  };

  const handleModalOpen = () => {
    if(user){
      navigate("/user");
    } else {
      setOpen(true);
    }
  };

  const handleClose = () => setOpen(false);

  const googleProvider = new GoogleAuthProvider();

  const logout = async () => {
    try {
      await auth.signOut();
      toast.success(`Logout Successfully`, {
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
    } catch (error) {
      toast.error(`Couldn't Logout ${error}`, {
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

  const handleGoogleSign = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success(`Google Auth Successful`, {
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
      setOpen(false); // Close modal on successful sign-in
    } catch (error) {
      toast.error(`Something went wrong with Google Auth ${error.code}`, {
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
    <div>
      <Box display="flex" alignItems="center">
        <AccountCircleIcon
          fontSize="large"
          onClick={handleModalOpen}
          style={{ color: theme.textColor, cursor: 'pointer' }} 
        />
        {user && (
          <LogoutIcon
            onClick={logout}
            style={{
              marginLeft: '8px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          />
        )}
      </Box>
      <Modal
        open={open}
        onClose={handleClose}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
      >
        <div
          style={{
            width: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: theme.background,
            color: theme.textColor,
            borderRadius: '8px',
            boxShadow: '0px 4px 12px rgba(11, 11, 11, 0.2)',
            overflow: 'hidden',
          }}
        >
          <AppBar position="static" style={{ background: theme.background }}>
            <Tabs
              variant="fullWidth"
              value={value}
              onChange={handleValueChange}
              textColor="inherit"
              indicatorColor="secondary"
            >
              <Tab label="Login" style={{ color: theme.textColor }} />
              <Tab label="Signup" style={{ color: theme.textColor }} />
            </Tabs>
          </AppBar>
          <div style={{ padding: '16px' }}>
            {value === 0 && <LoginForm onSuccess={handleClose} />} {/* Pass onSuccess to LoginForm */}
            {value === 1 && <SignupForm onSuccess={handleClose} />} {/* Pass onSuccess to SignupForm */}
          </div>
          <Typography variant="body1" sx={{ display: "flex", justifyContent: "center" }}>Or</Typography>
          <Box sx={{ textAlign: 'center', padding: '16px', color: theme.textColor, justifyContent: "center", display: "flex" }}>
            <GoogleButton style={{ width: "100%" }} onClick={handleGoogleSign} />
          </Box>
        </div>
      </Modal>
    </div>
  );
}

export default AccountCircle;
