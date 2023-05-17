import {WHITEBOARD} from './paths';
import axios from 'axios';

export interface IWhiteboardInfo {
  id?: string;
  owner: string;
  streams: string[];
  channels: number[];
  size?: number;
  startTime: Date;
  duration?: number;
  status: string;
}

/** get encoded png image */
export async function getImage(id : string) : Promise<ArrayBuffer> {
  try {
    const res = await axios.get(`${WHITEBOARD}/${id}`);
    return res.data;
  } catch(err) {
    return null;
  }
}

/** upload encoded png image */
export async function updateImage(id : string, image : ArrayBuffer) : Promise<void> {
  try {
    const data = "HELLO WORLD";
    const res = await axios.postForm(`${WHITEBOARD}/${id}`,
        {
          "image" : image
        }
      );
    return res.data;

  } catch(err) {
    return null;
  }
}
