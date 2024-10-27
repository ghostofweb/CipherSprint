import {createContext, useState,useContext } from "react"

const testModeContext = createContext()

export const TestModeContextProvider = ({children})=>{
    const [testTime,setTestTime] = useState(12);

    const values = {
        testTime,
        setTestTime
    }

    return(<testModeContext.Provider value={values}>{children}</testModeContext.Provider>)
}

export const useTestMode = ()=>{
    useContext(testModeContext)
}