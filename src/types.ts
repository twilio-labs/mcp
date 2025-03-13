import { Service } from '@app/utils/args';

export type HttpMethod = 'GET' | 'DELETE' | 'POST' | 'PUT';
export type API = {
  method: HttpMethod;
  path: string;
  urlencoded?: boolean;
};

export type Environment = 'dev' | 'stage' | 'prod';

export type Filter = {
  services: Service[];
  tags: string[];
};
