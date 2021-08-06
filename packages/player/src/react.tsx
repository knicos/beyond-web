import React, {useRef, useState, useEffect} from 'react';
import {FTLPlayer} from './player';
import {FTLStream} from '@ftl/stream';

interface Props {
    stream: FTLStream;
}

export function ReactPlayer({stream}: Props) {
    const ref = useRef();
    const [state] = useState({player: null});

    useEffect(() => {
        state.player = new FTLPlayer(ref.current);
    }, []);

    useEffect(() => {
        if (stream) {
            stream.enableVideo(0, 0, 0);
            stream.on('packet', (spkt, pkt) => {
                if (state.player && spkt[3] < 34) {
                    state.player.push(spkt, pkt);
                }
            });
        }
    }, [stream]);

    return <div style={{width: '640px', height: '480px'}} ref={ref} onClick={() => {
        if (state.player) {
            state.player.play();
        }
    }} />;
}
