import {NODES} from './paths';
import axios from 'axios';

export interface INode {
  name: string;
  clientId: string;
  lastUpdate: Date;
  _id: string;
  serial: string;
  latency?: number;
  location?: string;
  active?: boolean;
  streams?: any[];
  tags?: string[];
  devices?: any[];
}

export interface ISaveNode {
  name?: string;
  location?: string;
  tags?: string[];
}

export async function getNodes(): Promise<INode[]> {
  try {
    const res = await axios.get(NODES);
    return res.data;
  } catch(err) {
    return [];
  }
}

export async function getNode(id: string): Promise<INode> {
  try {
    const res = await axios.get(`${NODES}/${id}`);
    return res.data;
  } catch(err) {
    return null;
  }
}

export async function saveNode(id: string, data: ISaveNode): Promise<INode> {
  try {
    const res = await axios.put(`${NODES}/${id}`, data);
    return res.data;
  } catch(err) {
    return null;
  }
}
