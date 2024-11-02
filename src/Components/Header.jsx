// src/Header.js
import React from 'react';
import AccountCircle from './AccountCircle';
import { useTheme } from '@emotion/react';
import { ReactComponent as Logo } from '../assets/Logo.svg'; // Ensure the logo is imported correctly

function Header() {
  const theme = useTheme();
  
  const handleLogoClick = () => {
    window.location.reload(); // Refresh the entire website
  };

  return (
    <div className="header" style={{ background: theme.background, color: theme.textColor, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div 
        className="logo-section" 
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} 
        onClick={handleLogoClick}
      >
        <Logo className='logo' style={{width:"78px", height: "97px" }} /> {/* Adjust size here */}
        <h1 style={{ marginLeft: '10px', color: theme.textColor, fontSize: '24px' }}>Monkeyfight</h1> {/* Adjust font size if needed */}
      </div>
      <div className="user-icon">
        <AccountCircle style={{ fontSize: '2em', color: theme.textColor }} />
      </div>
    </div>
  );
}

export default Header;
