import React from 'react';

interface WorkoutResultItem {
  id: string;
  name: string;
  isCompleted: boolean;
}

const WorkoutResult = () => {
  const workoutItems: WorkoutResultItem[] = [
    { id: '1', name: 'cbcwvbcuiuwbviw', isCompleted: true },
    { id: '2', name: 'wbciicwiebcibe', isCompleted: true },
    { id: '3', name: 'qjncjqicbqibcqw', isCompleted: false },
  ];

  const totalScore = "75/100";

  const heatIndicatorsCount = 3;

  const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: {
      padding: '20px',
      fontFamily: 'sans-serif',
      maxWidth: '500px',
      margin: '0 auto',
    },
    mainTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
    },
    contentRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start', 
      marginBottom: '30px',
    },
    detailsSection: {
      flex: 2, 
      marginRight: '20px',
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
      fontSize: '20px', 
      marginLeft: '10px', 
      width: '25px', 
      textAlign: 'center',
    },
    scoreSection: {
      flex: 1, 
      textAlign: 'left', 
    },
    scoreLabel: {
      fontSize: '18px',
      fontWeight: 'normal', 
      marginBottom: '5px',
      color: '#333',
    },
    scoreValue: {
      fontSize: '22px', 
      fontWeight: 'bold',
      color: '#000',
    },
    heatSection: {
      marginTop: '30px',
      display: 'flex',
      alignItems: 'center',
    },
    heatLabel: {
      fontSize: '28px', 
      fontWeight: 'bold',
      marginRight: '15px',
      color: '#000',
    },
    heatIndicatorContainer: {
      display: 'flex',
    },
    heatIndicator: {
      width: '30px', 
      height: '30px',
      border: '2px solid black',
      borderRadius: '50%', 
      margin: '0 5px',
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