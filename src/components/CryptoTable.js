import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BiUpArrowAlt, BiDownArrowAlt } from 'react-icons/bi';
import axios from 'axios';

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

const PriceChange = styled.div`
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

const cryptoNames = {
  'BTCUSDT': 'Bitcoin',
  'ETHUSDT': 'Ethereum',
  'DOGEUSDT': 'Dogecoin',
  'BNBUSDT': 'Binance Coin',
  'ADAUSDT': 'Cardano',
  'XRPUSDT': 'Ripple',
  'SOLUSDT': 'Solana',
  'DOTUSDT': 'Polkadot',
  'MATICUSDT': 'Polygon',
  'AVAXUSDT': 'Avalanche'
};

function CryptoTable() {
  const [prices, setPrices] = useState([]);
  const [previousPrices, setPreviousPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  const fetchPrices = async () => {
    try {
      const [pricesResponse, ...statsResponses] = await Promise.all([
        axios.get('http://localhost:3001/api/prices'),
        ...Object.keys(cryptoNames).map(symbol => 
          axios.get(`http://localhost:3001/api/stats/${symbol.replace('USDT', '')}`)
        )
      ]);

      const newStats = {};
      statsResponses.forEach(response => {
        if (response.data && response.data.symbol) {
          newStats[response.data.symbol] = response.data;
        }
      });

      setPreviousPrices(prices.reduce((acc, curr) => {
        acc[curr.symbol] = curr.price;
        return acc;
      }, {}));

      setPrices(pricesResponse.data.prices);
      setStats(newStats);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError('Failed to fetch crypto data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

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
      <RefreshButton onClick={fetchPrices}>Refresh Prices</RefreshButton>
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
            const prevPrice = previousPrices[symbol] || price;
            const priceChange = price - prevPrice;
            const isPositive = priceChange >= 0;
            const statsData = stats[symbol] || {};

            return (
              <Tr key={symbol}>
                <Td>
                  <CryptoName>
                    {cryptoNames[symbol]}
                    <CryptoSymbol>{symbol.replace('USDT', '')}</CryptoSymbol>
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
}

export default CryptoTable;