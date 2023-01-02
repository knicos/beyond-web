import { AsyncLocalStorage } from 'async_hooks';

const ALS = new AsyncLocalStorage<Map<string, string>>();
export default ALS;
