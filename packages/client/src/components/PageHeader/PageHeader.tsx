import React from 'react';
import styled from 'styled-components';

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

export function PageHeader() {
    return (
        <Header>
            <Title>FT-Lab</Title>
            <nav></nav>
        </Header>
    )
}