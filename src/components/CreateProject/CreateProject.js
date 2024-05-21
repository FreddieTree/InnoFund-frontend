import React, { useState } from 'react';
import { ethers } from 'ethers';
import { provider, contract } from '../../ethers';
import axios from 'axios';
import './CreateProject.css';

function CreateProject() {
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('Education');
  const [projectDescription, setProjectDescription] = useState('');
  const [fundingGoal, setFundingGoal] = useState('');
  const [milestoneGoals, setMilestoneGoals] = useState(['']);
  const [milestoneDeadlines, setMilestoneDeadlines] = useState(['']);
  const [fundingTimeoutHours, setFundingTimeoutHours] = useState('0');
  const [fundingTimeoutMinutes, setFundingTimeoutMinutes] = useState('0');
  const [isCreating, setIsCreating] = useState(false);

  const handleMilestoneGoalChange = (index, value) => {
    const newMilestoneGoals = [...milestoneGoals];
    newMilestoneGoals[index] = value;
    setMilestoneGoals(newMilestoneGoals);
  };

  const handleMilestoneDeadlineChange = (index, value) => {
    const newMilestoneDeadlines = [...milestoneDeadlines];
    newMilestoneDeadlines[index] = value;
    setMilestoneDeadlines(newMilestoneDeadlines);
  };

  const addMilestone = () => {
    setMilestoneGoals([...milestoneGoals, '']);
    setMilestoneDeadlines([...milestoneDeadlines, '']);
  };

  const deleteMilestone = () => {
    if (milestoneGoals.length > 1) {
      setMilestoneGoals(milestoneGoals.slice(0, -1));
      setMilestoneDeadlines(milestoneDeadlines.slice(0, -1));
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const fundingGoalInWei = ethers.utils.parseEther(fundingGoal);
      const milestoneGoalsInWei = milestoneGoals.map(goal => ethers.utils.parseEther(goal));
      const milestoneDeadlinesInSeconds = milestoneDeadlines.map(deadline => parseInt(deadline, 10) * 86400);

      const fundingTimeoutInSeconds = parseInt(fundingTimeoutHours, 10) * 3600 + parseInt(fundingTimeoutMinutes, 10) * 60;

      const tx = await contract.connect(signer).createProject(
        fundingGoalInWei,
        milestoneGoalsInWei,
        milestoneDeadlinesInSeconds,
        fundingTimeoutInSeconds
      );

      const receipt = await tx.wait();

      const event = receipt.events.find(event => event.event === 'ProjectCreated');
      if (!event) {
        throw new Error('ProjectCreated event not found');
      }

      const projectId = event.args.projectId;

      const projectDeadline = new Date(Date.now() + fundingTimeoutInSeconds * 1000);

      const milestones = milestoneDeadlines.map((days, index) => ({
        projectId: projectId.toNumber(),
        milestoneId: index,
        projectName,
        milestoneDDL: new Date(projectDeadline.getTime() + parseInt(days, 10) * 86400 * 1000),
        goal: ethers.utils.parseEther(milestoneGoals[index]).toString() // 添加 goal 字段
      }));

      const projectData = {
        projectId: projectId.toNumber(),
        projectName,
        projectType,
        projectDescription,
        creator: tx.from,
        fundingGoal: ethers.utils.parseEther(fundingGoal).toString(),
        amountRaised: '0',
        status: 'Pending',
        contributors: [],
        createdAt: new Date(),
        projectDDL: projectDeadline,
        milestones,
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/projects`, projectData);

      const activityData = {
        type: 'Create Project',
        projectId: projectId.toNumber(),
        user: tx.from,
        details: projectData
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/activities`, activityData);

      alert('Project created successfully');
      resetForm();
    } catch (error) {
      console.error('Error creating project:', error);
      alert(`Error creating project: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setProjectName('');
    setProjectType('Education');
    setProjectDescription('');
    setFundingGoal('');
    setMilestoneGoals(['']);
    setMilestoneDeadlines(['']);
    setFundingTimeoutHours('0');
    setFundingTimeoutMinutes('0');
  };

  return (
    <div className="create-project-container">
      <div className="container">
        <h2>Create Project</h2>
        <form onSubmit={createProject}>
          <div>
            <label>Project Name: </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              disabled={isCreating}
            />
          </div>
          <div>
            <label>Project Type: </label>
            <select value={projectType} onChange={(e) => setProjectType(e.target.value)} required disabled={isCreating}>
              <option value="Education">Education</option>
              <option value="Finance">Finance</option>
              <option value="AI">AI</option>
              <option value="Medical">Medical</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div>
            <label>Project Description: </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              required
              disabled={isCreating}
            />
          </div>
          <div>
            <label>Funding Goal (in Ether): </label>
            <input
              type="text"
              value={fundingGoal}
              onChange={(e) => setFundingGoal(e.target.value)}
              required
              disabled={isCreating}
            />
          </div>
          <div>
            <label>Milestone Goals (in Ether): </label>
            {milestoneGoals.map((goal, index) => (
              <input
                key={index}
                type="text"
                value={goal}
                onChange={(e) => handleMilestoneGoalChange(index, e.target.value)}
                required
                disabled={isCreating}
              />
            ))}
            <div className="button-group">
              <button type="button" onClick={addMilestone} disabled={isCreating}>Add Milestone</button>
              <button
                type="button"
                onClick={deleteMilestone}
                disabled={isCreating || milestoneGoals.length <= 1}
                className={milestoneGoals.length <= 1 ? 'disabled' : ''}
              >
                Delete Milestone
              </button>
            </div>
          </div>
          <div>
            <label>Milestone Deadlines (in days): </label>
            {milestoneDeadlines.map((deadline, index) => (
              <input
                key={index}
                type="text"
                value={deadline}
                onChange={(e) => handleMilestoneDeadlineChange(index, e.target.value)}
                required
                disabled={isCreating}
              />
            ))}
          </div>
          <div>
            <label>Funding Timeout: </label>
            <div className="timeout-inputs">
              <input
                type="number"
                value={fundingTimeoutHours}
                onChange={(e) => setFundingTimeoutHours(e.target.value)}
                min="0"
                required
                disabled={isCreating}
              />
              <span>Hours</span>
              <input
                type="number"
                value={fundingTimeoutMinutes}
                onChange={(e) => setFundingTimeoutMinutes(e.target.value)}
                min="0"
                max="60"
                required
                disabled={isCreating}
              />
              <span>Minutes</span>
            </div>
          </div>
          <button type="submit" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateProject;
