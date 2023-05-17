import {PLAYBACK} from './paths';

import axios from 'axios';

export interface IRecordingPlayback {
  filenamename: string;
  playbackState: string;
  _id: string;
}

export async function getRecordings(): Promise<IRecordingPlayback[]> {
  try {
    const res = await axios.get(PLAYBACK);
    return res.data;
  } catch(err) {
    alert("Error: " + err.toString());
    return [];
  }
}

export async function startPlayback(id : string): Promise<{}> {
  try {
    const res = await axios.post(PLAYBACK+'/startPlay/'+id);
    return res.data;
  } catch(err) {
    alert("Error: " + err.toString());
    return {};
  }
}

export async function stopPlayback(id : string): Promise<{}> {
  try {
    const res = await axios.post(PLAYBACK+'/stopPlay/'+id);
    return res.data;
  } catch(err) {
    alert("Error: " + err.toString());
    return {};
  }
}
