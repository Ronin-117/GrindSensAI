// src/components/MainLayout.tsx (Create this new file)
import React from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet from react-router-dom
import Navbar from './Navbar'; // Import your Navbar component

const MainLayout: React.FC = () => {
  return (
    <div className="app-container">
      <div className="content">
        {/* Outlet will render the matched child route component */}
        <Outlet /> 
      </div>
      <div className="navbar">
        <Navbar />
      </div>
    </div>
  );
};

export default MainLayout;