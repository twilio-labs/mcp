export type HttpMethod = 'GET' | 'DELETE' | 'POST' | 'PUT';
export type API = {
  method: HttpMethod;
  path: string;
  urlencoded?: boolean;
};
