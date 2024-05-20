// src/components/MetaMaskInfo/MetaMaskInfo.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './MetaMaskInfo.css';

const MetaMaskInfo = ({ onAddressChange }) => {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('');

  const getAddressAndBalance = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      setAddress(userAddress);
      
      const userBalance = await signer.getBalance();
      setBalance((parseFloat(ethers.utils.formatEther(userBalance))).toFixed(4));

      if (onAddressChange) {
        onAddressChange(userAddress);
      }
    } catch (error) {
      console.error('Error getting user address or balance:', error);
    }
  };

  useEffect(() => {
    getAddressAndBalance();

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        getAddressAndBalance();
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const formatAddress = (addr) => {
    return `${addr.slice(0, 5)}...${addr.slice(-5)}`;
  };

  return (
    <div className="metamask-info">
      <div className="info-item">
        <span className="label">Address:</span>
        <span className="value">{formatAddress(address)}</span>
      </div>
      <div className="info-item">
        <span className="label">ETH:</span>
        <span className="value">{balance}</span>
      </div>
    </div>
  );
};

export default MetaMaskInfo;
