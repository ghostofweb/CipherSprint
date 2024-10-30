import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { TestModeContextProvider } from './Context/TestModeContext.jsx';
import { ThemeContextProvider } from './Context/ThemeContext.jsx';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeContextProvider>
    <TestModeContextProvider>
    <App />
    </TestModeContextProvider>
    </ThemeContextProvider>
  </React.StrictMode>
);
