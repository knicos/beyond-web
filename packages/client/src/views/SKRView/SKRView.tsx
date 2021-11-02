import React from 'react';
import styled from 'styled-components';
import {ReactPlayer} from '@ftl/player';
import {useRecoilValue} from 'recoil';
import {currentStream, frameTime} from '../../recoil/atoms';
import DataListing from '../../components/DataListing';
import {FTLStream} from '@ftl/stream';
import {MenuBar} from './MenuBar';

//const DataListing = React.lazy(() => import('../../components/DataListing'));

const Main = styled.section`
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(6, minmax(6rem, 1fr));
    grid-gap: 1rem;
`;

const Card = styled.div`
    background: white;
    padding: 1rem;

    &.menu {
        grid-column: span 6;
        padding: 0.5rem;
    }

    &.main {
        grid-column: span 4;
        background: none;
    }

    &.side {
        grid-column: span 2;
    }
`;

const PlayerContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const VideoContainer = styled.div`
    background: black;
    border-radius: 3px;
    box-shadow: 2px 2px 8px #666;
    width: 100%;
`;

const StatsBar = styled.div`
    width: 100%;
    padding: 1rem;
`;

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 60 / 60);
    const minutes = Math.floor((seconds - hours * 60 * 60) / 60);
    const s = seconds - hours * 60 * 60 - minutes * 60;
    return `${hours}:${minutes}:${s.toFixed(1)}`;
}

function generatePoints(stream: FTLStream): [number, number][] {
    const focalPoint = stream.data.get(1026);

    if (focalPoint?.length === 2 && focalPoint[0]) {
        const disparity = stream.data.get(1025);
        if (disparity) {
            return [focalPoint, [focalPoint[0] - disparity + stream.getWidth(), focalPoint[1]]];
        } else {
            return [focalPoint];
        }
    }
}

export function SKRView() {
    const stream = useRecoilValue(currentStream);
    const time = useRecoilValue(frameTime);
    const seconds = stream ? ((time - stream.startTimestamp) / 1000) : 0;

    if (!stream) {
        return null;
    }

    const points = generatePoints(stream);

    return <Main>
        <Card className="menu">
            <MenuBar stream={stream} />
        </Card>
        <Card className="main">
            <PlayerContainer>
                <VideoContainer>
                    <ReactPlayer
                      stream={stream}
                      channel={21}
                      size={800}
                      onSelectPoint={(x, y) => {
                        console.log('Point select', x, y);
                        stream.set(1026, [x, y]);
                      }}
                      points={points}
                      frameset={0}
                      frame={0}
                    />
                </VideoContainer>
                <StatsBar>
                    {`Time: ${formatTime(seconds)}`}
                </StatsBar>
            </PlayerContainer>
        </Card>
        <Card className="side">
            <DataListing stream={stream} time={time} />
        </Card>
    </Main>;
}