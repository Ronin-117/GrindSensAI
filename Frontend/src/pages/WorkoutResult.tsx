// filepath: (e.g., src/pages/WorkoutResult.tsx or src/components/WorkoutResult.tsx)
import React from 'react';

interface WorkoutResultItem {
  id: string;
  name: string;
  isCompleted: boolean; // true for tick (✓), false for cross (✗)
}

const WorkoutResult = () => {
  // Mock data based on your sketch
  const workoutItems: WorkoutResultItem[] = [
    { id: '1', name: 'cbcwvbcuiuwbviw', isCompleted: true },
    { id: '2', name: 'wbciicwiebcibe', isCompleted: true },
    { id: '3', name: 'qjncjqicbqibcqw', isCompleted: false },
  ];

  const totalScore = "75/100";

  // For the "HEAT: O O O" part.
  // We'll represent these as an array of 3, for now just for rendering count.
  const heatIndicatorsCount = 3;

  const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: {
      padding: '20px',
      fontFamily: 'sans-serif',
      maxWidth: '500px',
      margin: '0 auto',
      marginRight : "500px"
    },
    mainTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
    },
    contentRow: {
      display: 'flex',
      justifyContent: 'space-between', // Puts details left, score right
      alignItems: 'flex-start', // Align to top
      marginBottom: '30px',
    },
    detailsSection: {
      flex: 2, // Take more space
      marginRight: '20px', // Space between details and score
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 'normal',
      marginBottom: '10px',
      color: '#333',
    },
    workoutList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    workoutItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '5px 0',
      fontSize: '16px',
      color: '#333',
    },
    workoutName: {
      flexGrow: 1,
    },
    workoutStatus: {
      fontSize: '20px', // Make tick/cross prominent
      marginLeft: '10px', // Space between name and status
      width: '25px', // Fixed width for alignment
      textAlign: 'center',
      // The red color from your sketch is omitted as per "no color" request.
      // If you wanted red for '✗':
      // color: item.isCompleted ? 'black' : 'red',
    },
    scoreSection: {
      flex: 1, // Take less space
      textAlign: 'left', // Align text to the left within this section
    },
    scoreLabel: {
      fontSize: '18px',
      fontWeight: 'normal', // As "Total Score:" is not bold in sketch
      marginBottom: '5px',
      color: '#333',
    },
    scoreValue: {
      fontSize: '22px', // Larger score value
      fontWeight: 'bold',
      color: '#000',
    },
    heatSection: {
      marginTop: '30px',
      display: 'flex',
      alignItems: 'center',
    },
    heatLabel: {
      fontSize: '28px', // Large "HEAT" label as in sketch
      fontWeight: 'bold',
      marginRight: '15px',
      color: '#000', // Plain black
    },
    heatIndicatorContainer: {
      display: 'flex',
    },
    heatIndicator: {
      width: '30px', // Size of the circle
      height: '30px',
      border: '2px solid black', // Black border to make it look like an 'O'
      borderRadius: '50%', // Makes it a circle
      margin: '0 5px', // Space between circles
      // backgroundColor: 'transparent', // No fill
    },
  };

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.mainTitle}>Todays workout - result</h1>

      <div style={styles.contentRow}>
        <div style={styles.detailsSection}>
          <h2 style={styles.sectionTitle}>workout details</h2>
          <ul style={styles.workoutList}>
            {workoutItems.map(item => (
              <li key={item.id} style={styles.workoutItem}>
                <span style={styles.workoutName}>{item.name}</span>
                <span style={{
                    ...styles.workoutStatus,
                    // If you want to apply specific styles for ✓ vs ✗ without color:
                    // fontWeight: item.isCompleted ? 'bold' : 'normal',
                  }}
                >
                  {item.isCompleted ? '✓' : '✗'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div style={styles.scoreSection}>
          <div style={styles.scoreLabel}>Total Score:</div>
          <div style={styles.scoreValue}>{totalScore}</div>
        </div>
      </div>

      <div style={styles.heatSection}>
        <span style={styles.heatLabel}>HEAT:</span>
        <div style={styles.heatIndicatorContainer}>
          {Array.from({ length: heatIndicatorsCount }).map((_, index) => (
            <div key={index} style={styles.heatIndicator}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkoutResult;