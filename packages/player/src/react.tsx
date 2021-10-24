import React, {useRef, useState, useEffect} from 'react';
import {FTLPlayer} from './player';
import {FTLStream} from '@ftl/stream';
import styled from 'styled-components';
import {FaPause, FaPlay, FaSpinner} from 'react-icons/fa';

const Container = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    background-size: 100%;
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
    movement?: boolean;
    frameset: number;
    frame: number;
    image?: string;
    title?: string;
}

type PlayerMode = 'waiting' | 'paused' | 'playing';

type ModeState = [PlayerMode, (mode: PlayerMode) => void];

export function ReactPlayer({stream, channel, movement, onSelectPoint, points, image}: Props) {
    const ref = useRef();
    const [state] = useState<{player: FTLPlayer}>({player: null});
    const [mode, setMode]: ModeState = useState<PlayerMode>(stream?.found ? 'paused' : 'waiting');

    useEffect(() => {
        state.player = new FTLPlayer(ref.current);
        state.player.on('reset', () => {
            // Need to request a keyframe now
            stream.keyframe();
        });
        state.player.on('select', (x: number, y: number) => {
            if (onSelectPoint) {
                onSelectPoint(x, y);
            }
        });
        state.player.on('pose', (pose) => {
          console.log('Got new pose', pose);
        });

        state.player.play();
    }, []);

    useEffect(() => {
        if (state.player) {
            state.player.reset();
        }
    }, [channel]);

    useEffect(() => {
        if (points && state.player) {
            state.player.setPoints(points);
        }
    }, [points, state.player]);

    useEffect(() => {
        if (stream) {
            // FIXME: What if the stream changes!!
            //stream.enableVideo(0, 0, channel || 0);
            stream.on('packet', (spkt, pkt) => {
                const [_, fsid, fid, chan] = spkt;
                if (state.player && fsid === 0 && fid === 0 && (chan === channel || (channel >= 32 && channel < 34))) {
                    state.player.push(spkt, pkt);
                }
            });
            stream.on('stopped', () => {
                state.player.hardReset();
                setMode('waiting');
            });
            stream.on('ready', () => {
                state.player.reset();
                setMode(state.player.isActive() ? 'playing' : 'paused');
            });
            stream.enableVideo(0, 0, channel || 0);
            stream.start(0, 0, channel || 0);
        }
    }, [stream]);

    if (state.player) {
      state.player.enableMovement = movement || false;
    }

    let button: JSX.Element = null;
    switch(mode) {
        case 'paused':
            button = <FaPlay onClick={async () => {
                if (state.player) {
                    state.player.reset();
                    stream.enableVideo(0, 0, channel || 0);
                    state.player.play();
                    stream.start(0, 0, channel || 0);
                    setMode('playing');
                    console.log('PLAY');
                }
            }} />;
            break;
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
