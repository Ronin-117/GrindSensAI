import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkoutContributionsApi } from './api';
import './Dashboard.css'; // Import the new stylesheet

interface ContributionData {
  date: string; // 'YYYY-MM-DD'
  completion_percentage: number;
}

const MOTIVATIONAL_QUOTES = [ /* Your quotes array remains the same */
  "The body achieves what the mind believes. Go for it!", "The only bad workout is the one that didn't happen.", "Success isn't always about greatness. It's about consistency. Consistent hard work leads to success.", "Sweat is just fat crying. Make it weep.", "Don't limit your challenges. Challenge your limits.", "The last three or four reps is what makes the muscle grow. This area of pain divides a champion from someone who is not a champion.", "Train insane or remain the same.", "Strive for progress, not perfection.", "Your body can stand almost anything. It's your mind that you have to convince.", "Strength does not come from winning. Your struggles develop your strengths.", "The pain you feel today will be the strength you feel tomorrow.", "No matter how slow you go, you are still lapping everybody on the couch.", "The difference between try and triumph is a little umph.", "It's going to be a journey. It's not a sprint to get in shape.", "When you feel like stopping, think about why you started.", "The clock is ticking. Are you becoming the person you want to be?", "Discipline is the bridge between goals and accomplishment.", "Push yourself because no one else is going to do it for you.", "Your only limit is you.", "Wake up with determination. Go to bed with satisfaction.", "Do something today that your future self will thank you for.", "It never gets easier, you just get stronger.", "The harder the battle, the sweeter the victory.", "Excuses don't burn calories.", "Be stronger than your excuses.", "A one-hour workout is 4% of your day. No excuses.", "The gym is a battlefield. Your body is your weapon. Go to war.", "Obsessed is a word the lazy use to describe the dedicated.", "Fall in love with taking care of your body.", "Fitness is not about being better than someone else. It's about being better than you used to be.", "The real workout starts when you want to stop.", "Sore today, strong tomorrow.", "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.", "You don't have to be extreme, just consistent.", "Make sweat your best accessory.", "Hustle for that muscle.", "If it doesn't challenge you, it doesn't change you.", "Doubt me, hate me, you're the inspiration I need.", "The body is like a machine, and the gym is where you go for a tune-up.", "Champions are made in the hours no one is watching.", "Pain is temporary. Quitting lasts forever.", "Get comfortable with being uncomfortable.", "Every drop of sweat is a step towards your goal.", "Don't wish for a good body, work for it.", "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle. As with all matters of the heart, you'll know when you find it."
];

const WEEKS_TO_SHOW = 30;

const Dashboard: React.FC = () => {
  const [contributions, setContributions] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [motivationalQuote, setMotivationalQuote] = useState<string>('');
  const [tooltip, setTooltip] = useState<{ visible: boolean; content: string; x: number; y: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Select a random quote on mount
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setMotivationalQuote(MOTIVATIONAL_QUOTES[randomIndex]);

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getWorkoutContributionsApi();
        const dataMap = (response.data as ContributionData[]).reduce((acc, log) => {
          acc[log.date] = log.completion_percentage;
          return acc;
        }, {} as Record<string, number>);
        setContributions(dataMap);
      } catch (err: any) {
        console.error("Failed to fetch contribution data:", err);
        setError("Could not load workout data. Please log in again.");
        if (err.response && err.response.status === 401) {
          setTimeout(() => navigate('/login'), 2000);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const getDaysForGrid = () => {
    const days = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - today.getDay());
    startDate.setDate(startDate.getDate() - ((WEEKS_TO_SHOW - 1) * 7));
    let currentDate = new Date(startDate);
    const totalDaysToRender = WEEKS_TO_SHOW * 7;
    for (let i = 0; i < totalDaysToRender; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  const allDays = getDaysForGrid();

  const getMonthLabels = () => {
    const monthLabels: { label: string, colStart: number }[] = [];
    let lastMonth = -1;
    for (let i = 0; i < allDays.length; i++) {
      if (i % 7 === 0) {
        const date = allDays[i];
        const month = date.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({
            label: date.toLocaleString('default', { month: 'short' }),
            colStart: (i / 7) + 2, // Grid column starts at 1
          });
          lastMonth = month;
        }
      }
    }
    return monthLabels;
  };

  const monthLabels = getMonthLabels();

  // --- MODIFIED: Returns a string for the CSS class name ---
  const getContributionLevel = (date: Date | null): string => {
    if (!date || date > new Date()) return ""; // Future or empty days have no pin

    const dateString = date.toISOString().split('T')[0];
    const percentage = contributions[dateString];

    if (percentage === undefined) return "none";  // Red pin
    if (percentage >= 95) return "full";          // Green pin
    if (percentage > 0) return "partial";         // Blue pin
    return "none";                                // Red pin for 0%
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, date: Date | null) => {
    if (!date || date > new Date()) return;
    const dateString = date.toISOString().split('T')[0];
    const percentage = contributions[dateString];
    const content = percentage !== undefined
      ? `<strong>${percentage}%</strong> completion on ${date.toLocaleDateString()}`
      : `No workout on ${date.toLocaleDateString()}`;
    
    setTooltip({ visible: true, content, x: e.pageX, y: e.pageY });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };
  
  if (isLoading) return <div className="dashboard-status-container">Loading Dashboard...</div>;
  if (error) return <div className="dashboard-status-container dashboard-error-message">{error}</div>;

  return (
    <div className="dashboard-page-container">
      <h1 className="dashboard-title">Dashboard</h1>
      <p className="motivational-quote">"{motivationalQuote}"</p>
      
      <div className="contribution-board">
        <div className="month-and-grid-container">
          <div className="month-labels-container" style={{ gridTemplateColumns: `repeat(${WEEKS_TO_SHOW}, 17px)` }}>
            {monthLabels.map(({ label, colStart }) => (
              <div key={label + colStart} style={{ gridColumnStart: colStart }}>{label}</div>
            ))}
          </div>
          <div className="grid-layout-container">
            <div className="day-labels-container">
              <div className="day-label">M</div>
              <div className="day-label"></div>
              <div className="day-label">W</div>
              <div className="day-label"></div>
              <div className="day-label">F</div>
              <div className="day-label"></div>
            </div>
            <div className="calendar-grid" style={{ gridTemplateColumns: `repeat(${WEEKS_TO_SHOW}, 14px)` }}>
              {allDays.map((date, index) => {
                const levelClass = getContributionLevel(date);
                return (
                  <div 
                    key={index} 
                    className={`contribution-cell pin-${levelClass}`}
                    onMouseEnter={(e) => handleMouseEnter(e, date)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {tooltip && tooltip.visible && (
        <div 
          className="tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
};

export default Dashboard;