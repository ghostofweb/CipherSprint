import { AccountCircle } from '@mui/icons-material';
import React from 'react';
import { useTheme } from '../Context/ThemeContext';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';

function UserInfo({ data }) {
  const { theme } = useTheme();
  const [user] = useAuthState(auth); // Destructure the user from the array

  // Calculate total results from the results array
  const totalResults = data.results ? data.results.length : 0;

  return (
    <div className="user-profile" style={{ backgroundColor: theme.headerBackgroundColor, color: theme.textColor }}>
      <div className="user">
        <div className="picture">
          <AccountCircle style={{ fontSize: '200px', color: theme.textColor }} />
        </div>
        <div className="info">
          <div className="email">{data.username}</div>
          <div className="joined-at">
            {user ? new Date(user.metadata.creationTime).toLocaleString() : 'Not available'}
          </div>
        </div>
      </div>
      <div className="total-results">
        Total Test Taken - {totalResults}
      </div>
    </div>
  );
}

export default UserInfo;
