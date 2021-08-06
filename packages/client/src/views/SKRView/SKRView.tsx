import React from 'react';
import styled from 'styled-components';
import {ReactPlayer} from '@ftl/player';
import {useRecoilValue} from 'recoil';
import {currentStream} from '../../recoil/atoms';

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
        grid-column: span 5;
    }

    &.side {
        grid-column: span 1;
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

export function SKRView() {
    const stream = useRecoilValue(currentStream);

    return <Main>
        <Card className="menu">
            SKR Menu Bar
        </Card>
        <Card className="main">
            <PlayerContainer>
                <VideoContainer>
                    <ReactPlayer stream={stream} />
                </VideoContainer>
            </PlayerContainer>
        </Card>
        <Card className="side">
            Side panel
        </Card>
    </Main>;
}