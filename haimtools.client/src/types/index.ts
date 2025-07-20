export interface PostmanUrl {
  raw: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: Array<{
    key: string;
    value: string;
    disabled?: boolean;
  }>;
}

export interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
  type?: string;
}

export interface PostmanBody {
  mode?: 'raw' | 'formdata' | 'urlencoded' | 'binary' | 'graphql';
  raw?: string;
  formdata?: Array<{
    key: string;
    value: string;
    type?: 'text' | 'file';
    disabled?: boolean;
  }>;
  urlencoded?: Array<{
    key: string;
    value: string;
    disabled?: boolean;
  }>;
}

export interface OAuth2Config {
  accessTokenUrl: string;
  authUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  state?: string;
  redirectUri?: string;
  grantType: 'authorization_code' | 'client_credentials' | 'password' | 'refresh_token';
  username?: string;
  password?: string;
  refreshToken?: string;
}

export interface PostmanAuth {
  type: 'noauth' | 'bearer' | 'basic' | 'oauth2' | 'apikey';
  bearer?: Array<{
    key: string;
    value: string;
    type: string;
  }>;
  basic?: Array<{
    key: string;
    value: string;
    type: string;
  }>;
  oauth2?: OAuth2Config;
  apikey?: Array<{
    key: string;
    value: string;
    in: 'header' | 'query';
  }>;
}

export interface PostmanRequest {
  method: string;
  url: PostmanUrl;
  header?: PostmanHeader[];
  body?: PostmanBody;
  auth?: PostmanAuth;
}

export interface PostmanItem {
  name: string;
  request: PostmanRequest;
  response?: any[];
}

export interface PostmanCollection {
  name: string;
  item: PostmanItem[];
  auth?: PostmanAuth;
  variable?: Array<{
    key: string;
    value: string;
    type?: string;
  }>;
}

export interface PostmanFile {
  info: {
    name: string;
    description?: string;
    schema: string;
  };
  item: PostmanCollection[];
  auth?: PostmanAuth;
  variable?: Array<{
    key: string;
    value: string;
    type?: string;
  }>;
}

export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  responseTime?: number;
  size?: number;
}

export interface Environment {
  name: string;
  values: Array<{
    key: string;
    value: string;
    enabled: boolean;
  }>;
}

export interface RequestHistory {
  id: string;
  name: string;
  method: string;
  url: string;
  timestamp: Date;
  statusCode?: number;
  responseTime?: number;
}