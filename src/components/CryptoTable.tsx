import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { BiUpArrowAlt, BiDownArrowAlt } from 'react-icons/bi';
import axios from 'axios';
import { CryptoDetails, Price, Stats, UseCryptoData } from '../types/crypto';

const TableContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  width: 90%;
  max-width: 1200px;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  color: white;
`;

const Th = styled.th`
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tr = styled.tr`
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const PriceChange = styled.div<{ isPositive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: ${props => props.isPositive ? '#00ff00' : '#ff0000'};
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #f7931a;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  text-align: center;
  padding: 2rem;
`;

const CryptoName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
`;

const CryptoSymbol = styled.span`
  color: #888;
  font-size: 0.9rem;
`;

const RefreshButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 0.5rem 1rem;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: background-color 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

// Custom hook for all crypto data fetching
const useCryptoData = (): UseCryptoData => {
  const [cryptoDetails, setCryptoDetails] = useState<Record<string, CryptoDetails>>({});
  const [prices, setPrices] = useState<Price[]>([]);
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const cryptoDetailsFetched = useRef<boolean>(false);
  const priceUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch crypto details
  const fetchCryptoDetails = useCallback(async () => {
    if (cryptoDetailsFetched.current) return;
    
    console.log('Fetching crypto details...');
    try {
      const response = await axios.get<{ cryptocurrencies: CryptoDetails[] }>('http://localhost:3001/api/crypto-details');
      const details = response.data.cryptocurrencies.reduce<Record<string, CryptoDetails>>((acc, crypto) => {
        acc[crypto.tradingPair] = crypto;
        return acc;
      }, {});
      setCryptoDetails(details);
      cryptoDetailsFetched.current = true;
      console.log('Crypto details fetched successfully');
      return details;
    } catch (err) {
      console.error('Failed to fetch crypto details:', err);
      setError('Failed to fetch cryptocurrency details');
      setLoading(false);
      return null;
    }
  }, []);

  // Fetch prices and stats
  const fetchPrices = useCallback(async (details: Record<string, CryptoDetails>) => {
    const cryptoToUse = details || cryptoDetails;
    if (!Object.keys(cryptoToUse).length) return;

    console.log('Fetching prices and stats...');
    try {
      const [pricesResponse, ...statsResponses] = await Promise.all([
        axios.get<{ prices: Price[] }>('http://localhost:3001/api/prices'),
        ...Object.keys(cryptoToUse).map(symbol => 
          axios.get<Stats>(`http://localhost:3001/api/stats/${symbol.replace('USDT', '')}`)
        )
      ]);

      const newStats: Record<string, Stats> = {};
      statsResponses.forEach(response => {
        if (response.data && response.data.symbol) {
          newStats[response.data.symbol] = response.data;
        }
      });

      setPreviousPrices(prices.reduce<Record<string, number>>((acc, curr) => {
        acc[curr.symbol] = curr.price;
        return acc;
      }, {}));

      setPrices(pricesResponse.data.prices);
      setStats(newStats);
      setLoading(false);
      setError(null);
      console.log('Prices and stats fetched successfully');
    } catch (err) {
      console.error('Failed to fetch prices and stats:', err);
      setError('Failed to fetch crypto data');
      setLoading(false);
    }
  }, [cryptoDetails, prices]);

  // Initial setup effect
  useEffect(() => {
    const initializeData = async () => {
      console.log('Initializing data...');
      const details = await fetchCryptoDetails();
      if (details) {
        await fetchPrices(details);
        // Set up interval only after initial fetch is successful
        priceUpdateInterval.current = setInterval(() => fetchPrices(details), 60000);
        console.log('Price update interval set up');
      }
    };

    initializeData();

    // Cleanup interval on unmount
    return () => {
      if (priceUpdateInterval.current) {
        clearInterval(priceUpdateInterval.current);
      }
    };
  }, [fetchCryptoDetails, fetchPrices]);

  // Create a refresh function that ensures we have crypto details
  const refreshPrices = useCallback(async () => {
    console.log('Manually refreshing prices...');
    if (!Object.keys(cryptoDetails).length) {
      const details = await fetchCryptoDetails();
      if (details) {
        await fetchPrices(details);
      }
    } else {
      await fetchPrices(cryptoDetails);
    }
  }, [cryptoDetails, fetchCryptoDetails, fetchPrices]);

  return {
    cryptoDetails,
    prices,
    previousPrices,
    loading,
    error,
    stats,
    refreshPrices
  };
};

const CryptoTable: React.FC = () => {
  const {
    cryptoDetails,
    prices,
    previousPrices,
    loading,
    error,
    stats,
    refreshPrices
  } = useCryptoData();

  if (loading) {
    return (
      <TableContainer>
        <LoadingSpinner />
      </TableContainer>
    );
  }

  if (error) {
    return (
      <TableContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <RefreshButton onClick={refreshPrices}>Refresh Prices</RefreshButton>
      <Table>
        <thead>
          <tr>
            <Th>Cryptocurrency</Th>
            <Th>Price (USD)</Th>
            <Th>24h Change</Th>
            <Th>24h High</Th>
            <Th>24h Low</Th>
            <Th>24h Volume</Th>
          </tr>
        </thead>
        <tbody>
          {prices.map(({ symbol, price }) => {
            const cryptoDetail = cryptoDetails[symbol] || {};
            const statsData = stats[symbol] || {};

            return (
              <Tr key={symbol}>
                <Td>
                  <CryptoName>
                    {cryptoDetail.name || symbol}
                    <CryptoSymbol>{cryptoDetail.symbol || symbol.replace('USDT', '')}</CryptoSymbol>
                  </CryptoName>
                </Td>
                <Td>${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Td>
                <Td>
                  <PriceChange isPositive={statsData.priceChangePercent >= 0}>
                    {statsData.priceChangePercent >= 0 ? <BiUpArrowAlt /> : <BiDownArrowAlt />}
                    {Math.abs(statsData.priceChangePercent || 0).toFixed(2)}%
                  </PriceChange>
                </Td>
                <Td>${statsData.highPrice ? parseFloat(statsData.highPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'N/A'}</Td>
                <Td>${statsData.lowPrice ? parseFloat(statsData.lowPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'N/A'}</Td>
                <Td>{statsData.volume ? parseFloat(statsData.volume).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}</Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </TableContainer>
  );
};

export default CryptoTable;