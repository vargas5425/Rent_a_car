import { useContext } from 'react';
import { AuthContext } from './AuthContextData';

export function useAuth() {
  return useContext(AuthContext);
}