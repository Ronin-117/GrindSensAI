# GrindSensAI - AI Personal Training Assistant

 <!-- Optional: Replace with a screenshot of your dashboard -->

**GrindSensAI** is a modern, full-stack web application designed to be your intelligent personal training partner. It leverages the power of Google's Gemini AI to generate personalized workout routines and provides real-time exercise form analysis and rep counting using your webcam, powered by MediaPipe.

This project is built with a **React/TypeScript frontend** for a dynamic and interactive user experience, and a **Django/Django REST Framework backend** for a robust and secure API.

---

## ✨ Core Features

*   **User-Specific Data**: Secure authentication (JWT) ensures that each user's dashboard, routines, and workout history are completely private.
*   **AI-Powered Workout Generation**: Users can interact with a prompt-based interface to ask for custom workout routines tailored to their goals. The backend uses Google's Gemini Pro to generate detailed, structured workout plans.
*   **Real-Time AI Supervision**:
    *   Utilizes **Mediapipe PoseLandmarker** directly in the browser for live pose estimation.
    *   Client-side algorithms analyze joint angles and body position to **count repetitions** for various exercises (curls, squats, shoulder presses, etc.).
    *   Provides a live camera feed with landmark overlays so users can monitor their form.
*   **Comprehensive Workout Management**:
    *   **Preset Routines**: A library of expertly designed routines available to all users.
    *   **Custom Routines**: Users can create, edit, save, and delete their own workout plans.
    *   **Routine Selection**: Users can select a routine as their "current plan" to track progress against.
*   **Progress Tracking & Analytics**:
    *   **Daily Workout Logging**: Automatically creates a log for each day's workout based on the selected routine.
    *   **GitHub-Style Contribution Graph**: A visual dashboard that displays workout completion and consistency over time.
    *   **"Heat Level" Metric**: A dynamic score calculated based on workout completion over the last 7 days, providing a quick glance at recent activity levels.

---

## 🛠️ Tech Stack

### Frontend
*   **React** (with TypeScript) - For building a modern, component-based user interface.
*   **React Router** - For client-side routing and navigation.
*   **Axios** - For making HTTP requests to the Django backend.
*   **MediaPipe Tasks Vision (`PoseLandmarker`)** - For high-performance, in-browser pose estimation.
*   **Vite** (or Create React App) - As the frontend build tool.

### Backend
*   **Python**
*   **Django** & **Django REST Framework (DRF)** - For building a powerful and secure RESTful API.
*   **Django Channels** - For real-time WebSocket communication (future implementation for backend rep counting).
*   **Simple JWT (djangorestframework-simplejwt)** - For JSON Web Token-based authentication.
*   **Google Generative AI SDK** - To connect with the Gemini API for workout generation.
*   **PostgreSQL / SQLite** - As the database.
*   **CORS Headers** - To handle cross-origin requests from the React frontend.

---

## 🚀 Getting Started

### Prerequisites
- Node.js and npm/yarn
- Python 3.11 and pip
- A virtual environment tool (like `venv` or `conda`)
- A Google Gemini API Key

### Backend Setup
1.  **Clone the repository:**
    ```bashi
    git clone https://github.com/Ronin-117/GrindSensAI
    cd GrindSensAI
    ```
2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```
3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set up environment variables:**
    *   Create a `.env` file in the `backend` directory.
    *   Add your Gemini API key:
        ```env
        GEMINI_API_KEY="your_google_gemini_api_key_here"
        ```
5.  **Run database migrations:**
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```
6.  **(Optional) Seed the database with preset routines:**
    ```bash
    python seed_presets.py # Assuming you have this script
    ```
7.  **Start the Django development server:**
    ```bash
    python manage.py runserver
    # The backend will be running on http://127.0.0.1:8000
    ```

### Frontend Setup
1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend # From the backend directory
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up environment variables:**
    *   Check `src/api.ts` (or `api.js`) and ensure the `API_BASE_URL` points to your running Django server (e.g., `http://127.0.0.1:8000/api`).
4.  **Start the React development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # The frontend will be running on http://localhost:5173 (or another port)
    ```

---

## 📖 Key Code Implementation Notes

### Frontend: The `PoseDetector` / `ExerciseSupervision` Component
-   **Challenge:** Managing state within a high-frequency `requestAnimationFrame` loop.
-   **Solution:** The component uses a combination of `useState` and `useRef`.
    -   `useState` is used for values that must trigger a UI re-render (e.g., status messages).
    -   `useRef` is used for internal logic state that needs to be updated and read synchronously without causing a re-render (e.g., `stage` and `repCounterRef`). This prevents stale state issues inside the loop.
-   **Lifecycle:** The component's lifecycle is controlled by an `isActive` prop passed from the parent. `useEffect` hooks manage the setup and teardown of the MediaPipe landmarker and the camera stream, ensuring resources are released correctly.

### Backend: `DailyLogGetOrCreateView`
-   This "smart" API endpoint is responsible for fetching a user's workout log for the current day.
-   If no log exists, it dynamically populates a new log instance with the correct exercises scheduled for that specific day based on the user's currently selected `TrainingRoutine`, then saves and returns it. This ensures the frontend always has the right starting point for a workout session.

---

## 📸 Screenshots

<!-- 
Add more screenshots of your application here to showcase its features!
Example:


-->
