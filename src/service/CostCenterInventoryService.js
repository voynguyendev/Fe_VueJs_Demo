import instance from './AxiosInstance';
import { costCenterInventoryApi, parseParams } from './api';

export const CostCenterInventoryService = {
    async getCostCentersForInventory(params) {
        return await instance.get(costCenterInventoryApi.getCostCentersForInventory(), { params: params, paramsSerializer: (params) => parseParams(params) });
    },
    async getCostCenterInventoriesWithFilter(params) {
        return await instance.get(costCenterInventoryApi.getCostCenterInventoriesWithFilter(), { params: params, paramsSerializer: (params) => parseParams(params) });
    },
    async getCostCenterInventoryByPeriodAndCostCenter(periodId, costcenter) {
        return await instance.get(`${costCenterInventoryApi.getCostCenterInventoryByPeriodAndCostCenter()}/${periodId}/${costcenter}`);
    },
    async getCostCenterInventoryById(id) {
        return await instance.get(`${costCenterInventoryApi.getCostCenterInventoryById()}/${id}`);
    },
    async startPauseScanCostCenterInventory(params) {
        return await instance.post(costCenterInventoryApi.startPauseScanCostCenterInventory(), params);
    },
    async finishScanCostCenterInventory(params) {
        return await instance.post(costCenterInventoryApi.finishScanCostCenterInventory(), params);
    },
    async resetScanCostCenterInventory(params) {
        return await instance.post(costCenterInventoryApi.resetScanCostCenterInventory(), params);
    },
    async scanAssetsCostCenterInventory(params) {
        return await instance.post(costCenterInventoryApi.scanAssetsCostCenterInventory(), params);
    },
    async exportexcelCostCenterInventories(name, params) {
        await instance
            .get(costCenterInventoryApi.exportexcelCostCenterInventories(), {
                responseType: 'blob',
                params: params,
                paramsSerializer: (params) => parseParams(params) // Important for file download
            })
            .then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', name ?? 'CostCenterInventories.xlsx'); // Specify the file name
                document.body.appendChild(link);
                link.click(); // Trigger the download
                link.remove(); // Clean up
                return Promise.resolve(response);
            })
            .catch((error) => {
                return Promise.reject(error);
            });
    },
    async updateCostCenterInventoryDetail(params) {
        const formData = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            if (value) formData.append(key, value);
        });
        return await instance.post(costCenterInventoryApi.updateCostCenterInventoryDetail(), formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    async getReasons() {
        return await instance.get(costCenterInventoryApi.getAllReasons());
    },
    async getCostCenterInventoryDetailById(id) {
        return await instance.get(`${costCenterInventoryApi.getCostCenterInventoryDetailById()}/${id}`);
    },
    async getAllCostCenterForHistoryInventory() {
        return await instance.get(`${costCenterInventoryApi.getAllCostCenterForHistoryInventory()}`);
    },
    async getAllRequestToOpensRequest(params) {
        return await instance.get(`${costCenterInventoryApi.getAllRequestToOpensRequest()}`, { params: params, paramsSerializer: (params) => parseParams(params) });
    },
    async requestToOpenCostCenterInventory(costCenterInventoryId) {
        return await instance.post(`${costCenterInventoryApi.requestToOpenCostCenterInventory()}`, { costCenterInventoryId });
    },
    async approveRequestToOpenCostCenterInventory(requestToOpenId) {
        return await instance.post(`${costCenterInventoryApi.approveRequestToOpenCostCenterInventory()}`, { requestToOpenId });
    },
    async rejectRequestToOpenCostCenterInventory(requestToOpenId) {
        return await instance.post(`${costCenterInventoryApi.rejectRequestToOpenCostCenterInventory()}`, { requestToOpenId });
    },
    async addRemarkToCostCenterInventory(params) {
        return await instance.post(`${costCenterInventoryApi.addRemarkCostCenterInventory()}`, params);
    },
    async addReason(params) {
        return await instance.post(`${costCenterInventoryApi.addReason()}`, params);
    },
    async updateReason(id, params) {
        return await instance.post(`${costCenterInventoryApi.updateReason()}/${id}`, params);
    },
    async deleteReason(id) {
        return await instance.delete(`${costCenterInventoryApi.deleteReason()}/${id}`);
    },
    async getCostCenters(params) {
        return await instance.get(costCenterInventoryApi.getAllCostCenter(), { params: params, paramsSerializer: (params) => parseParams(params) });
    }
};
