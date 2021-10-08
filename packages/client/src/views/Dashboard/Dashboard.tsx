import React, {useEffect} from 'react';
import {useRecoilValue, useRecoilState} from 'recoil';
import {currentStream, peer, streamList, nodeList} from '../../recoil/atoms';
import {useHistory} from 'react-router';
import {FTLStream} from '@ftl/stream';
import {SelectableCard, Grid, Card, CardTitle} from '../../components/SelectableCard/SelectableCard';
import { getNodes } from '../../api';
import {Table} from '../../components/Table';
import {FaCircle} from 'react-icons/fa';

function StreamCard({name, uri}: {name: string, uri: string}) {
    const history = useHistory();
    const p = useRecoilValue(peer);
    const [stream, setStream] = useRecoilState(currentStream);
    const isCurrent = stream?.uri === uri;
    const path = process.env.ASSET_PATH;

    return <SelectableCard onClick={async () => {
        if (p) {
            const baseURI = uri.split('?')[0];
            const s = new FTLStream(p, baseURI);
            s.enableVideo(0, 0, 21);
            setStream(s);
            history.push(`${path}apps?s=${encodeURIComponent(baseURI)}`);
        }
    }} selected={isCurrent}>
        {name}
    </SelectableCard>
}

function StreamsCard({streams}: {streams: any[]}) {
  return (
    <Card>
      <CardTitle>Streams</CardTitle>
      {streams.map((s, ix) => <StreamCard key={ix} {...s} />)}
    </Card>
  )
}

function NodesCard({nodes}: {nodes: any[]}) {
  const columns = [
    {
      label: 'Active',
      fn: (data: any) => data.active ? <FaCircle color="green" /> : <FaCircle color="red" />,
    },
    {
      label: 'Name',
      fn: (data: any) => data.name || 'No Name',
    },
    {
      label: 'Location',
      fn: (data: any) => data.location || '',
    },
    {
      label: 'Latency',
      fn: (data: any) => data.latency || 'N/A',
    }
  ];

  return (
    <Card>
      <CardTitle>Nodes</CardTitle>
      <Table data={nodes} columns={columns} />
    </Card>
  )
}

export function Dashboard() {
    const streams = useRecoilValue(streamList);
    const [nodes, setNodes] = useRecoilState(nodeList);

    useEffect(() => {
      getNodes().then(setNodes);
      const interval = setInterval(() => {
        getNodes().then(setNodes);
      }, 3000);
      return () => clearInterval(interval);
    }, []);

    return <Grid>
        <NodesCard nodes={nodes} />
        <StreamsCard streams={streams} />
    </Grid>;
}
