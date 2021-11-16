import {RECORDER} from './paths';
import axios from 'axios';

export interface IRecording {
  id?: string;
  owner: string;
  streams: string[];
  channels: number[];
  size?: number;
  startTime: Date;
  duration?: number;
  status: string;
}

export interface ICreateRecording {
  streams: string[];
  channels: number[];
  status?: string;
}

export async function startRecording(data: ICreateRecording): Promise<IRecording> {
  try {
    const res = await axios.post(`${RECORDER}`, data);
    return res.data;
  } catch(err) {
    return null;
  }
}

export async function stopRecording(id: string): Promise<IRecording> {
  try {
    const res = await axios.put(`${RECORDER}/${id}`, { status: 'stopped' });
    return res.data;
  } catch(err) {
    return null;
  }
}


export async function getRecordings(): Promise<IRecording[]> {
  try {
    const res = await axios.get(RECORDER);
    return res.data;
  } catch(err) {
    return [];
  }
}
