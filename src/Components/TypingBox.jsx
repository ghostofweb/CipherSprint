import { generate } from "random-words";
import UpperMenu from './UpperMenu.jsx';
import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { useTestMode } from "../Context/TestModeContext.jsx";
import Stats from "./Stats.jsx";
import { Replay } from "@mui/icons-material";

function TypingBox() {
    const inputRef = useRef(null);
    const replayButtonRef = useRef(null);
    const { testTime, testType, wordCount } = useTestMode();
    const [wordsArray, setWordsArray] = useState(() => generate(1000));
    const [intervalId, setIntervalId] = useState(null);
    const [countDown, setCountDown] = useState(testType === "time" ? testTime : 0);
    const [testStart, setTestStart] = useState(false);
    const [testEnd, setTestEnd] = useState(false);
    const [currWordIndex, setCurrWordIndex] = useState(0);
    const [currCharIndex, setCurrCharIndex] = useState(0);
    
    const [correctChars, setCorrectChars] = useState(0);
    const [incorrectChars, setIncorrectChars] = useState(0);
    const [missedChars, setMissedChars] = useState(0);
    const [extraChars, setExtraChars] = useState(0);
    const [correctWords, setCorrectWords] = useState(0);
    const [graphData, setGraphData] = useState([]);
    
    // State to track focus
    const [isInputFocused, setIsInputFocused] = useState(true);
    const [isReplayFocused, setIsReplayFocused] = useState(false); // New state

    const wordsSpanRef = useMemo(() => {
        return Array(wordsArray.length).fill(0).map(() => createRef(null));
    }, [wordsArray]);

    const startTimer = () => {
        const intervalId = setInterval(() => {
            setIntervalId(intervalId);
    
            setCountDown((prevCount) => {
                setCorrectChars((correctChars) => {
                    setGraphData((graphData) => {
                        return [
                            ...graphData,
                            [
                                testType === "time" ? testTime - prevCount + 1 : prevCount + 1,
                                (correctChars / 5) / ((testType === "time" ? testTime - prevCount + 1 : prevCount + 1) / 60)
                            ]
                        ];
                    });
                    return correctChars;
                });
    
                // Time-based test countdown logic
                if (testType === "time") {
                    if (prevCount === 1) {
                        setTestEnd(true);
                        clearInterval(intervalId);
                        return 0;
                    }
                    return prevCount - 1;
                }
    
                // Word-based test timer increment logic
                return prevCount + 1;
            });
        }, 1000);
    };
    

    const resetTest = () => {
        clearInterval(intervalId);
        setCountDown(testType === "time" ? testTime : 0);
        setCurrWordIndex(0);
        setCurrCharIndex(0);
        setTestStart(false);
        setTestEnd(false);
        if (testType === "time") {
            setWordsArray(generate(1000));            
        } else {
            setWordsArray(generate(wordCount + 1)); 
        }
        // Reset all calculation states to 0
        setCorrectChars(0);
        setIncorrectChars(0);
        setMissedChars(0);
        setExtraChars(0);
        setCorrectWords(0);
        setGraphData([]); // Reset graph data as well if necessary
    
        resetWordSpanRefClassname();
        focusInput();
    };

    const resetWordSpanRefClassname = () => {
        wordsSpanRef.forEach((wordRef) => {
            if (wordRef.current) {
                const originalChars = Array.from(wordRef.current.childNodes).slice(0, wordRef.current.dataset.wordLength);
                while (wordRef.current.lastChild && wordRef.current.childNodes.length > originalChars.length) {
                    wordRef.current.removeChild(wordRef.current.lastChild);
                }
                originalChars.forEach((child) => {
                    child.className = "";
                });
            }
        });
        wordsSpanRef[0]?.current?.childNodes[0]?.classList.add("current");
    };
  

    const handleUserInput = (e) => {
      if (!wordsSpanRef[currWordIndex]?.current) {
        return;
    }

    const allCurrChars = wordsSpanRef[currWordIndex].current.childNodes;
    const isAlphabet = /^[A-Za-z]$/.test(e.key);
    const isSpace = e.keyCode === 32; 

    if (!testStart && (isAlphabet||isSpace)) {
        startTimer();
        setTestStart(true);
    }
    if (testType === "words" && currWordIndex >= wordCount && currWordIndex.length - 1 ) {
        clearInterval(intervalId);
        setTestEnd(true);
    }

    // Handle space key
    if (e.keyCode === 32) {
        let correctCharsInWord = wordsSpanRef[currWordIndex].current.querySelectorAll(".correct");
        if (correctCharsInWord.length === allCurrChars.length) {
            setCorrectWords(correctWords + 1);
        }

        // If space is pressed at the start or in between, mark remaining characters as untyped
        if (currCharIndex === 0 || currCharIndex < allCurrChars.length) {
            for (let i = currCharIndex; i < allCurrChars.length; i++) {
                allCurrChars[i].classList.add("un-types");
            }
        }

        if (allCurrChars.length <= currCharIndex) {
            allCurrChars[currCharIndex - 1].classList.remove("current-right");
        } else {
            allCurrChars[currCharIndex].classList.remove("current");
            setMissedChars(missedChars + (allCurrChars.length - currCharIndex));
        }

        // Move to the next word
        const nextWordIndex = currWordIndex + 1;
        if (nextWordIndex < wordsSpanRef.length) {
            if (wordsSpanRef[nextWordIndex] && wordsSpanRef[nextWordIndex].current) {
                wordsSpanRef[nextWordIndex].current.childNodes[0].className = "current";
            }
        } else {
            // If the last word is reached, end the test
            setTestEnd(true);
            clearInterval(intervalId); // Stop the timer if necessary
            return; // Exit the function
        }

        setCurrWordIndex(nextWordIndex);
        setCurrCharIndex(0);
        // Scroll to keep the current word in view
        scrollToCurrent();
        return;
    }
  
      // Allow backspace
      if (e.keyCode === 8) {
          if (currCharIndex !== 0) {
              if (allCurrChars.length === currCharIndex) {
                  if (allCurrChars[currCharIndex - 1].className.includes("extra")) {
                      allCurrChars[currCharIndex - 1].remove();
                      allCurrChars[currCharIndex - 2].className += " current-right";
                  } else {
                      allCurrChars[currCharIndex - 1].className = "current";
                  }
                  setCurrCharIndex(currCharIndex - 1);
              } else {
                  allCurrChars[currCharIndex].className = "";
                  allCurrChars[currCharIndex - 1].className = "current";
                  setCurrCharIndex(currCharIndex - 1);
              }
          }
          return;
      }
  
      // Only allow alphabetic characters
      if (isAlphabet) {
          if (currCharIndex === allCurrChars.length) {
              let newSpan = document.createElement("span");
              newSpan.innerText = e.key;
              newSpan.className = "incorrect extra current-right";
              allCurrChars[currCharIndex - 1].classList.remove("current-right");
              wordsSpanRef[currWordIndex].current.append(newSpan);
              setCurrCharIndex(currCharIndex + 1);
              setExtraChars(extraChars + 1);
              return;
          }
  
          if (e.key === allCurrChars[currCharIndex].innerText) {
              allCurrChars[currCharIndex].className = "correct";
              setCorrectChars(correctChars + 1);
          } else {
              allCurrChars[currCharIndex].className = "incorrect";
              setIncorrectChars(incorrectChars + 1);
          }
  
          if (currCharIndex + 1 === allCurrChars.length) {
              allCurrChars[currCharIndex].className += " current-right";
          } else {
              allCurrChars[currCharIndex + 1].className = "current";
          }
  
          setCurrCharIndex(currCharIndex + 1);
          // Scroll to keep the cursor in view
          scrollToCurrent();
      }
  };
  
  
  // Scroll to the current character
  const scrollToCurrent = () => {
      const currentElement = wordsSpanRef[currWordIndex]?.current.childNodes[currCharIndex];
      if (currentElement) {
          const parentBox = document.querySelector('.type-box');
          if (currentElement.offsetTop < parentBox.scrollTop || 
              currentElement.offsetTop + currentElement.offsetHeight > parentBox.scrollTop + parentBox.clientHeight) {
              currentElement.scrollIntoView({ behavior: "auto", block: "nearest" });
          }
      }
  };
  
  
  const focusInput = () => {
    inputRef.current.focus();
};

    const calculateWPM = () => {
        return Math.round(correctChars / 5 / (testTime / 60));
    };

    const calculateAcc = () => {
        const totalTypedChars = correctChars + incorrectChars + missedChars + extraChars;
        return Math.round((correctChars / totalTypedChars) * 100);
    };



    useEffect(() => {
        resetTest();
        return () => clearInterval(intervalId);
    }, [testTime, wordCount, testType]);

    const handleFocus = () => {
      setIsInputFocused(true);
  };

  const handleBlur = () => {
      setIsInputFocused(false);
  };

  const handleReplayFocus = () => {
      setIsReplayFocused(true);
  };

  const handleReplayBlur = () => {
      setIsReplayFocused(false);
  };
  useEffect(() => {
    resetTest();
    return () => clearInterval(intervalId);
}, [testTime, wordCount, testType]);

useEffect(() => {
    focusInput();
    if (wordsSpanRef[0]?.current?.childNodes[0]) {
        wordsSpanRef[0].current.childNodes[0].className = "current";
    }
}, [wordsSpanRef]);
    // Handle keydown for replay button focus and game start
    const handleKeyDown = (e) => {
      // Prevent default tabbing behavior
      if (e.key === "Tab") {
          e.preventDefault(); 
          if (replayButtonRef.current) {
              replayButtonRef.current.focus(); // Focus the replay button
          }
      }
      
      // Only reset the test if Enter is pressed and the test has ended
      if (e.key === "Enter" && testEnd) {
        resetTest(); // Reset the game if the test has ended
    }
  };

     
    return (
        <div onKeyDown={handleKeyDown}>
            <UpperMenu countDown={countDown} />
            {testEnd ? (
                <Stats
                    wpm={calculateWPM()}
                    accuracy={calculateAcc()}
                    correctChars={correctChars}
                    incorrectChars={incorrectChars}
                    missedChars={missedChars}
                    extraChars={extraChars}
                    graphData={graphData}
                />
            ) : (
                <div className={`type-box`} onClick={focusInput}>
                    <div className='words'>
                        {wordsArray.map((word, index) => (
                            <span className='word' ref={wordsSpanRef[index]} key={index} data-word-length={word.length}>
                                {word.split('').map((char, charIndex) => (
                                    <span key={charIndex}>{char}</span>
                                ))}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            <div className="replay-container">
                <Replay
                    ref={replayButtonRef}
                    onClick={resetTest}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            resetTest();
                        }
                    }}
                    onFocus={handleReplayFocus} // Set focus handler
                    onBlur={handleReplayBlur} // Set blur handler
                    style={{ color: "inherit", cursor: "pointer", fontSize: "2rem" }}
                    tabIndex={0}
                    aria-label="Replay"
                />
                 <div style={{padding:"7px 10px"}}> Press <span style={{background:"grey", padding:"4px" ,borderRadius:"5px"}}>Tab</span> + <span style={{background:"grey", padding:"4px" ,borderRadius:"5px"}}>Enter</span> To Restart </div> 
            </div>
            <input
                type='text'
                onKeyDown={handleUserInput}
                className='hidden-input'
                ref={inputRef}
                aria-label="Typing input"
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
        </div>
    );
}

export default TypingBox;