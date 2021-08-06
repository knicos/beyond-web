import React, {useRef, useState, useEffect} from 'react';
import {FTLMSE} from './mse';
import {FTLStream} from '@ftl/stream';

interface Props {
    stream: FTLStream;
}

export function ReactPlayer({stream}: Props) {
    const ref = useRef();
    const [mse] = useState({mse: null});

    useEffect(() => {
        mse.mse = new FTLMSE(ref.current);
        mse.mse.select(0, 0, 0);
    }, [ref.current]);

    useEffect(() => {
        if (stream) {
            stream.enableVideo(0, 0, 0);
            stream.on('packet', (spkt, pkt) => {
                //console.log('MSE packet', spkt[3]);
                if (mse.mse && spkt[3] < 34) {
                    mse.mse.push(spkt, pkt);
                }
            });
        }
    }, [stream]);

    return <video ref={ref} />;
}
