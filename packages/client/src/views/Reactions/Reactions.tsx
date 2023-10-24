import React, {useEffect} from 'react';
import {Routes, Route, useParams, Link} from 'react-router-dom';
import {Table} from '../../components/Table';
import {useNavigate, generatePath} from 'react-router';

// could/should be removed and implemented for this view sparately
import {Card, CardTitle} from '../../components/SelectableCard/SelectableCard';

import {useRecoilValue, useRecoilState} from 'recoil';
import {QRCodeCanvas} from 'qrcode.react';

import {streamList} from '../../recoil/atoms';
import styled from 'styled-components';
import {getStreams, sendReactionToStream} from '../../api';
import {Button} from '../../components/Button';
import { FaQrcode } from 'react-icons/fa';

export const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
`;

export const Item = styled.button`
    display: block;
    width: 100%;
    font-size: 8rem;
    text-align: center;
`

export function ReactionsStreamList() {
  const [_1, setStreams] = useRecoilState(streamList);
  const navigate = useNavigate();

  useEffect(() => {
    getStreams().then(setStreams);

    const interval = setInterval(() => {
      getStreams().then(setStreams);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const path = process.env.ASSET_PATH;
  const columns = [
    {
      label: 'Url',
      fn: (data: any) => (<Link to={`stream/${data.id}`}>{data.uri}</Link>)
    },
    {
      label: 'QR Code',
      fn: (data: any) => <FaQrcode onClick={() => navigate(`qr/${data.id}`) }/>,
    },
  ];

  const streams = useRecoilValue(streamList);

  return (
    <Card>
    <CardTitle>Streams</CardTitle>
    <Table data={streams || []} columns={columns}/>
  </Card>
  );
}

export function ReactionGrid() {
  let { streamId } = useParams();

  var reactions = [
    {
      name: "laughing",
      codepoint: 0x1f600
    },
    {
      name: "rofl",
      codepoint: 0x1f923
    },
    {
      name: "smile",
      codepoint: 0x1f642
    },
    {
      name: "confused",
      codepoint: 0x1F615
    },

  ];

  return (
    <Grid>
    {
    reactions.map((val, ix) => {
      return <Item onClick={() => sendReactionToStream(streamId, val.name)} role="img">
                  {String.fromCodePoint(val.codepoint)}
             </Item>
    })}
  </Grid>
  )
}

export function RectionLink() {

  const { streamId } = useParams();
  const url = window.location.origin + '/' + generatePath('public/reactions/stream/' + streamId);
  return (
    <div>
      <div>{url}</div>
      <div style={{'padding': '2rem'}}><QRCodeCanvas value={url} size={250}/></div>
    </div>
  );
}

export function Reactions() {
  return (
    <Routes>
        <Route path={`/`} element={<ReactionsStreamList />} />
        <Route path={`qr/:streamId`} element={<RectionLink />} />
        <Route path={`/stream/:streamId`} element={<ReactionGrid />} />
    </Routes>
  );
}

export function ReactionsPublic() {
  return (
    <Routes>
        <Route path={`/stream/:streamId`} element={<ReactionGrid />} />
    </Routes>
  );
}
