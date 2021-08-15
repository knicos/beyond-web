import React, {useRef, useState, useEffect} from 'react';
import {FTLPlayer} from './player';
import {FTLStream} from '@ftl/stream';
import styled from 'styled-components';
import {FaPause, FaPlay, FaSpinner} from 'react-icons/fa';

const Container = styled.div`
    position: relative;
`;

const ControlBar = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2rem;
    color: white;
    font-size: 1.5rem;
    padding: 0.5rem 1rem;
`;

const Spinner = styled(FaSpinner)`
    animation: spin 1s steps(8) infinite;

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(360deg);
        }
    }
`;

interface Props {
    stream: FTLStream;
    channel: number;
    size: number;
}

type PlayerMode = 'waiting' | 'paused' | 'playing';

type ModeState = [PlayerMode, (mode: PlayerMode) => void];

export function ReactPlayer({stream, channel, size}: Props) {
    const ref = useRef();
    const [state] = useState({player: null});
    const [mode, setMode]: ModeState = useState<PlayerMode>('waiting');

    useEffect(() => {
        state.player = new FTLPlayer(ref.current);
        state.player.select(0, 0, channel || 0);
        console.log('Select channel', channel || 0);
        state.player.mse.on('reset', () => {
            console.log('RESET');
            stream.start(0, 0, channel || 0);
        });
    }, []);

    useEffect(() => {
        if (stream) {
            //stream.enableVideo(0, 0, channel || 0);
            stream.on('packet', (spkt, pkt) => {
                if (state.player && spkt[3] < 34) {
                    state.player.push(spkt, pkt);
                }
            });
            stream.on('stopped', () => {
                //stream.disableVideo(0, 0, channel || 0);
                //state.player.pause();
                setMode('waiting');
            });
            stream.on('started', () => {
                state.player.select(0, 0, channel || 0);
                //stream.enableVideo(0, 0, channel || 0);
                stream.start(0, 0, channel || 0);
                setMode('paused');
            });
            stream.enableVideo(0, 0, channel || 0);
            stream.start(0, 0, channel || 0);
        }
    }, [stream]);

    const aspect = 9 / 16;

    // console.log('MODE', mode);

    let button = <Spinner />;
    switch(mode) {
        case 'paused':
            button = <FaPlay onClick={() => {
                if (state.player) {
                    //stream.enableVideo(0, 0, channel || 0);
                    state.player.select(0, 0, channel || 0);
                    state.player.play();
                    //stream.start(0, 0, channel || 0);
                    setMode('playing');
                    console.log('PLAY');
                }
            }} />;
            break;
        case 'playing':
            button = <FaPause onClick={() => {
                if (state.player) {
                    console.log('PAUSE');
                    //state.player.pause();
                    //stream.disableVideo(0, 0, channel || 0);
                    setMode('paused');
                }
            }} />;
            break;
    }

    return (
        <Container>
            <div style={{width: `${size}px`, height: `${Math.floor(size * aspect)}px`}} ref={ref} />
            <ControlBar>
                {button}
            </ControlBar>
        </Container>
    );
}
