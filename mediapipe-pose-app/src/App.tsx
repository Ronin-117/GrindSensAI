// src/App.tsx
import './App.css';
import PoseDetector from './PoseDetector';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Mediapipe Pose Detection (New API)</h1>
      </header>
      <main>
        <PoseDetector />
      </main>
    </div>
  );
}

export default App;