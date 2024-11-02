import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { useTheme } from '../Context/ThemeContext';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

function TableUserData({ data = { results: [] } }) { // Set default value for data
  const { theme } = useTheme();
  const [wpmSortOrder, setWpmSortOrder] = useState('asc'); // Default sort order for WPM
  const [dateSortOrder, setDateSortOrder] = useState('asc'); // Default sort order for Date

  if (!data.results || data.results.length === 0) {
    return <div>No results available</div>;
  }

  // Sorting functions
  const sortedResults = [...data.results].sort((a, b) => {
    // Sort by WPM
    if (wpmSortOrder === 'asc') {
      return a.wpm - b.wpm;
    } else {
      return b.wpm - a.wpm;
    }
  });

  const sortedByDate = sortedResults.sort((a, b) => {
    const dateA = new Date(a.timeStamp.seconds * 1000);
    const dateB = new Date(b.timeStamp.seconds * 1000);
    return dateSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const styles = {
    table: {
      margin: '20px auto',
      width: '100%',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    header: {
      backgroundColor: theme.headerBackgroundColor || '#f5f5f5',
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
        backgroundColor: '#f1f1f1',
      },
    },
  };

  return (
    <div className="table">
      <TableContainer>
        <Table style={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell style={styles.header}>
                WPM
              </TableCell>
              <TableCell style={styles.header}>
                Accuracy
              </TableCell>
              <TableCell style={styles.header}>
                Characters
              </TableCell>
              <TableCell style={styles.header}>
                Date
                <IconButton onClick={() => setDateSortOrder(dateSortOrder === 'asc' ? 'desc' : 'asc')}>
                  {dateSortOrder === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
                </IconButton>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedByDate.map((result, index) => (
              <TableRow key={index} style={styles.row}>
                <TableCell style={styles.cell}>{result.wpm}</TableCell>
                <TableCell style={styles.cell}>{result.accuracy}</TableCell>
                <TableCell style={styles.cell}>{result.characters}</TableCell>
                <TableCell style={styles.cell}>
                  {new Date(result.timeStamp.seconds * 1000).toLocaleString()}
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
