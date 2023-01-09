import {PLAYBACK} from './paths';

import axios from 'axios';

export interface IRecordingPlayback {
  filenamename: string;
  _id: string;
}

export async function getRecordings(): Promise<IRecordingPlayback[]> {
  try {
    const res = await axios.get(PLAYBACK);
    return res.data;
  } catch(err) {
    return [];
  }
}
