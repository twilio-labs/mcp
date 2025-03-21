export type Filter = {
  tags: string[];
};

export type HttpMethod = 'GET' | 'DELETE' | 'POST' | 'PUT';
export type ContentType =
  | 'application/json'
  | 'application/x-www-form-urlencoded';

export type API = {
  method: HttpMethod;
  path: string;
  contentType: ContentType;
};
