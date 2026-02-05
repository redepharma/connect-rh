import { RequestUser } from '../../modules/auth/types/auth.types';

declare module 'express' {
  export interface Request {
    user?: RequestUser;
  }
}
