import React from 'react';
import ReactDOM from 'react-dom/client';
import './Styles/tokens.css';
import './Styles/ui.css';
import './Styles/avatar.css';
import './Styles/chat.css';
import './Styles/social.css';
import './Styles/pages.css';
import './Styles/race.css';
import './Styles/test.css';
import './Styles/features.css';
import App from './App';
import { TestModeContextProvider } from './Context/TestModeContext';
import { ThemeContextProvider } from './Context/ThemeContext';
import { AuthContextProvider } from './Context/AuthContext';
import { SettingsProvider } from './Context/SettingsContext';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Wrapping unconditionally is harmless even with no client ID configured --
// GoogleLogin just won't render/complete until one's set in .env.local.
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <GoogleOAuthProvider clientId={googleClientId || ''}>
    <ThemeContextProvider>
    <AuthContextProvider>
    <SettingsProvider>
    <TestModeContextProvider>
      <BrowserRouter>
    <App />
    </BrowserRouter>
    </TestModeContextProvider>
    </SettingsProvider>
    </AuthContextProvider>
    </ThemeContextProvider>
    </GoogleOAuthProvider>
);
