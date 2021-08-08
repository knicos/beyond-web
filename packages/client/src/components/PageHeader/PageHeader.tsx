import React from 'react';
import styled from 'styled-components';
import {pageTitle} from '../../recoil/atoms';
import {useRecoilValue} from 'recoil';

const Header = styled.header`
    border-bottom: 3px solid ${props => props.theme.border.green};
    display: flex;
    flex-direction: column;
    padding: 0.5rem 2rem;
    background: white;
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

export function PageHeader() {
    const subtitle = useRecoilValue(pageTitle);
    return (
        <Header>
            <Title>
                <span>FT-Lab:</span>
                <SubTitle>{subtitle}</SubTitle>
            </Title>
            <nav></nav>
        </Header>
    )
}