// src/components/Navbar/Navbar.js
import React, { useState } from 'react';
import MetaMaskInfo from '../MetaMaskInfo/MetaMaskInfo';
import { FaSearch } from 'react-icons/fa';  // 导入放大镜图标
import './Navbar.css';

function Navbar({ onCreateProject, onShowAllProjects, onShowMyProjects, onShowFundedProjects, onSearch, activePage, onAddressChange }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="navbar-left">
          <img src="/logo.png" alt="Logo" className="navbar-logo" />
          <span className="navbar-title">InnoFund</span>
        </div>
        <div className="navbar-right">
          {activePage !== 'createProject' && (
            <div className="search-container">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <FaSearch className="search-icon" />
            </div>
          )}
          <MetaMaskInfo onAddressChange={onAddressChange} />
        </div>
      </div>
      <div className="navbar-bottom">
        <button className={activePage === 'allProjects' ? 'active' : ''} onClick={onShowAllProjects}>All Projects</button>
        <button className={activePage === 'myProjects' ? 'active' : ''} onClick={onShowMyProjects}>My Projects</button>
        <button className={activePage === 'fundedProjects' ? 'active' : ''} onClick={onShowFundedProjects}>Funded Projects</button>
        <button className={activePage === 'createProject' ? 'active' : ''} onClick={onCreateProject}>Create Project</button>
      </div>
    </nav>
  );
}

export default Navbar;
