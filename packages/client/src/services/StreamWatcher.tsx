import React, {useEffect} from 'react';
import {currentStream, frameTime} from '../recoil/atoms';
import {useRecoilValue, useSetRecoilState} from 'recoil';

export function StreamWatcher(): React.ReactElement {
    const stream = useRecoilValue(currentStream);
    const setFrameTime = useSetRecoilState(frameTime);

    useEffect(() => {
        if (stream) {
            stream.on('frameStart', (ts: number) => {
                setFrameTime(ts);
            });
            setFrameTime(0);
        }
    }, [stream]);

    return null;
}
