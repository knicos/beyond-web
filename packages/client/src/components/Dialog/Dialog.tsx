import React from 'react';
import styled from 'styled-components';

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background #00000022;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Container = styled.div`
  background: white;
  border-radius: 5px;
  z-index: 2;
`;

export function Dialog({ show, children }: { show: boolean, children: JSX.Element }) {
  if (!show) {
    return null;
  }

  return (
    <Background>
      <Container>
        {children}
      </Container>
    </Background>
  )
}
