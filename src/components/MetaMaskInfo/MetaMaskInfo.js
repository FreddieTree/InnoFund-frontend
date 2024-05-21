import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './MetaMaskInfo.css';

const MetaMaskInfo = ({ onAddressChange }) => {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('');

  const getAddressAndBalance = async () => {
    try {
      if (!window.ethereum) {
        console.error('MetaMask is not installed');
        return;
      }
      console.log('Requesting MetaMask accounts...');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      console.log('User Address:', userAddress);
      setAddress(userAddress);

      console.log('Fetching balance...');
      const userBalance = await signer.getBalance();
      console.log('getBalance method called'); // 确认方法被调用
      console.log('User Balance in Wei:', userBalance.toString()); // 确认返回值
      const formattedBalance = parseFloat(ethers.utils.formatEther(userBalance)).toFixed(4);
      console.log('Formatted Balance in ETH:', formattedBalance); // 确认格式化后的值
      setBalance(formattedBalance);

      if (onAddressChange) {
        onAddressChange(userAddress);
      }
    } catch (error) {
      console.error('Error getting user address or balance:', error);
      console.error('Error details:', error.message); // 输出错误的详细信息
    }
  };

  useEffect(() => {
    getAddressAndBalance();

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        console.log('Accounts changed:', accounts);
        getAddressAndBalance();
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const formatAddress = (addr) => {
    return `${addr.slice(0, 5)}...${addr.slice(-5)}`;
  };

  return (
    <div className="metamask-info">
      <div className="info-item">
        <span className="label">Address:</span>
        <span className="value">{address ? formatAddress(address) : 'N/A'}</span>
      </div>
      <div className="info-item">
        <span className="label">ETH:</span>
        <span className="value">{balance || 'N/A'}</span>
      </div>
    </div>
  );
};

export default MetaMaskInfo;
