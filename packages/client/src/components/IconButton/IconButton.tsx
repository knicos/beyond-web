import React from 'react';
import styled from 'styled-components';

const Container = styled.button`
    display: flex;
    appearance: none;
    border: none;
    border-radius: 3px;
    padding: 0.5rem;
    font: inherit;
	cursor: pointer;
	outline: inherit;
    font-size: 1.2rem;
`;

interface Props {
    onClick: () => void;
    children: React.ReactNode;
}

export function IconButton({onClick, children}: Props) {
    return (
        <Container onClick={onClick}>
            {children}
        </Container>
    )
}
