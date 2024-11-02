import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import TableUserData from '../Components/TableUserData';
import Graph from '../Components/Graph';
import UserInfo from '../Components/UserInfo';
import { ReactComponent as Logo } from '../assets/Logo.svg'; 

function UserPage() {
  const [data, setData] = useState([]);
  const [user, loading] = useAuthState(auth);
  const [graphData, setGraphData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("User not logged in");
          return;
        }

        const userId = user.uid;
        let username = user.displayName; // Default to Google account displayName if available

        // If user signed up with email/password, fetch username from Firestore
        if (!username) {
          const userDocRef = doc(firestore, "users", userId);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            console.error("No such user document found!");
            return;
          }
          const userData = userDocSnap.data();
          username = userData.username;
        }

        console.log("Username:", username);
        const resultsRef = collection(firestore, "results");
        const q = query(resultsRef, where("userId", "==", userId));
        const resultsSnap = await getDocs(q);

        const resultsArray = resultsSnap.docs.map(doc => doc.data());
        console.log("Results:", resultsArray);

        const sortedResults = resultsArray.sort((a, b) => b.timeStamp.seconds - a.timeStamp.seconds);

        setData({ username, results: sortedResults });

        const tempGraphData = sortedResults.map(result => ({
          time: new Date(result.timeStamp.seconds * 1000).toLocaleString(), // Date and time
          wpm: result.wpm
        }));

        const sortedGraphData = tempGraphData.sort((a, b) => new Date(a.time) - new Date(b.time));

        const formattedGraphData = sortedGraphData.map(item => [item.time, item.wpm]);
        setGraphData(formattedGraphData);

      } catch (error) {
        console.error("Error fetching user data and results:", error);
      }
    };

    if (!loading) {
      fetchUserData();
    }

    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh' 
        }}>
            <CircularProgress style={{ width: '60px', height: '60px' }} /> 
        </div>
    );
}


  return (
    <div>
      <div className="canvas">
      <Logo className='logo' style={{width:"78px", height: "97px" ,cursor:"pointer"}} onClick={(e)=> navigate("/")}/> 
        <UserInfo data={data}/>
        <Graph graphData={graphData} type='date' />
        <TableUserData data={data} />
      </div>
    </div>
  );
}

export default UserPage;
