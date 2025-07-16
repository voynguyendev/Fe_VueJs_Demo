import instance from './AxiosInstance';
import { assetApi, parseParams } from './api';

export const AssetService = {
    async getAssets(params) {
        return await instance.get(assetApi.getAssets(), { params: params, paramsSerializer: (params) => parseParams(params) });
    },
    async assignTagRfidToAsset(params) {
        return await instance.post(assetApi.assignTagRfidToAsset(), params);
    },
    async exportExcelAsset(name, params) {
        var response = await instance
            .get(assetApi.exportexcelassets(), {
                responseType: 'blob',
                params: params,
                paramsSerializer: (params) => parseParams(params) // Important for file download
            })
            .then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', name ?? 'Asset.xlsx'); // Specify the file name
                document.body.appendChild(link);
                link.click(); // Trigger the download
                link.remove(); // Clean up
                return Promise.resolve(response);
            })
            .catch((error) => {
                return Promise.reject(error);
            });
        // Create a URL for the blob
    },
    async setDefaultImageAsset(params) {
        return await instance.post(assetApi.setDefaultImageAsset() + '/' + params.assetImageId);
    },
    async updateIsInventoryAssets(params) {
        return await instance.post(assetApi.updateIsInventoryAsset(), params);
    }
};
