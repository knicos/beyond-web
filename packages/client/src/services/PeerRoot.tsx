import React, {useEffect, useState} from 'react';
import {Peer} from '@beyond/protocol';
import {currentStream, peer} from '../recoil/atoms';
import {currentSession} from '../recoil/selectors';
import {useSetRecoilState, useRecoilValue} from 'recoil';

export function PeerRoot(): React.ReactElement {
    const [pingInterval, setPingInterval] = useState(null);
    const setPeer = useSetRecoilState<Peer>(peer);
    const setStream = useSetRecoilState(currentStream);
    const session = useRecoilValue(currentSession);

    const createPeer = () => {
        if (!session) {
          return;
        }

        setPeer((currPeer) => {
          // Ensure it is only created once
          if (currPeer && currPeer.status !== 3) return currPeer;

          const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
          const ws = new WebSocket(`${protocol}://${location.host}${process.env.ASSET_PATH}v1/socket`);
          ws.binaryType = "arraybuffer";
          const peer = new Peer(ws as any);

          peer.bind('node_details', () => {
              return [`{"title": "FTL Web-App", "id": "${peer.getUuid()}", "kind": "master"}`];
          });

          // Not supported by a web application
          peer.bind('add_stream', (uri: string) => {});

          peer.bind('__ping__', () => {
              return Date.now();
          });

          peer.on('connect', () => {
              const checkLatency = async () => {
                const pingTime = Date.now();
                await peer.rpc('__ping__');
                const latency = (Date.now() - pingTime) / 2;
                peer.latency = latency;
              };
              setPingInterval(setInterval(checkLatency, 5000));
              checkLatency();
          });

          peer.on('disconnect', () => {
              clearInterval(pingInterval);
              setPeer(null);
              setStream(null);
              // Try again in 1 second
              setTimeout(createPeer, 1000);
          });

          peer.bind('event', (name: string) => {});

          return peer;
        });
    }

    // Whenever the logged in user changes, create the peer
    useEffect(createPeer, [session?.id]);

    return null;
}
