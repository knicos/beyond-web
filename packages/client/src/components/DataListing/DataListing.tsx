import React from 'react';
import styled from 'styled-components';
import { FTLStream } from '@ftl/stream';
import { ChannelComponent } from '../ChannelComponent';
import { useRecoilValue } from 'recoil';
import {pinnedData} from '../../recoil/atoms';

const Title = styled.h1`
  margin: 1rem 0;
  font-size: 1.1rem;
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

function insertDataItem(nodes: JSX.Element[], value: unknown, key: number, onChange: (channel: number, value: unknown) => void): void {
    nodes.push(<ChannelComponent key={key} channel={key} value={value} onChange={onChange} hideEditable={true} />);
}

function renderData(data: Map<number, any>, pinned: Set<number>, onChange: (channel: number, value: unknown) => void): JSX.Element[] {
    const nodes: JSX.Element[] = [];

    data.forEach((value, key) => {
        if (pinned.has(key)) {
            insertDataItem(nodes, value, key, onChange)
        }
    });

    data.forEach((value, key) => {
        if (!pinned.has(key)) {
            insertDataItem(nodes, value, key, onChange)
        }
    });
    return nodes;
}

interface Props {
    stream: FTLStream;
    time: number;
}

export default function DataListing({stream, time}: Props) {
    const pinned = useRecoilValue<Set<number>>(pinnedData);

    return <>
        <Title>Data Stream</Title>
        <Container>
            <Table>
                {renderData(stream.data, pinned, (channel: number, value: unknown) => {
                    stream.set(channel, value);
                })}
            </Table>
        </Container>
    </>;
}
