import React from 'react';
import styled from 'styled-components';
import {pageTitle} from '../../recoil/atoms';
import {currentSession} from '../../recoil/selectors';
import {useRecoilValue} from 'recoil';
import {FaUserCircle} from 'react-icons/fa';
import UTULogo from './UTU_logo_EN_RGB.png';

const Header = styled.header`
    border-bottom: 8px solid ${props => props.theme.border.green};
    display: flex;
    flex-direction: row;
    padding: 0 2rem;
    background: white;
    align-items: center;
    z-index: 2;

    nav {
      flex-grow: 2;
    }
`;

const Title = styled.h1`
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0;
    margin-left: 1rem;
    color: ${props => props.theme.text.purple};
`;

const AccountContainer = styled.div`
    text-align: middle;
    font-weight: bold;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;

interface AccountProps {
  session: any;
}

function Account({ session }: AccountProps) {
  return <AccountContainer>
    <FaUserCircle color="#adcb00" size="1.5rem" />
    {session.user?.name}
  </AccountContainer>;
}

export function PageHeader() {
    const subtitle = useRecoilValue(pageTitle);
    const session = useRecoilValue(currentSession);

    return (
        <Header>
            <img src={UTULogo} width={200} />
            <Title>
                <span>Immersive Video Lab</span>
            </Title>
            <nav></nav>
            {session && <Account session={session} />}
        </Header>
    )
}