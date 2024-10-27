import TypingBox from "./Components/TypingBox.jsx";
import UpperMenu from "./Components/UpperMenu.jsx";
import { GlobalStyles } from "./Styles/global.js";

function App() {
  return (
    
    <div className="canvas">
      <GlobalStyles />
      <div>Header</div>
      <TypingBox/>
      <div>Footer</div>
    </div>
  );
}

export default App;
