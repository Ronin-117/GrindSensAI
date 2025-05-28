// filepath: (e.g., src/pages/WorkoutMod.tsx or src/components/WorkoutMod.tsx)
import React, { useState } from 'react';

const WorkoutMod = () => {
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [workoutDetails, setWorkoutDetails] = useState<string[]>([
    'cbcwvbcuiuwbviw',
    'wbciicwiebcibe',
    'qjncjqicbqibcqw',
  ]); // Initial placeholder data based on your image

  const handlePromptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserPrompt(event.target.value);
  };

  const handleSubmitPrompt = () => {
    console.log('User prompt submitted:', userPrompt);
    // In a real application, you might:
    // 1. Send the userPrompt to a backend or an AI service.
    // 2. Receive new/modified workout details.
    // 3. Update the `workoutDetails` state with the response.
    // For this example, let's just log and maybe add the prompt to the list if it's not empty.
    if (userPrompt.trim() !== '') {
      // Example: setWorkoutDetails(prevDetails => [...prevDetails, `Generated from: ${userPrompt}`]);
      // setUserPrompt(''); // Optionally clear the prompt
    }
    alert(`Prompt submitted: "${userPrompt}"\n(Check console for details)`);
  };

  const handleSaveWorkout = () => {
    console.log('Saving workout details:', workoutDetails);
    // In a real application, you would:
    // 1. Send the `workoutDetails` array to a backend API to save it.
    // 2. Or save it to local storage.
    alert('Workout details saved!\n(Check console for details)');
  };

  const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: {
      padding: '20px',
      fontFamily: 'sans-serif',
      maxWidth: '500px', // To keep it reasonably narrow like the sketch
      margin: '0 auto', // Center the component on a wider page
      marginRight: '500px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '25px', // Space below title
    },
    promptSection: {
      display: 'flex',
      alignItems: 'center', // Align label, input, and button vertically
      marginBottom: '25px', // Space below prompt section
    },
    promptLabel: {
      marginRight: '10px',
      fontSize: '16px',
      whiteSpace: 'nowrap', // Prevent "user prompt:" from wrapping
    },
    promptInput: {
      flexGrow: 1, // Allow textbox to take available horizontal space
      padding: '8px 10px',
      border: '1px solid black', // Plain border
      marginRight: '10px', // Space between input and submit button
      fontSize: '16px',
    },
    submitButton: {
      padding: '8px 15px',
      border: '1px solid black', // Plain border
      background: 'transparent', // No background color
      cursor: 'pointer',
      fontSize: '16px',
      whiteSpace: 'nowrap',
    },
    detailsSection: {
      marginBottom: '25px', // Space below details section
    },
    detailsTitle: {
      fontSize: '18px',
      marginBottom: '10px',
      color: '#333', // Slightly softer than pure black for subheadings
    },
    detailsList: {
      listStyle: 'none', // Remove default bullet points
      padding: 0,
      margin: 0,
    },
    detailItem: {
      padding: '6px 0', // Vertical padding for each item
      fontSize: '16px',
      borderBottom: '1px solid #eee', // Light separator line
      color: '#333',
    },
    saveButtonContainer: {
      display: 'flex',
      justifyContent: 'flex-end', // Align save button to the right
      marginTop: '20px', // Space above the save button
    },
    saveButton: {
      padding: '10px 20px',
      border: '1px solid black', // Plain border
      background: 'transparent', // No background color
      cursor: 'pointer',
      fontSize: '16px',
    },
  };

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.title}>Workout Mod</h1>

      <div style={styles.promptSection}>
        <label htmlFor="userPromptInput" style={styles.promptLabel}>
          user prompt:
        </label>
        <input
          type="text"
          id="userPromptInput"
          value={userPrompt}
          onChange={handlePromptChange}
          style={styles.promptInput}
          placeholder="e.g., 3 sets of push-ups"
        />
        <button onClick={handleSubmitPrompt} style={styles.submitButton}>
          submit
        </button>
      </div>

      <div style={styles.detailsSection}>
        <h2 style={styles.detailsTitle}>workout details</h2>
        {workoutDetails.length > 0 ? (
          <ul style={styles.detailsList}>
            {workoutDetails.map((detail, index) => (
              <li key={index} style={styles.detailItem}>
                {detail}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#555' }}>No workout details yet. Enter a prompt and submit.</p>
        )}
      </div>

      <div style={styles.saveButtonContainer}>
        <button onClick={handleSaveWorkout} style={styles.saveButton}>
          save
        </button>
      </div>
    </div>
  );
};

export default WorkoutMod;