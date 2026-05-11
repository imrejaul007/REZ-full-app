// Mock uuid module to avoid ESM issues with Jest
export const v4 = () => 'test-uuid-' + Math.random().toString(36).substring(7);
export const v1 = () => 'test-uuid-v1-' + Date.now();
export const v3 = (namespace: string, name: string) => 'test-uuid-v3-' + namespace + name;
export const v5 = (namespace: string, name: string) => 'test-uuid-v5-' + namespace + name;
export const NIL = '00000000-0000-0000-0000-000000000000';
export const parse = (uuid: string) => uuid;
export const stringify = (arr: number[]) => 'test-uuid-' + arr.join('');
export const validate = (uuid: string) => typeof uuid === 'string' && uuid.length > 0;
export const version = (uuid: string) => 4;
export default { v4, v1, v3, v5, NIL, parse, stringify, validate, version };
