import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import Navbar from '../Navbar/Navbar';
import ProjectList from '../ProjectList/ProjectList';
import ProjectDetails from '../ProjectDetails/ProjectDetails';
import CreateProject from '../CreateProject/CreateProject';
import './Home.css';

let requestInProgress = false;

function Home() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [userAddress, setUserAddress] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [activePage, setActivePage] = useState('allProjects');

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/projects`);
      if (Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        console.error('Expected an array but received:', response.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const getUserAddress = async () => {
    try {
      if (requestInProgress) {
        console.log('There is already a pending request');
        return;
      }
      requestInProgress = true;

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setUserAddress(address.toLowerCase());

      requestInProgress = false;
    } catch (error) {
      requestInProgress = false;
      console.error('Error getting user address:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    getUserAddress();
  }, []);

  const filterMyProjects = useCallback(() => {
    if (!Array.isArray(projects)) {
      console.error('projects is not an array:', projects);
      return [];
    }
    return projects.filter(project => project.creator.toLowerCase() === userAddress);
  }, [projects, userAddress]);

  const filterFundedProjects = useCallback(() => {
    if (!Array.isArray(projects)) {
      console.error('projects is not an array:', projects);
      return [];
    }
    return projects.filter(project => 
      (project.status.toLowerCase() === 'active' || project.status.toLowerCase() === 'funded') &&
      Array.isArray(project.contributors) && project.contributors.some(contributor => contributor.toLowerCase() === userAddress)
    );
  }, [projects, userAddress]);

  const filterActiveAndFundedProjects = useCallback(() => {
    if (!Array.isArray(projects)) {
      console.error('projects is not an array:', projects);
      return [];
    }
    return projects.filter(project => 
      project.status.toLowerCase() === 'active' || project.status.toLowerCase() === 'funded'
    );
  }, [projects]);

  const handleBackToProjects = (page) => {
    setSelectedProject(null);
    setActivePage(page);
  };

  useEffect(() => {
    if (activePage === 'allProjects') {
      setFilteredProjects(filterActiveAndFundedProjects());
    } else if (activePage === 'fundedProjects') {
      setFilteredProjects(filterFundedProjects());
    } else if (activePage === 'myProjects') {
      setFilteredProjects(filterMyProjects());
    }
  }, [projects, activePage, userAddress, filterActiveAndFundedProjects, filterFundedProjects, filterMyProjects]);

  const toggleCreateProject = () => {
    setActivePage('createProject');
    setSelectedProject(null);
  };

  const showAllProjects = () => {
    setActivePage('allProjects');
    setSelectedProject(null); // Ensure ProjectDetails is closed
  };

  const showMyProjects = () => {
    setActivePage('myProjects');
    setSelectedProject(null); // Ensure ProjectDetails is closed
  };

  const showFundedProjects = () => {
    setActivePage('fundedProjects');
    setSelectedProject(null); // Ensure ProjectDetails is closed
  };

  const handleProjectClick = (project) => {
    setSelectedProject({
      ...project,
      isCreator: project.creator.toLowerCase() === userAddress
    });
    setActivePage('projectDetails');
  };

  const handleSearch = (term) => {
    let projectsToFilter = projects;
    if (activePage === 'myProjects') {
      projectsToFilter = filterMyProjects();
    } else if (activePage === 'fundedProjects') {
      projectsToFilter = filterFundedProjects();
    } else if (activePage === 'allProjects') {
      projectsToFilter = filterActiveAndFundedProjects();
    }

    if (!term) {
      setFilteredProjects(projectsToFilter);
    } else {
      const lowercasedTerm = term.toLowerCase();
      const filtered = projectsToFilter.filter(project =>
        project.projectName.toLowerCase().includes(lowercasedTerm) ||
        project.projectId.toString() === term // 精确匹配ID
      );
      setFilteredProjects(filtered);
    }
  };

  return (
    <div className="home-container">
      <Navbar 
        onCreateProject={toggleCreateProject} 
        onShowAllProjects={showAllProjects} 
        onShowMyProjects={showMyProjects}
        onShowFundedProjects={showFundedProjects}
        onSearch={handleSearch}
        activePage={activePage}
      />
      <div className={`content ${activePage === 'createProject' ? 'centered' : ''}`}>
        {selectedProject ? (
          <ProjectDetails project={selectedProject} onClose={handleBackToProjects} activePage={activePage} />
        ) : activePage === 'createProject' ? (
          <CreateProject />
        ) : (
          <ProjectList projects={filteredProjects} onProjectClick={handleProjectClick} activePage={activePage} />
        )}
      </div>
    </div>
  );
}

export default Home;
