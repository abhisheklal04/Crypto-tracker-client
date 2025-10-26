import React from 'react';
import styled from 'styled-components';
import CryptoTable from './components/CryptoTable';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  font-family: 'Arial', sans-serif;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #f7931a;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  text-align: center;
`;

const App: React.FC = () => {
  return (
    <AppContainer>
      <Title>Crypto Price Tracker</Title>
      <CryptoTable />
    </AppContainer>
  );
};

export default App;