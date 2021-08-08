import React from 'react';
import styled from 'styled-components';
import manifest from './manifest.json';
import { FTLStream } from '@ftl/stream';
import {components} from './components';

const Title = styled.h1`
    margin: 0.5rem;
    font-size: 1.2rem;
`;

const Table = styled.div`
    display: grid;
    grid-template-columns: 1fr 2fr;
    grid-template-rows: repeat(auto-fit, minmax(1rem, 1fr));
    grid-gap: 2px;
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
        <Table>
            {renderData(stream.data)}
        </Table>
    </>;
}