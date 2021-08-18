import React from 'react';
import styled from 'styled-components';
import manifest from './manifest.json';
import { FTLStream } from '@ftl/stream';
import {components, DataItem} from './components';

const Title = styled.h1`
    margin: 0.5rem;
    font-size: 1.2rem;
`;

const Container = styled.div`
    flex-grow: 2;
`;

const Table = styled.div`
    display: grid;
    grid-template-columns: 1fr 3fr;
    grid-template-rows: repeat(auto-fit, minmax(1rem, 1fr));
    grid-gap: 2px;
`;

function renderData(data: Map<number, any>, onChange: (channel: number, value: unknown) => void): JSX.Element[] {
    const nodes: JSX.Element[] = [];
    data.forEach((value, key) => {
        const manEntry = (manifest as any)[`${key}`] || (manifest as any).default;
        if (manEntry) {
            const Comp = components[manEntry.component];
            nodes.push(<Comp key={key} channel={key} data={value} config={manEntry} onChange={onChange} />);
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
        <Container>
            <Table>
                <DataItem name="Channels" value={Array.from(stream.availableChannels).join(',')} />
                <DataItem name="Sets" value={Array.from(stream.availableSets).join(',')} />
                <DataItem name="Sources" value={Array.from(stream.availableSources).join(',')} />
                {renderData(stream.data, (channel: number, value: unknown) => {
                    stream.set(channel, value);
                })}
            </Table>
        </Container>
    </>;
}