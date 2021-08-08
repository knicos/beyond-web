import React, {useEffect} from 'react';
import {useRecoilValue, useRecoilState, useSetRecoilState} from 'recoil';
import {currentStream, peer, streamList, pageTitle} from '../../recoil/atoms';
import {useHistory} from 'react-router';
import {FTLStream} from '@ftl/stream';
import {SelectableCard, Grid} from '../../components/SelectableCard/SelectableCard';

function StreamCard({name, uri}: {name: string, uri: string}) {
    const setTitle = useSetRecoilState(pageTitle);
    const history = useHistory();
    const p = useRecoilValue(peer);
    const [stream, setStream] = useRecoilState(currentStream);
    const isCurrent = stream?.uri === uri;

    useEffect(() => {
        setTitle('Select Stream');
    }, []);

    return <SelectableCard onClick={async () => {
        if (p) {
            const s = new FTLStream(p, uri.split('?')[0]);
            s.enableVideo(0, 0, 0);
            setStream(s);
            history.push('/apps');
        }
    }} selected={isCurrent}>
        {name}
    </SelectableCard>
}

export function StreamIndex() {
    const streams = useRecoilValue(streamList);
    return <Grid>
        {streams.map((s, ix) => <StreamCard key={ix} {...s} />)}
    </Grid>;
}
