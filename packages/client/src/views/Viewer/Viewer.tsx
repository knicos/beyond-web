import React, {useEffect, useState} from 'react';
import {Router} from './router';
import {useRecoilValue, useRecoilState} from 'recoil';
import {currentStream, peer} from '../../recoil/atoms';
import {useLocation} from 'react-router';
import qs from 'query-string';
import {FTLStream} from '@ftl/stream';
import {Peer} from '@beyond/protocol';
import {IStream, getStream} from '../../api/streams';

export function Viewer() {
  const p: Peer = useRecoilValue(peer);
  const [stream, setStream] = useRecoilState<FTLStream>(currentStream);
  const params = qs.parse(useLocation().search);
  const [streamData, setStreamData] = useState<IStream>(null);

  useEffect(() => {
    if (params.id) {
      getStream(params.id as string).then(setStreamData);
    }
  }, [params.id]);

  useEffect(() => {
    if (!p || p.status !== 2) {
        return () => {};
    }

    setStream((oldStream) => {
      if (oldStream?.uri !== params.s) {
        console.error('Stream is not correct', params);
        if (oldStream && oldStream.active) {
          console.error('Current stream is still active', stream.uri);
        }
        const s = new FTLStream(p, params.s as string);
        s.enableVideo(0, 0, 21);
        return s;
      } else {
        return oldStream;
      }
    });

    return () => {
      if (stream) {
        console.info('Destroy stream', stream.uri);
        stream.destroy();
        setStream(null);
      }
    }
  }, [p, p?.status]);

  if (!stream) {
      return null;
  }

  return <Router data={streamData} />;
}
