import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import {ReactPlayer} from '@ftl/player';
import {useRecoilValue, useSetRecoilState, useRecoilState} from 'recoil';
import {currentStream, frameTime, pageTitle, peer} from '../../recoil/atoms';
import {DataListing} from '../../components/DataListing';
import {useLocation} from 'react-router';
import qs from 'query-string';
import {FTLStream} from '@ftl/stream';
import {Peer} from '@ftl/protocol';
import {MenuBar} from './MenuBar';

const Main = styled.section`
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(6, minmax(6rem, 1fr));
    grid-template-rows: repeat(auto-fit, minmax(1rem, 1fr));
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

export function DeveloperView() {
    const p: Peer = useRecoilValue(peer);
    const [stream, setStream] = useRecoilState(currentStream);
    const time = useRecoilValue(frameTime);
    const seconds = stream ? ((time - stream.startTimestamp) / 1000) : 0;
    const setTitle = useSetRecoilState(pageTitle);
    const params = qs.parse(useLocation().search);
    const [channel, setChannel] = useState(0);

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
                      channel={channel}
                      size={800}
                      onSelectPoint={(x, y) => {
                          stream.set(1026, [x, y]);
                      }}
                      points={points}
                      frameset={0}
                      frame={0}
                    />
                </VideoContainer>
                <StatsBar>
                    <select onChange={e => {
                        const newChannel = parseInt(e.target.value);
                        stream.disableVideo(0, 0, channel);
                        stream.enableVideo(0, 0, newChannel);
                        setChannel(newChannel);
                    }}>
                        <option value={0}>Colour</option>
                        <option value={1}>Depth</option>
                        <option value={2}>Right</option>
                        <option value={21}>Overlay</option>
                    </select>
                    {`Time: ${formatTime(seconds)}`}
                </StatsBar>
            </PlayerContainer>
        </Card>
        <Card className="side">
            <DataListing stream={stream} time={time} />
        </Card>
    </Main>;
}
