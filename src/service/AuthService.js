import instance from './AxiosInstance';
import { authApi } from './api';
export const AuthService={
async login  (username, password)  {
  return await instance.post(authApi.login(), {
    username,
    password
  });
},
async refreshtoken  (userId,refreshToken)  {

  return await instance.post(authApi.refreshToken(), {
    refreshToken,
    userId  
  });
}

}