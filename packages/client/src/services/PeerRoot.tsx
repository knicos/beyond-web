import React, {useEffect} from 'react';
import {Peer} from '@ftl/protocol';
import {currentStream, peer, streamList} from '../recoil/atoms';
import {useSetRecoilState} from 'recoil';
import qs from 'query-string';

export function PeerRoot(): React.ReactElement {
    const setPeer = useSetRecoilState(peer);
    const setStreams = useSetRecoilState(streamList);
    const setStream = useSetRecoilState(currentStream);

    const createPeer = () => {
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

        peer.bind('__ping__', () => {
            return Date.now();
        });

        peer.on('connect', () => {
            setPeer(peer);
            peer.rpc('list_streams', (streams: string[]) => {
                console.log('Stream list', streams);
                const mapped = streams.map(s => {
                    const split = s.split('?');
                    const p = split.length > 1 ? qs.parse(split[1]) : {};
                    return {
                        name: s,
                        ...p,
                        uri: s,
                    };
                });
                setStreams(old => [...old, ...mapped]);
            });
        });

        peer.on('disconnect', () => {
            setPeer(null);
            setStream(null);
            setTimeout(createPeer, 1000);
        });
    }

    useEffect(createPeer, []);

    return null;
}
