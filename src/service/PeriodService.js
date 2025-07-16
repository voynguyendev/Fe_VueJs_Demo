import instance from './AxiosInstance';
import { parseParams, periodApi } from './api';

export const PeriodService={
    async getperiods  (params)  {
      return await instance.get(periodApi.getperiods(), {params:params,paramsSerializer: params => parseParams(params)});
    },
   
    async createOrupdate(params)
    {
      return await instance.post(periodApi.createOrupdate(), params); 
    },
    async getperiodbyid (id)  {
      return await instance.get(periodApi.getperiodbyid()+'/'+id);
    },
    async deleteperiodbyid (id)  {
      return await instance.delete(periodApi.getperiodbyid()+'/'+id);
    },
    async closeperiodbyid (params)  {
      return await instance.post(periodApi.closeperiodbyid(),params);
    }
    
}
