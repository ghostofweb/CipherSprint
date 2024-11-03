import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Button, Modal,Typography, Box, TextField } from '@mui/material';
import { toast, Bounce } from 'react-toastify';
import TableUserData from '../Components/TableUserData';
import Graph from '../Components/Graph';
import UserInfo from '../Components/UserInfo';
import { ReactComponent as Logo } from '../assets/Logo.svg';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Import arrow icon
import { useTheme } from '../Context/ThemeContext';

function UserPage() {
  const [data, setData] = useState(null);
  const [friendData, setFriendData] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [friendGraphData, setFriendGraphData] = useState([]);
  const [user, loading] = useAuthState(auth);
  const [open, setOpen] = useState(false); // Modal open state
  const [friendUsername, setFriendUsername] = useState('');
  const [value, setValue] = useState(0); // Tab value for login/signup
  const navigate = useNavigate();
  const theme = useTheme();
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

        const resultsRef = collection(firestore, "results");
        const q = query(resultsRef, where("userId", "==", userId));
        const resultsSnap = await getDocs(q);

        const resultsArray = resultsSnap.docs.map(doc => doc.data());
        const sortedResults = resultsArray.sort((a, b) => b.timeStamp.seconds - a.timeStamp.seconds);

        setData({ username, results: sortedResults });

        const tempGraphData = sortedResults.map(result => ({
          time: new Date(result.timeStamp.seconds * 1000).toLocaleString(),
          wpm: result.wpm
        }));

        const sortedGraphData = tempGraphData.sort((a, b) => new Date(a.time) - new Date(b.time));
        setGraphData(sortedGraphData.map(item => [item.time, item.wpm]));

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

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFriendUsername(''); // Reset friend username on close
  };

  const handleValueChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleCompareWithFriend = async () => {
    if (!friendUsername) {
      toast.warning('Please fill in the friend\'s username', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
      return;
    }

    try {
      const friendDocRef = collection(firestore, "users");
      const q = query(friendDocRef, where("username", "==", friendUsername));
      const friendDocSnap = await getDocs(q);

      if (!friendDocSnap.empty) {
        const friendUser = friendDocSnap.docs[0];
        const friendUserId = friendUser.id;

        const resultsRef = collection(firestore, "results");
        const resultsQuery = query(resultsRef, where("userId", "==", friendUserId));
        const resultsSnap = await getDocs(resultsQuery);

        const friendResultsArray = resultsSnap.docs.map(doc => doc.data());
        const sortedFriendResults = friendResultsArray.sort((a, b) => b.timeStamp.seconds - a.timeStamp.seconds);

        setFriendData({ username: friendUser.data().username, results: sortedFriendResults });

        const tempFriendGraphData = sortedFriendResults.map(result => ({
          time: new Date(result.timeStamp.seconds * 1000).toLocaleString(),
          wpm: result.wpm
        }));

        const sortedFriendGraphData = tempFriendGraphData.sort((a, b) => new Date(a.time) - new Date(b.time));
        setFriendGraphData(sortedFriendGraphData.map(item => [item.time, item.wpm]));
      } else {
        toast.warning('Friend not found!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Bounce,
        });
      }
    } catch (error) {
      console.error("Error fetching friend data:", error);
    } finally {
      handleClose();
    }
  };

  const handleBackToMyStats = () => {
    setFriendData(null);
    setFriendGraphData([]);
  };

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
            <Logo className='logo' sx={{ width: "78px", height: "97px", cursor: "pointer" }} onClick={() => navigate("/")} />

            {/* Only show Compare button if no friend data is available */}
            {!friendData && (
                <Button 
                    variant="contained"  
                    onClick={handleOpen}
                    sx={{ mb: 2, backgroundColor: theme.headerBackgroundColor, color: theme.textColor }}
                >
                    Compare with Friend
                </Button>
            )}

            {/* Go Back Button placed at the top when comparing with friend */}
            {friendData && (
                <Button 
                    variant="outlined" 
                    startIcon={<ArrowBackIcon />} 
                    onClick={handleBackToMyStats}
                    sx={{ mb: 1, color: theme.textColor, borderColor: theme.textColor }}
                >
                    Get Back
                </Button>
            )}

            {/* Render user's data and friend's data side by side if available */}
            {friendData ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, marginRight: '10px' }}>
                        <UserInfo data={data} />
                        <Graph graphData={graphData} type='date' />
                        <TableUserData data={data} />
                    </div>

                    <div style={{ flex: 1, marginLeft: '10px', borderLeft: '2px solid #ccc', paddingLeft: '10px' }}>
                        <UserInfo data={friendData} />
                        <Graph graphData={friendGraphData} type='date' />
                        <TableUserData data={friendData} />
                    </div>
                </div>
            ) : (
                data && (
                    <>
                        <UserInfo data={data} />
                        <Graph graphData={graphData} type='date' />
                        <TableUserData data={data} />
                    </>
                )
            )}

            {/* Modal for entering friend's username */}
            <Modal
    open={open}
    onClose={handleClose}
    sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}
>
    <div
        style={{
            width: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: theme.background,
            color: theme.textColor,
            borderRadius: '8px',
            boxShadow: '0px 4px 12px rgba(11, 11, 11, 0.2)',
            overflow: 'hidden',
            padding: '16px',
        }}
    >
        <Typography variant="h6" sx={{ color: theme.textColor }}>
            Enter Friend's Username
        </Typography>
        <TextField
            variant="outlined"
            value={friendUsername}
            onChange={(e) => setFriendUsername(e.target.value)}
            sx={{
                width: '100%',
                mb: 2,
                background: theme.background, // Ensure it blends well with the modal background
                color: theme.textColor
            }}
            placeholder="Friend's username"
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
                variant="contained"
                onClick={handleCompareWithFriend}
                sx={{
                    backgroundColor: theme.headerBackgroundColor,
                    color: theme.textColor,
                    flex: 1, // Ensure buttons take equal space
                }}
            >
                Compare
            </Button>
            <Button
                variant="outlined"
                onClick={handleClose}
                sx={{
                    color: theme.textColor,
                    borderColor: theme.textColor,
                    marginLeft: '8px', // Add space between buttons
                }}
            >
                Cancel
            </Button>
        </Box>
    </div>
</Modal>

        </div>
    </div>
);
}
export default UserPage;