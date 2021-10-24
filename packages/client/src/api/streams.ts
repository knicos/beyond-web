import {STREAMS} from './paths';
import axios from 'axios';

export interface IStream {
  title: string;
  uri: string;
  id: string;
  tags: string[];
}

export interface ISaveStream {
  name?: string;
  tags?: string[];
}

export async function getStreams(): Promise<IStream[]> {
  try {
    const res = await axios.get(STREAMS);
    return res.data;
  } catch(err) {
    return [];
  }
}

export async function getStream(id: string): Promise<IStream> {
  try {
    const res = await axios.get(`${STREAMS}/${id}`);
    return res.data;
  } catch(err) {
    return null;
  }
}

export async function saveStream(id: string, data: ISaveStream): Promise<IStream> {
  try {
    const res = await axios.put(`${STREAMS}/${id}`, data);
    return res.data;
  } catch(err) {
    return null;
  }
}
