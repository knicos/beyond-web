import React from 'react';
import styled from 'styled-components';
import manifest from './manifest.json';
import { FTLStream } from '@ftl/stream';
import {components} from './components';

const Title = styled.h1`
    margin: 0.5rem;
    font-size: 1.2rem;
`;

function renderData(data: Map<number, any>): JSX.Element[] {
    const nodes: JSX.Element[] = [];
    data.forEach((value, key) => {
        const manEntry = (manifest as any)[`${key}`];
        if (manEntry) {
            const Comp = components[manEntry.component];
            nodes.push(<Comp key={key} data={value} config={manEntry} />);
        }
    });
    return nodes;
}

interface Props {
    stream: FTLStream;
    time: number;
}

export function DataListing({stream, time}: Props) {
    return <>
        <Title>Data</Title>
        {renderData(stream.data)}
    </>;
}