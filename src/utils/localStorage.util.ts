import {AsyncLocalStorage} from 'async_hooks';
interface RequestStore extends Map<string, any> {}
const asyncLocalStorage = new AsyncLocalStorage<RequestStore>();

export default asyncLocalStorage;
