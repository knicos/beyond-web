import React, {useEffect} from 'react';
import styled from 'styled-components';
import {ReactPlayer} from '@ftl/player';
import {useRecoilValue, useSetRecoilState, useRecoilState} from 'recoil';
import {currentStream, frameTime, pageTitle, peer} from '../../recoil/atoms';
import {DataListing} from './DataListing';
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
        grid-column: span 3;
        background: none;
    }

    &.side {
        grid-column: span 3;
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

export function SKRView() {
    const p: Peer = useRecoilValue(peer);
    const [stream, setStream] = useRecoilState(currentStream);
    const time = useRecoilValue(frameTime);
    const seconds = stream ? ((time - stream.startTimestamp) / 1000) : 0;
    const setTitle = useSetRecoilState(pageTitle);
    const params = qs.parse(useLocation().search);

    useEffect(() => {
        setTitle(`SKR [${stream?.uri.split('?')[0] || ''}]`);
    }, []);

    useEffect(() => {
        if (!p) {
            return;
        }
        if (stream?.uri !== params.s) {
            console.error('Stream is not correct', params);
            const s = new FTLStream(p, params.s as string);
            s.enableVideo(0, 0, 21);
            setStream(s);
        }
    }, [stream, p]);

    if (!stream) {
        return null;
    }

    const focalPoint = stream.data.get(1026);

    return <Main>
        <Card className="menu">
            <MenuBar stream={stream} />
        </Card>
        <Card className="main">
            <PlayerContainer>
                <VideoContainer>
                    <ReactPlayer stream={stream} channel={21} size={800} onSelectPoint={(x, y) => {
                        console.log('Point select', x, y);
                        stream.set(1026, [x, y]);
                    }} points={focalPoint?.length === 2 && focalPoint[0] && [focalPoint]} />
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