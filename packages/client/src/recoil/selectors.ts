import {selector, atom, useSetRecoilState} from 'recoil';
import axios from 'axios';

const sessionRequestId = atom({
  key: 'sessionRequestId',
  default: 0,
});

export const currentSession = selector({
  key: 'CurrentSession',
  get: async ({get}) => {
    get(sessionRequestId);
    try {
      const response = await axios.get('/v1/oauth2/validate');
      console.log('SESSION', response);
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
    console.log('REFRESH');
    setRequestId(requestID => requestID + 1);
  };
}
