import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FundProject from '../FundProject/FundProject';
import UserUploadProof from '../UserUploadProof/UserUploadProof';
import './ProjectDetails.css';

function ProjectDetails({ project, onClose, activePage }) {
  const [milestones, setMilestones] = useState([]);
  const [currentUser, setCurrentUser] = useState('');

  const fetchCurrentUser = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentUser(accounts[0].toLowerCase());
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchMilestones = async (projectId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/milestones`, {
        params: { projectId }
      });
      const projectMilestones = response.data.filter(milestone => milestone.projectId === projectId);
      projectMilestones.sort((a, b) => a.milestoneId - b.milestoneId);
      setMilestones(projectMilestones);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchMilestones(project.projectId);
  }, [project]);

  const amountRaisedInEther = parseFloat(project.amountRaised);
  const fundingGoalInEther = project.fundingGoal / 10 ** 18;

  const handleBackClick = () => {
    onClose(activePage);
  };

  const calculateFundingProgress = () => {
    return (amountRaisedInEther / fundingGoalInEther) * 100;
  };

  const calculateMilestoneProgress = () => {
    const approvedMilestones = milestones.filter(milestone => milestone.milestonestatus.toLowerCase() === 'approved').length;
    return (approvedMilestones / milestones.length) * 100;
  };

  const renderMilestoneImage = (documentURL) => {
    const isImage = /\.(jpeg|jpg|png|gif)$/i.test(documentURL);
    const fullDocumentURL = `${process.env.REACT_APP_API_URL}${documentURL}`;
    console.log('Full Document URL:', fullDocumentURL); // 打印 URL 进行检查
    return isImage ? (
      <img src={fullDocumentURL} alt="Milestone Document" className="milestone-image" />
    ) : (
      <a href={fullDocumentURL} target="_blank" rel="noopener noreferrer">View Document</a>
    );
  };
  

  return (
    <div className="project-details-container">
      <div className="project-details">
        <button onClick={handleBackClick} className="back-button">Back</button>
        <h2>{project.projectName}</h2>
        <p><strong>ID:</strong> {project.projectId}</p>
        <p><strong>Type:</strong> {project.projectType}</p>
        <p><strong>Description:</strong> {project.projectDescription}</p>
        <p><strong>Project Deadline:</strong> {new Date(project.projectDDL).toLocaleDateString()}</p>

        {project.status.toLowerCase() === 'active' ? (
          <div className="status-section">
            <p className="project-status">Crowdfunding Project - Raised: {amountRaisedInEther} / {fundingGoalInEther} ETH</p>
            <div className="progress-bar">
              <div className="progress" style={{ width: `${calculateFundingProgress()}%` }}></div>
            </div>
          </div>
        ) : (
          project.status.toLowerCase() === 'funded' && (
            <div className="milestone-section">
              <h3>Milestones</h3>
              <ul>
                {milestones.filter(milestone => milestone.milestonestatus.toLowerCase() === 'approved').map((milestone, index) => (
                  <li key={`${project.projectId}-${milestone.milestoneId}-${index}`}>
                    <p><strong>Milestone ID:</strong> {milestone.milestoneId + 1}</p>
                    <p><strong>Description:</strong> {milestone.milestoneDescription}</p>
                    <p><strong>Document:</strong> {renderMilestoneImage(milestone.otherDocuments)}</p>
                  </li>
                ))}
              </ul>
              <div className="milestone-progress-container">
                {milestones.map((milestone, index) => {
                  const milestoneStatus = milestone.milestonestatus.toLowerCase();
                  const isApproved = milestoneStatus === 'approved';
                  const isPending = milestoneStatus === 'pending';
                  return (
                    <div
                      key={`${project.projectId}-${milestone.milestoneId}-${index}`}
                      className={`milestone-progress ${isApproved ? 'approved' : isPending ? 'pending' : 'upcoming'}`}
                    ></div>
                  );
                })}
              </div>
              <p className="project-status">
                Milestone Progress - {milestones.filter(m => m.milestonestatus.toLowerCase() === 'approved').length} of {milestones.length} approved
              </p>
            </div>
          )
        )}

        {project.status.toLowerCase() === 'active' && project.creator.toLowerCase() !== currentUser && (
          <FundProject projectId={project.projectId} />
        )}

        {project.status.toLowerCase() === 'funded' && project.creator.toLowerCase() === currentUser && (
          <UserUploadProof projectId={project.projectId} />
        )}
      </div>
    </div>
  );
}

export default ProjectDetails;
