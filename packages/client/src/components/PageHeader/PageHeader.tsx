import React from 'react';
import styled from 'styled-components';
import {pageTitle} from '../../recoil/atoms';
import {currentSession} from '../../recoil/selectors';
import {useRecoilValue} from 'recoil';
import {FaUserCircle} from 'react-icons/fa';

const Header = styled.header`
    border-bottom: 3px solid ${props => props.theme.border.green};
    display: flex;
    flex-direction: row;
    padding: 0.5rem 2rem;
    background: white;

    nav {
      flex-grow: 2;
    }
`;

const Title = styled.h1`
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0;
`;

const SubTitle = styled.span`
    font-size: 1.5rem;
    font-weight: normal;
    margin-left: 1.5rem;
    color: #222;
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
            <Title>
                <span>FT-Lab:</span>
                <SubTitle>{subtitle}</SubTitle>
            </Title>
            <nav></nav>
            {session && <Account session={session} />}
        </Header>
    )
}