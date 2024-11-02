import React, { useEffect } from 'react';
import Graph from './Graph';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Firestore instance
import { getAuth } from 'firebase/auth'; // Firebase Auth
import { Bounce, toast } from 'react-toastify';

function Stats({
    wpm,
    accuracy,
    correctChars,
    incorrectChars,
    missedChars,
    extraChars,
    graphData
}) {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    // Ensure values are valid numbers
    const safeWpm = isNaN(wpm) ? 0 : wpm; // Default to 0 if NaN
    const safeAccuracy = isNaN(accuracy) ? 0 : accuracy; // Default to 0 if NaN

    // Filter graphData for unique time entries
    let timeSet = new Set();
    const newGraph = graphData.filter(i => {
        if (!timeSet.has(i[0])) {
            timeSet.add(i[0]);
            return i;
        }
        return null;
    });

    // Save data to Firestore in the "results" collection
    const pushDatatoDb = async () => {
        if (isNaN(safeAccuracy)) {
            toast.warning('Invalid test', {
                position: 'top-right',
                autoClose: 5000,
                theme: 'dark',
                transition: Bounce,
            });
            return;
        }
        if (currentUser) {
            try {
                await addDoc(collection(firestore, 'results'), {
                    userId: currentUser.uid, // Link result to the logged-in user
                    wpm: safeWpm,
                    accuracy: safeAccuracy,
                    timeStamp: new Date(),
                    characters: `${correctChars}/${incorrectChars}/${missedChars}/${extraChars}`,
                });
                toast.success('Successfully saved!', {
                    position: 'top-right',
                    autoClose: 5000,
                    theme: 'dark',
                    transition: Bounce,
                });
            } catch (error) {
                console.log(error);
                toast.error("Couldn't save the data", {
                    position: 'top-right',
                    autoClose: 5000,
                    theme: 'dark',
                    transition: Bounce,
                });
            }
        } else {
            toast.warning('Please log in first', {
                position: 'top-right',
                autoClose: 5000,
                theme: 'dark',
                transition: Bounce,
            });
        }
    };

    useEffect(() => {
        if (safeWpm && safeAccuracy && currentUser) { // Only save if there are valid stats and a logged-in user
            pushDatatoDb();
        } else if (!currentUser) {
            toast.error('Please log in', {
                position: 'top-right',
                autoClose: 5000,
                theme: 'dark',
                transition: Bounce,
            });
        }
    }, [safeWpm, safeAccuracy, currentUser]); // Depend on stats and user status

    return (
        <div className="stats-box">
            <div className="left-stats">
                <div className="title">WPM</div>
                <div className="subtitle">{safeWpm}</div>
                <div className="title">Accuracy</div>
                <div className="subtitle">{safeAccuracy}</div>
                <div className="title">Characters</div>
                <div className="subtitle">
                    {correctChars}/{incorrectChars}/{missedChars}/{extraChars}
                </div>
            </div>
            <div className="right-stats">
                <Graph graphData={newGraph} />
            </div>
        </div>
    );
}

export default Stats;
