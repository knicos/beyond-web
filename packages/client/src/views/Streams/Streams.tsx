import React, {useState} from 'react';
import {Table} from '../../components/Table';
import {FaCircle, FaCheck, FaPen, FaTrashAlt} from 'react-icons/fa';
import {useHistory} from 'react-router';
import {Container, Title, Gap, TitleRow} from './styledComponents';
import {useRecoilValue} from 'recoil';
import {streamList} from '../../recoil/atoms';
import {Button} from '../../components/Button';
import {IconButton} from '../../components/IconButton';
import { CollectionDialog } from './CollectionDialog';
import { StreamDialog } from './StreamDialog';
import styled from 'styled-components';
import { deleteStream, IStream } from '../../api';

const StreamMenu = styled.div`
  display: flex;
  align-items: center;
  padding-left: 1rem;
  gap: 0.8rem;
  font-size: 1.1rem;
  color: ${props => props.theme.text.dark};
`;

export function Streams() {
  const streams = useRecoilValue<IStream[]>(streamList);
  const path = process.env.ASSET_PATH;
  const history = useHistory();
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [showAddStream, setShowAddStream] = useState(false);

  const columns = [
    {
      label: 'Active',
      fn: (data: any) => data.active ? <FaCircle color="green" /> : <FaCircle color="red" />,
    },
    {
      label: '',
      fn: (data: any) => <img width="80" src={data.thumb} />,
    },
    {
      label: 'Title',
      fn: (data: any) => (
        <>
          <span>{data.frame || 'No Name'}</span>
          <StreamMenu className="hidden">
            <IconButton onClick={() => {
              history.push(`${path}streams/${data.id}/${data.fsix}/${data.fix}`);
            }}><FaPen /></IconButton>
            <IconButton onClick={() => {
              // Delete only one frame
            }}><FaTrashAlt /></IconButton>
          </StreamMenu>
        </>
      ),
    },
    {
      label: 'Collection',
      fn: (data: any) => data.title || 'No Name',
    },
    {
      label: 'Set',
      fn: (data: any) => data.frameset || '',
    },
    {
      label: 'Node',
      fn: (data: any) => data.nodeId || '',
    },
    {
      label: 'Autostart',
      fn: (data: any) => data.autostart ? <FaCheck /> : null,
    }
  ];

  const collectioncolumns = [
    {
      label: '',
      fn: (data: any) => <img width="80" src={data.thumb} />,
    },
    {
      label: 'Collection',
      fn: (data: any) => (
        <>
          <span>{data.title || 'No Name'}</span>
          <StreamMenu className="hidden">
            <IconButton onClick={() => {
              history.push(`${path}collections/${data.id}`);
            }}><FaPen /></IconButton>
            <IconButton onClick={() => {
              deleteStream(data.id);
            }}><FaTrashAlt /></IconButton>
          </StreamMenu>
        </>
      ),
    },
    {
      label: 'URI',
      fn: (data: any) => data.uri || '',
    },
    {
      label: 'Tags',
      fn: (data: any) => data.tags?.join(', ') || '',
    },
    {
      label: 'Sets',
      fn: (data: any) => data.framesets,
    },
  ];

  const data = streams?.reduce((r, s) => [...r, ...s.framesets.reduce((rr, fs, fsix) => [...rr, ...fs.frames.map((f, fix) => ({
      id: s.id,
      active: f.active || false,
      title: s.title || 'No Title',
      frameset: fs.title ? `${fs.title} (${fs.framesetId})` : `${fs.framesetId}`,
      frame: f.title ? `${f.title} (${f.frameId})` : `${f.frameId}`,
      nodeId: f.nodeId || '',
      autostart: f.autoStart || false,
      thumb: `${path}v1/streams/${s.id}/thumbnail/${fs.framesetId}/${f.frameId}`,
      fsid: fs.framesetId,
      fid: f.frameId,
      fsix,
      fix,
  }))], [])], []);

  const colData = streams.map(s => ({
    id: s.id,
    title: s.title || 'No Title',
    uri: s.uri,
    thumb: `${path}v1/streams/${s.id}/thumbnail/${s.framesets?.[0]?.framesetId || 0}/${s.framesets?.[0]?.frames?.[0]?.frameId || 0}`,
    framesets: s.framesets?.length || 0
  }));

  return (
    <Container>
      <TitleRow>
        <Title>Your Collections</Title>
        <Button className="primary" onClick={() => {
          setShowAddCollection(true);
        }}>Add</Button>
      </TitleRow>
      <Table data={colData || []} columns={collectioncolumns} />
      <Gap />
      <TitleRow>
        <Title>Your Streams</Title>
        <Button className="primary" onClick={() => {
          setShowAddStream(true);
          // Show collection select dialog
          // Give frameset or new frameset
          // Put the changes...
        }}>Add</Button>
      </TitleRow>
      <Table data={data || []} columns={columns} />
      <CollectionDialog show={showAddCollection} onClose={() => setShowAddCollection(false)} />
      <StreamDialog show={showAddStream} onClose={() => setShowAddStream(false)} collections={streams || []} />
    </Container>
  )
}
