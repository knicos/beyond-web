import React, {useEffect} from 'react';
import {useRecoilState} from 'recoil';
import {streamList, nodeList} from '../../recoil/atoms';
import { getNodes, getStreams } from '../../api';
import styled from 'styled-components';
import {SideMenu} from './SideMenu';
import {Router} from './Router';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  flex-grow: 2;
`;

const BodyContainer = styled.main`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  overflow: auto;
  flex-grow: 2;
  align-items: stretch;
`;

export function Dashboard() {
    const [_1, setStreams] = useRecoilState(streamList);
    const [_2, setNodes] = useRecoilState(nodeList);

    useEffect(() => {
      getNodes().then(setNodes);
      getStreams().then(setStreams);

      const interval = setInterval(() => {
        getNodes().then(setNodes);
      }, 3000);
      return () => clearInterval(interval);
    }, []);

    return (
      <Container>
        <SideMenu />
        <BodyContainer>
          <Router />
        </BodyContainer>
      </Container>
    );
}
