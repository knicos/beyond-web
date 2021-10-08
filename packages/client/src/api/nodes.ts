import {NODES} from './paths';
import axios from 'axios';

export async function getNodes() {
  try {
    const res = await axios.get(NODES);
    return res.data;
  } catch(err) {
    return [];
  }
}
