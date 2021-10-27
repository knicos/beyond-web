import {CONFIGS} from './paths';
import axios from 'axios';

export interface IConfig {
  title: string;
  streamId: string;
  id?: string;
  tags: string[];
  data: any;
  framesetId: number;
  frameId: number;
}

export interface ISaveConfig {
  title?: string;
  streamId?: string;
  framesetId?: number;
  frameId?: number;
  tags?: string[];
  data?: any;
  timestamp?: Date;
}

interface IConfigQuery {
  current?: boolean;
  uri?: string;
  framesetId?: number;
  frameId?: number;
}

export async function createConfig(data: ISaveConfig): Promise<IConfig> {
  try {
    const res = await axios.post(`${CONFIGS}`, data);
    return res.data;
  } catch(err) {
    return null;
  }
}

export async function getConfigs(query: IConfigQuery): Promise<IConfig[]> {
  try {
    const res = await axios.get(CONFIGS, { params: query });
    return res.data;
  } catch(err) {
    return [];
  }
}
