import React from 'react';
import styled from 'styled-components';
import { FTLStream } from '@ftl/stream';
import { formatTime } from '../../lib/time';

const CHANNEL_NAMES: any = {
  0: "Colour",
  1: "Depth",
  2: "Right",
  5: "Normals",
  6: "Weights",
  7: "Confidence",
  11: "Mask",
  13: "Support",
  21: "Overlay",
  22: "Groundtruth",
};

const CAP_NAMES: any = {
  0: "Movable",
  1: "Active",
  2: "Video",
  3: "Adjustable",
  4: "Virtual",
  5: "Touch",
  6: "VR",
  7: "Live",
  8: "Fused",
  9: "Streamed",
};

const Title = styled.h1`
    margin: 1rem 0;
    font-size: 1.1rem;
`;

const Container = styled.div`
    flex-grow: 2;
`;

const Tag = styled.div`
  padding: 0.2rem 0.6rem;
  background: ${props => props.theme.background.contrastBlue};
  margin: 0.2rem;
  border-radius: 3px;
  color: white;
  font-size: 0.8rem;
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const Table = styled.div`
    display: grid;
    grid-template-columns: 1fr 3fr;
    grid-template-rows: repeat(auto-fit, minmax(1rem, 1fr));
    grid-gap: 0.4rem;
    font-size: 0.9rem;
    align-items: center;

    label {
      color: ${props => props.theme.text.dark};
      text-align: right;
      padding-right: 1rem;
    }
`;


interface Props {
  stream: FTLStream;
  time: number;
}

export default function StreamInfo({ stream, time }: Props) {
  const {latency, fps} = stream.getStatistics();
  const [period, rx, tx] = stream.peer.getStatistics();

  const capabilities = stream.data.get(72) || [];

  return <>
        <Title>Stream Information</Title>
        <Container>
            <Table>
                <label>Channels</label>
                <TagContainer>
                  {Array.from(stream.availableChannels).map((c, ix) => <Tag key={ix}>{CHANNEL_NAMES[c] || c}</Tag>)}
                </TagContainer>
                <label>Sets</label>
                <div>{Array.from(stream.availableSets).join(',')}</div>
                <label>Sources</label>
                <div>{Array.from(stream.availableSources).join(',')}</div>
                <label>Frame Rate</label>
                <div>{`${Math.floor(fps)} fps`}</div>
                <label>Latency</label>
                <div>{`${Math.floor(latency)} ms`}</div>
                <label>Data RX</label>
                <div>{`${((rx / 1024 / 1024) / (period / 1000)).toFixed(1)} Mbps`}</div>
                <label>Duration</label>
                <div>{formatTime((time - stream.startTimestamp) / 1000)}</div>
                <label>Capabilities</label>
                <TagContainer>
                  {capabilities.map((c: number, ix: number) => <Tag key={ix}>{CAP_NAMES[c] || c}</Tag>)}
                </TagContainer>
            </Table>
        </Container>
    </>;
}
