import {STREAMS} from './paths';
import axios from 'axios';

interface IFrame {
  title?: string;
  nodeId?: string;
  active?: boolean;
  frameId: number;
  autoStart?: boolean;
}

interface IFrameset {
  frames: IFrame[];
  title?: string;
  framesetId: number;
}

export interface IStream {
  title: string;
  uri: string;
  id: string;
  tags: string[];
  framesets: IFrameset[];
}

export interface ISaveStream {
  title?: string;
  tags?: string[];
  framesets?: IFrameset[];
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

export async function deleteStream(id: string): Promise<boolean> {
  try {
    await axios.delete(`${STREAMS}/${id}`);
    return true;
  } catch(err) {
    return false;
  }
}

export async function createStream(data: ISaveStream): Promise<IStream> {
  try {
    const res = await axios.post(`${STREAMS}`, data);
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
