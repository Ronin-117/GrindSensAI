import React from 'react';

// Mock data for routines
const mockRoutines = [
  { id: '1', name: 'Routine 1' },
  { id: '2', name: 'Routine 2' },
  { id: '3', name: 'Routine 3' },
  // Add more routines here if needed
];

const EvaluateWorkout = () => {
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      padding: '20px',
      fontFamily: 'sans-serif', // Plain font
      marginRight : '500px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px', // Space below header
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      margin: 0, // Remove default h1 margin
    },
    createButton: {
      fontSize: '16px',
      padding: '8px 12px',
      border: '1px solid black',
      background: 'transparent',
      cursor: 'pointer',
      borderRadius: '4px', // Slight rounding, common for buttons
    },
    routineListContainer: {
      // This div just holds the list of routines
    },
    routineItemRow: { // Each row containing a routine name and an edit button
      display: 'flex',
      alignItems: 'center', // Vertically align items in the row
      marginBottom: '15px', // Space between routine rows
    },
    routineNameBox: {
      padding: '10px 18px', // Padding for the routine name
      border: '1px solid black',
      borderRadius: '8px', // Rounded corners as in sketch
      fontSize: '16px',
      marginRight: '15px', // Space between routine name box and edit button
      // backgroundColor: 'transparent', // Default
      minWidth: '120px', // Give it some base width
      textAlign: 'center', // Center text in the box if desired
    },
    editButton: {
      padding: '10px 15px', // Padding for the edit button
      border: '1px solid black',
      borderRadius: '8px', // Rounded corners as in sketch
      background: 'transparent',
      cursor: 'pointer',
      display: 'flex', // To align text and icon inside the button
      alignItems: 'center',
      fontSize: '16px',
    },
    pencilIcon: {
      marginLeft: '8px', // Space between "Edit" text and pencil icon
      fontSize: '14px', // Slightly smaller or same size as button text
    },
    ellipsisBox: { // For the ".." item
      padding: '10px 18px',
      border: '1px solid black',
      borderRadius: '8px',
      fontSize: '16px',
      color: '#333', // Slightly dimmer for ".."
      textAlign: 'left', // Or 'center' if preferred
      display: 'inline-block', // So it doesn't take full width unless content pushes it
      minWidth: '120px', // Similar to routineNameBox
    },
  };

  // --- Event Handlers (Placeholder) ---
  const handleCreateRoutine = () => {
    console.log('Create new routine clicked');
    // Add logic to navigate to a creation form or open a modal
  };

  const handleEditRoutine = (routineId: string, routineName: string) => {
    console.log(`Edit clicked for routine: ${routineName} (ID: ${routineId})`);
    // Add logic to navigate to an edit form or open a modal
  };

  const handleRoutineNameClick = (routineName: string) => {
    console.log(`Routine name clicked: ${routineName}`);
    // Add logic to view routine details
  };


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Workout Routines</h1>
        <button style={styles.createButton} onClick={handleCreateRoutine}>
          create +
        </button>
      </div>

      <div style={styles.routineListContainer}>
        {mockRoutines.map((routine) => (
          <div key={routine.id} style={styles.routineItemRow}>
            <div
              style={styles.routineNameBox}
              onClick={() => handleRoutineNameClick(routine.name)} // Optional: make name box clickable
              // role="button" // For accessibility if it's clickable
              // tabIndex={0} // For accessibility if it's clickable
            >
              {routine.name}
            </div>
            <button
              style={styles.editButton}
              onClick={() => handleEditRoutine(routine.id, routine.name)}
            >
              Edit
              <span style={styles.pencilIcon}>✏️</span> {/* Unicode pencil icon */}
            </button>
          </div>
        ))}

        {/* The ".." item from the sketch */}
        <div style={styles.routineItemRow}> {/* Placed in a row for consistent margin */}
            <div style={styles.ellipsisBox}>
            ..
            </div>
            {/* No edit button for the ".." item as per sketch */}
        </div>
      </div>
    </div>
  );
};

export default EvaluateWorkout;