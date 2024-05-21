// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateProject from './components/CreateProject/CreateProject';
import Home from './components/Home/Home';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <SpeedInsights />
        <Analytics />
        <Routes>
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
