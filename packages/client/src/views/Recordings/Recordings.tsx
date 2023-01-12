import React from 'react';
import {Table} from '../../components/Table';
import {useNavigate} from 'react-router';
import {Card, CardTitle} from '../../components/SelectableCard/SelectableCard';
import {useRecoilValue, useRecoilState} from 'recoil';
import {recordingList} from '../../recoil/atoms';
import {getRecordings} from '../../api/playback';

export function Recordings() {
  let [recordings, setState] = useRecoilState(recordingList);

  React.useEffect(() => {
    getRecordings().then(x => {setState(x);});
  }, []);

  const columns = [
    {
      label: 'file',
      fn: (data: any) => data.filename || 'N/A',
    }
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
