const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const baseConnectDeviceRFIDURL = import.meta.env.VITE_API_BASE_URL_DEVICE_RFID;
export const authApi = {
    login: () => `${apiBaseUrl}/auth/login`,
    refreshToken: () => `${apiBaseUrl}/auth/refresh-token`
};
export const assetApi = {
    getAssets: () => `${apiBaseUrl}/api/sapassets`,
    assignTagRfidToAsset: () => `${apiBaseUrl}/api/sapassets/assign-tagrfid-to-asset`,
    exportexcelassets: () => `${apiBaseUrl}/api/sapassets/export-excel-assets`,
    uploadimageasset: () => `${apiBaseUrl}/api/SapAssets/upload-image`,
    setDefaultImageAsset: () => `${apiBaseUrl}/api/SapAssets/set-default-image`,
    updateIsInventoryAsset: () => `${apiBaseUrl}/api/SapAssets/update-assets-isinventory`
};
export const assetClassApi = {
    getAssetClasses: () => `${apiBaseUrl}/api/assetclasses`
};
export const deviceRFIDApi = {
    connectdeviceusb: () => `${baseConnectDeviceRFIDURL}/api/connect-device-usb`,
    getusbinformations: () => `${baseConnectDeviceRFIDURL}/api/get-usb-informations`,
    writetagrfiddecimal: () => `${baseConnectDeviceRFIDURL}/api/write-tag-rfid-decimal`,
    hubUrl: () => `${baseConnectDeviceRFIDURL}/chatHub`,
    startstopreadtagRFID: () => `${baseConnectDeviceRFIDURL}/api/read-tags-rfid`,
    readtagrfid: () => `${baseConnectDeviceRFIDURL}/api/read-tag-rfid`
};
export const periodApi = {
    getperiods: () => `${apiBaseUrl}/api/stocktakingperiods`,
    createOrupdate: () => `${apiBaseUrl}/api/stocktakingperiods`,
    getperiodbyid: () => `${apiBaseUrl}/api/stocktakingperiods`,
    deleteperiodbyid: () => `${apiBaseUrl}/api/stocktakingperiods`,
    closeperiodbyid: () => `${apiBaseUrl}/api/stocktakingperiods/close`
};
export const costCenterInventoryApi = {
    getCostCentersForInventory: () => `${apiBaseUrl}/api/CostCenterInventories/GetCostCentersForInventory`,
    getCostCenterInventoriesWithFilter: () => `${apiBaseUrl}/api/CostCenterInventories/GetCostCenterInventoriesWithFilter`,
    getCostCenterInventoryByPeriodAndCostCenter: () => `${apiBaseUrl}/api/CostCenterInventories`,
    getCostCenterInventoryById: () => `${apiBaseUrl}/api/CostCenterInventories`,
    startPauseScanCostCenterInventory: () => `${apiBaseUrl}/api/CostCenterInventories/start-pause-scanning-inventory`,
    finishScanCostCenterInventory: () => `${apiBaseUrl}/api/CostCenterInventories/finish-scanning-inventory`,
    resetScanCostCenterInventory: () => `${apiBaseUrl}/api/CostCenterInventories/reset-scanning-inventory`,
    scanAssetsCostCenterInventory: () => `${apiBaseUrl}/api/CostCenterInventories/scan-assets`,
    exportexcelCostCenterInventories: () => `${apiBaseUrl}/api/CostCenterInventories/export-excel-costcenterinventories`,
    updateCostCenterInventoryDetail: () => `${apiBaseUrl}/api/CostCenterInventories/update-cost-center-inventory-detail`,
    getAllReasons: () => `${apiBaseUrl}/api/Reasons`,
    getCostCenterInventoryDetailById: () => `${apiBaseUrl}/api/CostCenterInventoryDetails`,
    getAllCostCenterForHistoryInventory: () => `${apiBaseUrl}/api/CostCenters/GetAllCostCenterForHistoryInventory`,
    getAllRequestToOpensRequest: () => `${apiBaseUrl}/api/RequestToOpens`,
    requestToOpenCostCenterInventory: () => `${apiBaseUrl}/api/RequestToOpens/RequestToOpenCostCenterInventory`,
    approveRequestToOpenCostCenterInventory: () => `${apiBaseUrl}/api/RequestToOpens/ApproveRequestToOpenCostCenterInventory`,
    rejectRequestToOpenCostCenterInventory: () => `${apiBaseUrl}/api/RequestToOpens/RejectRequestToOpenCostCenterInventory`,
    addRemarkCostCenterInventory: () => `api/CostCenterInventories/add-remark-costcenter-inventory`,
    addReason: () => `api/Reasons`,
    updateReason: () => `api/Reasons`,
    deleteReason: () => `api/Reasons`,
    getAllCostCenter: () => `api/CostCenters`
};

export const parseParams = (params) => {
    let options = '';

    for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
            for (const element of value) {
                options += `${key}=${element}&`;
            }
        } else {
            if (value || value == false) options += `${key}=${value}&`;
        }
    }

    return options.slice(0, -1);
};
