import React, {useRef, useState, useEffect} from 'react';
import { FTLMSE } from './mse';

export function ReactPlayer() {
    const ref = useRef();
    const [mse, setMse] = useState(null);

    useEffect(() => {
        setMse(new FTLMSE(ref.current));
    }, [ref.current]);

    return <video ref={ref} />;
}
