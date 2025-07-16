import instance from './AxiosInstance';
import { assetClassApi, parseParams } from './api';

export const AssetClassService = {
    async getAssetClasses(params) {
        return await instance.get(assetClassApi.getAssetClasses(), { params: params, paramsSerializer: (params) => parseParams(params) });
    }
};
