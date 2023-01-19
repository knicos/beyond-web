import React from 'react';
import {Table} from '../../components/Table';
import {useNavigate} from 'react-router';
import {Card, CardTitle} from '../../components/SelectableCard/SelectableCard';
import {useRecoilValue, useRecoilState} from 'recoil';
import {recordingList} from '../../recoil/atoms';
import {getRecordings, startPlayback, stopPlayback} from '../../api/playback';
import { Button } from '../../components/Button';
import { FaPlay, FaStop } from 'react-icons/fa';

export function Recordings() {
  let [recordings, setState] = useRecoilState(recordingList);

  let updateList = () => {
    getRecordings().then(x => {setState(x);});
  }

  React.useEffect(updateList, []);

  const columns = [
    {
      label: 'File',
      fn: (data: any) => data.filename || 'N/A',
    },
    {
      label: 'Date',
      fn: (data: any) => data.created || 'N/A',
    },
    {
      label: 'Playback',
      fn: (data: any) => { /* TODO: type */
        if (data.playbackState == "playing") {
          return (<Button onClick={() => stopPlayback(data.playbackId).then(updateList)}><FaStop/></Button>)
        }
        else {
          return (<Button onClick={() => startPlayback(data.id).then(updateList)}><FaPlay/></Button>)
        }
      },
    },
  ];

  const path = process.env.ASSET_PATH;
  const navigate = useNavigate();

  return (
    <Card>
      <CardTitle>Recordings</CardTitle>
      <Table data={recordings || []} columns={columns}/>
    </Card>
  )
}
