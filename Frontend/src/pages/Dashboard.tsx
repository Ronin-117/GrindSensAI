// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkoutContributionsApi } from './api'; // Adjust path if needed

interface ContributionData {
  date: string; // 'YYYY-MM-DD'
  completion_percentage: number;
}

const Dashboard: React.FC = () => {
  const [contributions, setContributions] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- NEW STATE FOR CUSTOM TOOLTIP ---
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    content: string;
    x: number;
    y: number;
  } | null>(null);

  const motivationalQuote = "\"The body achieves what the mind believes. Go for it!\"";

  useEffect(() => {
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

  // --- Functions to generate the grid ---
  const getDaysInYear = () => {
    const days = [];
    const today = new Date();
    // Start from the Sunday of the current week to align the last column correctly
    const startDate = new Date();
    startDate.setDate(today.getDate() - today.getDay());
    // Go back 52 full weeks from this Sunday
    startDate.setDate(startDate.getDate() - (52 * 7));
    
    // We now have the start date. Let's build the array of all days for the grid.
    let currentDate = new Date(startDate);
    for (let i = 0; i < 371; i++) { // 53 weeks * 7 days
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate > today) break; // Stop if we go past today
    }
    // Pad the start with empty placeholders to ensure grid starts on Sunday
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday
    const emptyCells = Array(startDayOfWeek).fill(null);
    
    return [...emptyCells, ...days];
  };

  const allDaysWithPadding = getDaysInYear();

  const getMonthLabels = () => {
    const monthLabels: { label: string, colStart: number }[] = [];
    let lastMonth = -1;
    let weekIndex = 0;
    for (let i = 0; i < allDaysWithPadding.length; i++) {
        if(allDaysWithPadding[i] === null) continue; // Skip padding
        
        if (i % 7 === 0) weekIndex++; // New week, new column

        const date = allDaysWithPadding[i] as Date;
        const month = date.getMonth();
        if (month !== lastMonth) {
            monthLabels.push({
                label: date.toLocaleString('default', { month: 'short' }),
                colStart: weekIndex,
            });
            lastMonth = month;
        }
    }
    return monthLabels;
  };
  
  const monthLabels = getMonthLabels();

  const getContributionLevel = (date: Date | null): number => {
    if (!date) return -1; // -1 for empty padding cells
    const dateString = date.toISOString().split('T')[0];
    const percentage = contributions[dateString];

    if (percentage === undefined) return 0;
    if (percentage >= 95) return 4; // Completed fully
    if (percentage > 50) return 3;
    if (percentage > 0) return 2;
    if (percentage === 0) return 1; // Attempted but 0%
    return 0;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, date: Date | null) => {
    if (!date) return;
    const dateString = date.toISOString().split('T')[0];
    const percentage = contributions[dateString];
    const content = percentage !== undefined
      ? `<strong>${percentage}%</strong> completion on ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
      : `No workout on ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    
    setTooltip({
      visible: true,
      content: content,
      x: e.pageX, // Use pageX/Y for positioning relative to document
      y: e.pageY,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };
  
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: '#c9d1d9',
      backgroundColor: '#0d1117',
      minHeight: '100vh',
    },
    title: { fontSize: '32px', fontWeight: '600', margin: '20px 0 10px 0' },
    quote: { fontStyle: 'italic', textAlign: 'center', margin: '15px 0 40px 0', maxWidth: '600px', color: '#8b949e' },
    chartContainer: { display: 'inline-block', border: '1px solid #30363d', borderRadius: '6px', padding: '15px 20px', backgroundColor: '#0d1117' },
    gridAndDays: { display: 'flex', gap: '8px' },
    dayLabels: { display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', color: '#8b949e', paddingTop: '30px' },
    dayLabel: { height: '14px', display: 'flex', alignItems: 'center' },
    monthAndGrid: { display: 'flex', flexDirection: 'column', gap: '5px' },
    monthLabels: { display: 'grid', gridAutoFlow: 'column', gridTemplateColumns: `repeat(53, 17px)`, fontSize: '12px', color: '#8b949e', height: '20px' },
    calendarGrid: { display: 'grid', gridTemplateColumns: `repeat(53, 14px)`, gridTemplateRows: `repeat(7, 14px)`, gridAutoFlow: 'column', gap: '3px' },
    cell: { width: '14px', height: '14px', backgroundColor: '#161c22', borderRadius: '2px', outline: '1px solid rgba(27, 31, 35, 0.05)', outlineOffset: '-1px' },
    emptyCell: { backgroundColor: 'transparent', outline: 'none' },
    level0: { backgroundColor: '#161c22' },
    level1: { backgroundColor: '#0e4429' },
    level2: { backgroundColor: '#006d32' },
    level3: { backgroundColor: '#26a641' },
    level4: { backgroundColor: '#39d353' },
    tooltip: {
      position: 'absolute', // Position relative to nearest positioned ancestor (or body)
      padding: '8px 12px',
      backgroundColor: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '6px',
      color: '#c9d1d9',
      fontSize: '12px',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      zIndex: 1000,
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      transform: 'translate(-50%, -120%)', // Center tooltip above the cursor
    },
  };

  if (isLoading) return <div style={{...styles.container, justifyContent: 'center'}}>Loading Dashboard...</div>;
  if (error) return <div style={{...styles.container, justifyContent: 'center', color: 'red'}}>{error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.quote}>{motivationalQuote}</p>
      
      <div style={styles.chartContainer}>
        <div style={styles.monthAndGrid}>
          <div style={styles.monthLabels}>
            {monthLabels.map(({ label, colStart }) => (
              <div key={label + colStart} style={{ gridColumnStart: colStart }}>{label}</div>
            ))}
          </div>
          <div style={styles.gridAndDays}>
            <div style={styles.dayLabels}>
              <div style={styles.dayLabel}></div>
              <div style={styles.dayLabel}>Mon</div>
              <div style={styles.dayLabel}></div>
              <div style={styles.dayLabel}>Wed</div>
              <div style={styles.dayLabel}></div>
              <div style={styles.dayLabel}>Fri</div>
              <div style={styles.dayLabel}></div>
            </div>
            <div style={styles.calendarGrid}>
              {allDaysWithPadding.map((date, index) => {
                const level = getContributionLevel(date);
                if (level === -1) { // Render an empty placeholder for padding
                    return <div key={`pad-${index}`} style={styles.emptyCell} />
                }
                
                return (
                  <div 
                    key={index} 
                    style={{...styles.cell, ...styles[`level${level}` as keyof typeof styles]}}
                    onMouseEnter={(e) => handleMouseEnter(e, date)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* RENDER THE CUSTOM TOOLTIP */}
      {tooltip && tooltip.visible && (
        <div 
          style={{
            ...styles.tooltip,
            left: tooltip.x, // Position based on mouse event's pageX
            top: tooltip.y,  // Position based on mouse event's pageY
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }} // To render the <strong> tag
        >
        </div>
      )}
    </div>
  );
};

export default Dashboard;