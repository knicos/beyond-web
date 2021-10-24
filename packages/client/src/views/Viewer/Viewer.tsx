import React, {useEffect, useState} from 'react';
import {Router} from './router';
import {useRecoilValue, useRecoilState} from 'recoil';
import {currentStream, peer} from '../../recoil/atoms';
import {useLocation} from 'react-router';
import qs from 'query-string';
import {FTLStream} from '@ftl/stream';
import {Peer} from '@ftl/protocol';
import {IStream, getStream} from '../../api/streams';

export function Viewer() {
  const p: Peer = useRecoilValue(peer);
  const [stream, setStream] = useRecoilState(currentStream);
  const params = qs.parse(useLocation().search);
  const [streamData, setStreamData] = useState<IStream>(null);

  useEffect(() => {
    if (params.id) {
      getStream(params.id as string).then(setStreamData);
    }
  }, [params.id]);

  useEffect(() => {
    if (!p) {
        return () => {};
    }
    if (stream?.uri !== params.s) {
        console.error('Stream is not correct', params);
        if (stream && stream.active) {
          console.error('Current stream is still active', stream.uri);
        }
        const s = new FTLStream(p, params.s as string);
        s.enableVideo(0, 0, 21);
        setStream(s);

        return () => {
          console.info('Destroy stream', s.uri);
          s.destroy();
          setStream(null);
        }
    }
  }, [p]);

  if (!stream) {
      return null;
  }

  return <Router data={streamData} />;
}
