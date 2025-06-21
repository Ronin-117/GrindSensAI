// src/components/MainLayout.tsx (Create this new file)
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout: React.FC = () => {
  return (
    <div className="app-container">
      <div className="content">
        <Outlet /> 
      </div>
      <div className="navbar">
        <Navbar />
      </div>
    </div>
  );
};

export default MainLayout;