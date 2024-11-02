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


function AccountCircle() {
  const { theme } = useTheme();  
  const [ open , setOpen] = useState(false);
  const [ value , setValue] = useState(0);

  const handleValueChange = (e, v) => {
    setValue(v);
  };
  const handleModalOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const googleProvider = new GoogleAuthProvider();

  const handleGoogleSign = async ()=>{
    try {
      await signInWithPopup(auth,googleProvider)
      toast.success(`Google Auth Successfull`,{
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
      toast.error(`something went wrong with google auth ${error.code}`, {
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
  }
  return (
    <div>
      <AccountCircleIcon
        fontSize="large"
        onClick={handleModalOpen}
        style={{ color: theme.textColor, cursor: 'pointer' }} // Added cursor pointer for better UX
      />
      <Modal
        open={open}
        onClose={handleClose}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)' // Slightly more opaque background
        }}
      >
        <div
          style={{
            width: '400px',
            maxHeight: '90vh', // Limit the height of the modal
            overflowY: 'auto', // Enable vertical scrolling if needed
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
            {value === 0 && <LoginForm />}
            {value === 1 && <SignupForm />}
          </div>
          <Typography variant="body1" sx={{display:"flex",justifyContent:"center"}}>Or</Typography>
          <Box sx={{ textAlign: 'center', padding: '16px', color: theme.textColor ,justifyContent:"center", display:"flex"}}>
            <GoogleButton style={{width:"100%"}} 
              onClick={handleGoogleSign} 
            />
          </Box>
        </div>
      </Modal>
    </div>
  );
}

export default AccountCircle;
