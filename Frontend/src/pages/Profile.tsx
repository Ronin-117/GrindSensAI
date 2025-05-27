// filepath: src/pages/Profile.tsx (or your chosen path)
import React from 'react';

const Profile = () => {
  // Mock user data
  const userData = {
    name: 'Alex Doe',
    age: 30,
    height: '175 cm', // Data uses correct spelling
    weight: '70 kg',  // Data uses correct spelling
    heatLevel: 7,     // Example heat level (out of 10)
  };

  const maxHeatSymbols = 10; // To show heat level out of 10

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      padding: '20px',
      fontFamily: 'sans-serif', // Plain font
      display: 'flex',
      flexDirection: 'column',
      // Content will be left-aligned by default, matching sketch's general layout
    },
    pageTitle: {
      fontSize: '32px', // Large title as in sketch
      fontWeight: 'bold',
      margin: '0 0 25px 0', // Space below title
      // textAlign: 'left', // Default
    },
    profileSection: {
      display: 'flex',
      alignItems: 'flex-start', // Align icon top with details top
      marginBottom: '30px', // Space before HEAT section
    },
    profileIconPlaceholder: {
      width: '80px', // Size based on sketch proportion
      height: '80px',
      borderRadius: '50%', // Circular icon
      border: '2px solid black', // Plain border
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '40px', // Size for the placeholder person symbol
      marginRight: '25px', // Space between icon and details
      flexShrink: 0, // Prevent icon from shrinking
    },
    userDetails: {
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '5px', // Slight adjustment to vertically align text with icon center
    },
    detailItem: {
      fontSize: '18px', // Font size for user details
      lineHeight: '1.6', // Spacing between detail lines, mimicking sketch
      // Values are directly appended to the labels as per simplified sketch rendering
    },
    heatSection: {
      marginTop: '10px', // Space above HEAT section
      // textAlign: 'left', // Default
    },
    heatLabel: {
      fontSize: '20px', // "HEAT:" text size
      fontWeight: 'bold', // "HEAT:" appears bolder in sketch
      marginRight: '10px',
      display: 'inline-block', // To sit next to symbols
    },
    heatSymbolsContainer: {
      display: 'inline-block', // Keep symbols on the same line as label
    },
    heatSymbol: {
      fontSize: '24px', // Size of the circle symbols (●/○)
      margin: '0 2px', // Small spacing between symbols
      lineHeight: '1',   // Helps align symbols neatly with the "HEAT:" text
    },
  };

  // Generate heat symbols (filled and empty circles)
  const heatSymbolsDisplay = [];
  for (let i = 0; i < maxHeatSymbols; i++) {
    heatSymbolsDisplay.push(
      <span key={i} style={styles.heatSymbol}>
        {i < userData.heatLevel ? '●' : '○'} {/* ● for filled, ○ for empty */}
      </span>
    );
  }
  // The "O O G" in the sketch is interpreted as a conceptual representation.
  // "out of 10" implies 10 symbols for clarity.

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Profile</h1>

      <div style={styles.profileSection}>
        <div style={styles.profileIconPlaceholder}>
          👤 {/* Unicode person symbol as a placeholder */}
        </div>
        <div style={styles.userDetails}>
          {/* Displaying details as "Label Value" on each line */}
          <div style={styles.detailItem}>Name {userData.name}</div>
          <div style={styles.detailItem}>Age {userData.age}</div>
          {/* Using "hight" and "wieght" as labels to match the sketch's text */}
          <div style={styles.detailItem}>hight {userData.height}</div>
          <div style={styles.detailItem}>wieght {userData.weight}</div>
        </div>
      </div>

      <div style={styles.heatSection}>
        <span style={styles.heatLabel}>HEAT:</span>
        <div style={styles.heatSymbolsContainer}>
          {heatSymbolsDisplay}
        </div>
      </div>
    </div>
  );
};

export default Profile;