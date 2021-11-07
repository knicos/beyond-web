import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: block;
`;

const Header = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme.border.green};
  padding: 0 1rem;
`;

const Body = styled.div`
  display: block;
  padding: 1rem;
`;

const TabButton = styled.button`
  background: white;
  outline: none;
  border: none;
  appearance: none;
  cursor: pointer;
  margin: 0 0.2rem;
  border-bottom: 5px solid #eee;
  padding: 0.5rem 1rem;

  &.selected {
    background: #eee;
    border-bottom: 5px solid ${props => props.theme.border.green};
  }
`;

interface Props {
  labels: string[];
  content: JSX.Element[];
}

export function Tabs({ labels, content }: Props) {
  const [tab, setTab] = useState(0);
  if (labels.length === 0 || labels.length !== content.length) {
    console.warn('Tab labels mismatch or missing');
    return null;
  }

  return (
    <Container>
      <Header>
        {labels.map((label, index) => (
          <TabButton className={index === tab ? "selected" : ""} key={index} onClick={() => setTab(index)}>
            {label}
          </TabButton>
        ))}
      </Header>
      <Body>
        {content[tab]}
      </Body>
    </Container>
  )
}
