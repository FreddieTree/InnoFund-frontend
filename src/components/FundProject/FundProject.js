import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { provider, contract } from '../../ethers'; // 确保 provider 和 contract 被正确导入
import axios from 'axios';
import './FundProject.css';

function FundProject({ projectId }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  useEffect(() => {
    if (isSubmitting) {
      localStorage.setItem(`funding-${projectId}`, true);
    } else {
      localStorage.removeItem(`funding-${projectId}`);
    }
  }, [isSubmitting, projectId]);

  useEffect(() => {
    const isFrozen = localStorage.getItem(`funding-${projectId}`) === 'true';
    setIsFrozen(isFrozen);
  }, [projectId]);

  const roundAmount = (amount) => {
    return Math.round(amount * 100) / 100; // 四舍五入到小数点后两位
  };

  const fundProject = async (event) => {
    event.preventDefault();

    if (parseFloat(amount) <= 0 || isNaN(amount)) {
      setError('Amount must be a positive number');
      return;
    }

    try {
      setIsSubmitting(true);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();

      const roundedAmount = roundAmount(parseFloat(amount));
      const amountInWei = ethers.utils.parseEther(roundedAmount.toString()); // 转换为 wei 单位

      const tx = await contract.fundProject(parseInt(projectId, 10), { value: amountInWei });
      await tx.wait();

      // 更新后端数据库
      try {
        const response = await axios.post('${process.env.REACT_APP_API_URL}/projects/fund', {
          projectId: parseInt(projectId, 10),
          amount: roundedAmount, // 以 eth 为单位发送四舍五入后的金额
          contributor: userAddress
        });

        if (response.data) {
          alert('Project funded successfully and database updated');
          setAmount('');
        } else {
          alert('Failed to update database');
        }
      } catch (error) {
        console.error('Error updating database:', error.message);
        alert('Error updating database');
      }
    } catch (error) {
      console.error('Error funding project:', error.message);
      setError('Error funding project');
    } finally {
      setIsSubmitting(false);
      setIsFrozen(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
      setAmount(value);
      setError('');
    } else {
      setError('Please enter a valid amount');
    }
  };

  return (
    <div className="fund-project-container">
      <h2>Fund Project</h2>
      <form onSubmit={fundProject}>
        <div className="input-group">
          <label>Amount (in Ether): </label>
          <input
            type="number" // 确保输入类型为 number
            step="0.01" // 可选，指定最小增量
            value={amount}
            onChange={handleAmountChange}
            className="fund-input"
            disabled={isSubmitting || isFrozen} // 在提交期间和冻结状态禁用输入框
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="fund-button" disabled={isSubmitting || isFrozen}>
          {isSubmitting ? 'Submitting...' : 'Fund Project'}
        </button>
      </form>
    </div>
  );
}

export default FundProject;
