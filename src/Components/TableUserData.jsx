import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useTheme } from '../Context/ThemeContext';

function TableUserData({ data = { results: [] } }) { // Set default value for data
  const { theme } = useTheme();

  if (!data.results || data.results.length === 0) {
    return <div>No results available</div>;
  }

  const styles = {
    table: {
      margin: '20px auto',
      width: '100%',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    header: {
      backgroundColor: theme.headerBackgroundColor|| '#f5f5f5', // Light grey background for headers
      color: theme.textColor,
      textAlign: "center",
      fontWeight: 'bold',
    },
    cell: {
      color: theme.textColor,
      textAlign: "center",
      padding: '12px',
    },
    row: {
      '&:hover': {
        backgroundColor: '#f1f1f1', // Light grey hover effect
      },
    },
  };

  return (
    <div className="table">
      <TableContainer>
        <Table style={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell style={styles.header}>WPM</TableCell>
              <TableCell style={styles.header}>Accuracy</TableCell>
              <TableCell style={styles.header}>Characters</TableCell>
              <TableCell style={styles.header}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.results.map((result, index) => (
              <TableRow key={index} style={styles.row}>
                <TableCell style={styles.cell}>{result.wpm}</TableCell>
                <TableCell style={styles.cell}>{result.accuracy}</TableCell>
                <TableCell style={styles.cell}>{result.characters}</TableCell>
                <TableCell style={styles.cell}>
                  {new Date(result.timeStamp.seconds * 1000).toLocaleString()} {/* Converting timestamp to date */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default TableUserData;
