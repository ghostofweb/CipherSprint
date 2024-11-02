import { ThemeProvider } from "styled-components";
import Footer from "./Components/Footer.jsx";
import TypingBox from "./Components/TypingBox.jsx";
import UpperMenu from "./Components/UpperMenu.jsx";
import { GlobalStyles } from "./Styles/global.js";
import { useTheme } from "./Context/ThemeContext.jsx";
import Header from "./Components/Header.jsx";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { Route, Routes } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import UserPage from "./Pages/UserPage.jsx";

function App() {
  const {theme} = useTheme()
  return (
    <ThemeProvider theme={theme}>
      <ToastContainer/>
      <GlobalStyles />
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/user" element={<UserPage/>}/>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
