import React, {useRef, useState, useEffect} from 'react';
import {FTLPlayer} from './player';
import {FTLStream} from '@ftl/stream';
import styled from 'styled-components';
import {FaPause, FaPlay, FaSpinner} from 'react-icons/fa';

const Container = styled.div`
    position: relative;
    width: 100%;
`;

const ControlBox = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
    color: white;
    font-size: 3rem;
    display: flex;
    justify-content: space-around;
    align-items: center;
    background: #00000050;
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
    onSelectPoint?: (x: number, y: number) => void;
    points?: [number, number][];
}

type PlayerMode = 'waiting' | 'paused' | 'playing';

type ModeState = [PlayerMode, (mode: PlayerMode) => void];

export function ReactPlayer({stream, channel, size, onSelectPoint, points}: Props) {
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
        state.player.on('select', (x: number, y: number) => {
            if (onSelectPoint) {
                onSelectPoint(x, y);
            }
        })
    }, []);

    useEffect(() => {
        if (state.player) {
            state.player.select(0, 0, channel || 0);
            console.log('Select channel', channel || 0);
        }
    }, [channel]);

    useEffect(() => {
        if (points && state.player) {
            state.player.setPoints(points);
        }
    }, [points, state.player]);

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
                setMode(state.player.mse.active ? 'playing' : 'paused');
            });
            stream.enableVideo(0, 0, channel || 0);
            stream.start(0, 0, channel || 0);
        }
    }, [stream]);

    const aspect = 9 / 16;

    // console.log('MODE', mode);

    let button: JSX.Element = null; //<Spinner />;
    switch(mode) {
        case 'paused':
            button = <FaPlay onClick={async () => {
                if (state.player) {
                    stream.enableVideo(0, 0, channel || 0);
                    state.player.select(0, 0, channel || 0);
                    await state.player.play();
                    stream.start(0, 0, channel || 0);
                    setMode('playing');
                    console.log('PLAY');
                }
            }} />;
            break;
        /*case 'playing':
            button = <FaPause onClick={() => {
                if (state.player) {
                    console.log('PAUSE');
                    //state.player.pause();
                    stream.disableVideo(0, 0, channel || 0);
                    setMode('paused');
                }
            }} />;
            break;*/
        case 'waiting':
            button = <Spinner />;
            break;
    }

    return (
        <Container>
            <div style={{width: '100%'}} ref={ref} />
            {button && <ControlBox>
                {button}
            </ControlBox>}
        </Container>
    );
}
