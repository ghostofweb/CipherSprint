import {createContext, useState,useContext } from "react"

const testModeContext = createContext()

export const TestModeContextProvider = ({children})=>{
    const [testTime,setTestTime] = useState(2);

    const values = {
        testTime,
        setTestTime
    }

    return(<testModeContext.Provider value={values}>{children}</testModeContext.Provider>)
}

export const useTestMode = ()=>{
    return useContext(testModeContext)
}