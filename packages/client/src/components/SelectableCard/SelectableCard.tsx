import React from 'react';
import styled from 'styled-components';

export const Card = styled.div`
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 3px;
    padding: 1rem;
    box-shadow: 2px 2px 5px #ddd;
    cursor: pointer;

    &.selected {
        background: ${props => props.theme.background.selection};
    }
`;

export const CardTitle = styled.h1`
    font-size: 1.1rem;
    font-weight: bold;
    margin-top: 0;
    margin-bottom: 0.5rem;
`;

export const Grid = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
`;

interface Props {
    onClick: () => void;
    selected: boolean;
    children: React.ReactNode;
}

export function SelectableCard({onClick, selected, children}: Props) {
    return <Card onClick={onClick} className={selected ? 'selected' : ''}>
        {children}
    </Card>
}
