import { createContext, useContext, useState } from "react";
import { themeOptions } from "../Utils/themeOptions";

const themeContext = createContext();
export const ThemeContextProvider = ({children})=>{
    
const [theme,setTheme] = useState(themeOptions[0].value)
        const values = {
            theme,
            setTheme
        }

        return(
        <themeContext.Provider value={values}>{children}</themeContext.Provider>
    )
}

export const useTheme = ()=>{
     return useContext(themeContext)
}