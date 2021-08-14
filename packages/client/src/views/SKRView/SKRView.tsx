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
    }

    &.main {
        grid-column: span 4;
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
    box-shadow: 2px 2px 5px #aaa;
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

    return <Main>
        <Card className="menu">
            SKR Menu Bar
        </Card>
        <Card className="main">
            <PlayerContainer>
                <VideoContainer onClick={e => {
                    console.log(e);
                    if (stream) {
                        const target = e.target as any;
                        const x = (e.clientX - target.offsetLeft) / target.clientWidth * stream.getWidth();
                        const y = (e.clientY - target.offsetTop) / target.clientHeight * stream.getHeight();
                        stream.set(1026, [Math.floor(x), Math.floor(y)]);
                    }
                }}>
                    <ReactPlayer stream={stream} channel={21} />
                </VideoContainer>
                <StatsBar>
                    {`Time: ${formatTime(seconds)}`}
                </StatsBar>
            </PlayerContainer>
        </Card>
        <Card className="side">
            <DataListing stream={stream} time={time} />
            <button onClick={() => stream.set(1027, "right")}>Test</button>
        </Card>
    </Main>;
}