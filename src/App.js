import { ThemeProvider } from "styled-components";
import Footer from "./Components/Footer.jsx";
import TypingBox from "./Components/TypingBox.jsx";
import UpperMenu from "./Components/UpperMenu.jsx";
import { GlobalStyles } from "./Styles/global.js";
import { useTheme } from "./Context/ThemeContext.jsx";

function App() {
  const {theme} = useTheme()
  return (
    <ThemeProvider theme={theme}>
    <div className="canvas">
      <GlobalStyles />
      <div>Header</div>
      <TypingBox/>
      <Footer/>
    </div>
    </ThemeProvider>
  );
}

export default App;
