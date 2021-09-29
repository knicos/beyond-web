import {selector, atom, useSetRecoilState} from 'recoil';
import axios from 'axios';
import { OAUTH2_VALIDATE } from '../api';

const sessionRequestId = atom({
  key: 'sessionRequestId',
  default: 0,
});

export const currentSession = selector({
  key: 'CurrentSession',
  get: async ({get}) => {
    get(sessionRequestId);
    try {
      const response = await axios.get(OAUTH2_VALIDATE);
      return response.data;
    } catch(err) {
      console.log('ERROR', err.response);
      return null;
    }
  },
});

export function refreshSession() {
  const setRequestId = useSetRecoilState(sessionRequestId);
  return () => {
    setRequestId(requestID => requestID + 1);
  };
}
