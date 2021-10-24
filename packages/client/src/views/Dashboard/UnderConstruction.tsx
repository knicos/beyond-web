import React from 'react';
import { FaHammer } from 'react-icons/fa';
import styled from 'styled-components';

const Container = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 1.2rem;
  font-weight: bold;
  gap: 1rem;
`;

export function UnderConstruction() {
  return (
    <Container>
      <FaHammer size="10rem" color="#777" />
      <span>Under Construction</span>
    </Container>
  )
}