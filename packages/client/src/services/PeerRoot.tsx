import React, {useEffect, useState} from 'react';
import {Peer} from '@beyond/protocol';
import {currentStream, peer} from '../recoil/atoms';
import {currentSession} from '../recoil/selectors';
import {useRecoilState, useSetRecoilState, useRecoilValue} from 'recoil';
// import qs from 'query-string';

export function PeerRoot(): React.ReactElement {
    const [pingInterval, setPingInterval] = useState(null);
    const [oldPeer, setPeer] = useRecoilState<Peer>(peer);
    // const setStreams = useSetRecoilState(streamList);
    const setStream = useSetRecoilState(currentStream);
    const session = useRecoilValue(currentSession);

    const createPeer = () => {
        if (!session) {
          return;
        }

        setPeer((currPeer) => {
          console.log('Create peer', currPeer);

          if (currPeer) return currPeer;

          const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
          const ws = new WebSocket(`${protocol}://${location.host}${process.env.ASSET_PATH}v1/socket`);
          ws.binaryType = "arraybuffer";
          const peer = new Peer(ws as any);
          // setPeer(peer);

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
              const checkLatency = async () => {
                const pingTime = Date.now();
                await peer.rpc('__ping__');
                const latency = (Date.now() - pingTime) / 2;
                peer.latency = latency;
                console.log('PING', latency);
              };
              setPingInterval(setInterval(checkLatency, 5000));
              checkLatency();
              console.log('Peer has connected');
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
              clearInterval(pingInterval);
              setPeer(null);
              setStream(null);
              //setPingInterval(null);
              setTimeout(createPeer, 1000);
              console.log('Socket disconnect');
          });

          peer.bind('event', (name: string) => {
            console.log('Service Event', name);
          });

          return peer;
        });
    }

    useEffect(createPeer, [session?.id]);

    return null;
}
