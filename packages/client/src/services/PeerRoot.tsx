import React, {useEffect} from 'react';
import {Peer} from '@ftl/protocol';
import {peer} from '../recoil/atoms';
import {useSetRecoilState} from 'recoil';

export function PeerRoot(): React.ReactElement {
    const setPeer = useSetRecoilState(peer);

    useEffect(() => {
        console.log("HOST", location.host);
        const ws = new WebSocket(`ws://${location.host}/v1/stream`);
        ws.binaryType = "arraybuffer";
        const peer = new Peer(ws as any);
        peer.bind('node_details', () => {
            return [`{"title": "FTL Web-App", "id": "${peer.getUuid()}", "kind": "master"}`];
        });

        peer.bind('add_stream', (uri: string) => {
            console.log('ADD STREAM', uri);
        });

        setPeer(peer);
    }, []);

    return null;
}
