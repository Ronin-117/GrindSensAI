// filepath: c:\Users\njne2\Desktop\Cuda_PWR\CREATIVE\GrindSensAI\Frontend\src\pages\Dashboard.tsx
import React from 'react';

const Dashboard = () => {
  const motivationalQuote = "\"The body achieves what the mind believes. Go for it!\"";

  // Grid dimensions based on the sketch (approx. 2 rows, 10 columns)
  const gridRows = 2;
  const gridCols = 10;

  // Mock data for the calendar grid
  // '✓' for completed, '✗' for missed/failed, ' ' (space) for not yet recorded or n/a
  const activityData: string[][] = [];
  const symbols = ['✓', '✗', ' ']; // Space ensures cell doesn't collapse if empty

  // Generate some random data for the grid
  for (let i = 0; i < gridRows; i++) {
    const row: string[] = [];
    for (let j = 0; j < gridCols; j++) {
      const rand = Math.random();
      if (rand < 0.45) row.push('✓'); // More ticks
      else if (rand < 0.9) row.push('✗'); // Some crosses
      else row.push(' '); // Few empty
    }
    activityData.push(row);
  }

  // To mimic the "X X M" from your sketch (interpreting M as a ✓)
  if (activityData.length > 0 && activityData[0].length >= 3) {
    activityData[0][0] = '✗';
    activityData[0][1] = '✗';
    activityData[0][2] = '✓'; // Assuming 'M' could mean 'Marked' or 'Milestone' -> represented by a tick
  }

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      padding: '20px',
      fontFamily: 'sans-serif', // Plain font
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', 
      marginRight: '500px',
    },
    title: {
      fontSize: '32px', // Larger font for title as in sketch
      fontWeight: 'bold',
      margin: '0 0 10px 0', // Remove default h1 margins for better control
      textAlign: 'center',
    },
    quote: {
      fontStyle: 'italic',
      textAlign: 'center',
      margin: '15px 0 25px 0', // Spacing around the quote
      padding: '0 10%', // Prevent quote from being too wide
      maxWidth: '600px', // Max width for readability
    },
    calendarGridContainer: {
      marginBottom: '20px',
      border: '1px solid black', // Outer border for the grid container
      padding: '5px', // Padding around the grid cells
      display: 'inline-block', // To make it wrap its content tightly
    },
    calendarGrid: {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridCols}, 30px)`, // Adjust cell size as needed
      gap: '3px', // Gap between cells
    },
    calendarCell: {
      border: '1px solid black', // Border for each cell
      width: '30px',  // Square cells
      height: '30px', // Square cells
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px', // Size of tick/cross
      fontWeight: 'bold',
    },
    buttonContainer: {
      marginTop: '20px',
      textAlign: 'center', // Center buttons
    },
    button: {
      margin: '0 8px', // Margin between buttons
      padding: '10px 15px',
      border: '1px solid black', // Plain border
      background: 'transparent', // No background color
      cursor: 'pointer',
      fontSize: '14px',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>

      <p style={styles.quote}>{motivationalQuote}</p>

      <div style={styles.calendarGridContainer}>
        <div style={styles.calendarGrid}>
          {activityData.flat().map((status, index) => (
            <div key={index} style={styles.calendarCell}>
              {status}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.buttonContainer}>
        <button style={styles.button}>Action 1</button>
        <button style={styles.button}>Action 2</button>
        <button style={styles.button}>Action 3</button>
        <button style={styles.button}>Action 4</button>
      </div>
    </div>
  );
};

export default Dashboard;