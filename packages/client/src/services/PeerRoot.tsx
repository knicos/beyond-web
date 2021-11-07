import React, {useEffect, useState} from 'react';
import {Peer} from '@ftl/protocol';
import {currentStream, peer} from '../recoil/atoms';
import {currentSession} from '../recoil/selectors';
import {useSetRecoilState, useRecoilValue} from 'recoil';
// import qs from 'query-string';

export function PeerRoot(): React.ReactElement {
    const [pingInterval, setPingInterval] = useState(null);
    const setPeer = useSetRecoilState(peer);
    // const setStreams = useSetRecoilState(streamList);
    const setStream = useSetRecoilState(currentStream);
    const session = useRecoilValue(currentSession);

    const createPeer = () => {
        if (!session) {
          return;
        }

        const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${protocol}://${location.host}${process.env.ASSET_PATH}v1/socket`);
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
            const checkLatency = () => {
              const pingTime = Date.now();
              peer.rpc('__ping__', (ts: number) => {
                const latency = (Date.now() - pingTime) / 2;
                peer.latency = latency;
              });
            };
            setPingInterval(setInterval(checkLatency, 5000));
            checkLatency();
            /*peer.rpc('list_streams', (streams: string[]) => {
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
            });*/
        });

        peer.on('disconnect', () => {
            if (pingInterval) clearInterval(pingInterval);
            setPeer(null);
            setStream(null);
            setPingInterval(null);
            setTimeout(createPeer, 1000);
            console.log('Socket disconnect');
        });
    }

    useEffect(createPeer, [session]);

    return null;
}
