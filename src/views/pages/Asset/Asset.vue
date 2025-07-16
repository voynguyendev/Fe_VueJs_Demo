<script setup>
//#region
import { assetApi, deviceRFIDApi } from '@/service/api';
import { AssetService } from '@/service/AssetService';
import instance from '@/service/AxiosInstance';
import { DeviceRFIDService } from '@/service/DeviceRFIDService';
import { SignalRService } from '@/service/SignalRService';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, ref } from 'vue';
const baseURL = import.meta.env.VITE_API_BASE_URL;
const currentAsset = ref();
const toast = useToast();
const fileupload = ref();
const filters = ref(null);
const rows = ref(null);
const totalRecords = ref(null);
const loading = ref(null);
const searchFixedAssetNumber = ref('');
const searchSubAssetNumber = ref('');
const searchStatusRemark = ref('');
const searchAssetDescription = ref('');
const searchAssetClassDescription = ref('');
const searchAssetClass = ref('');
const searchAdditionalAssetDescription = ref('');
const searchSerialNumber = ref('');
const searchWBS = ref('');
const searchCostCenter = ref('');
const searchDeactivationDateFrom = ref(null);
const searchDeactivationDateTo = ref(null);
const searchAssetGroup = ref(null);
const searchRfids = ref([]);
const selectedusb = ref();
const countRFID = ref(0);
const isClickCheck = ref(false);
const usbs = ref([]);
const selectedFile = ref(null);

const isChecking = ref(false);
const dataAsset = {
    pagination: {
        first: 0,
        rows: 10,
        sortField: null,
        sortOrder: null // 1 = asc, -1 = desc
    }
};
const displayPopup = ref(false);

const responsiveOptions = ref([
    {
        breakpoint: '1300px',
        numVisible: 4
    },
    {
        breakpoint: '575px',
        numVisible: 1
    }
]);
const currentAssetImageId = ref();

//#endregion

//#region event vue
onMounted(async () => {
    SignalRService.startConnection(deviceRFIDApi.hubUrl());

    // Add message handler
    SignalRService.addHandler('ReceiveMessage', (message) => {
        console.log(message);
        var isSearch = false;

        message.split(',').map((x) => {
            if (!searchRfids.value.find((y) => y == x)) {
                searchRfids.value.push(x);

                isSearch = true;
            }
        });
        if (isSearch) {
            fetchDataForTestRFIDs();
        }
    });

    fetchData();
    if (usbs.value.length > 0) selectedusb.value = usbs.value[0].index;

    if (!(await connectUSB())) {
        toast.add({ severity: 'error', summary: 'Error', detail: "Can't connect to device", life: 3000 });
        return;
    }
});

onBeforeMount(async () => {
    initFilters();
    await fetchDataUSB();
});
//#endregion

//#region device rfid
const fetchDataUSB = async () => {
    var usbdatas = [];
    const { data } = await DeviceRFIDService.getusbinformations();
    for (var i = 0; i < data.length; i++) {
        usbdatas.push({ name: data[i], index: i });
    }
    usbs.value = usbdatas;
};
const assignRFID = async (sapAsset, isReconnect) => {
    const { data } = await AssetService.assignTagRfidToAsset({ sapAssetId: sapAsset.id, rfid: sapAsset.rfid, rfidDecimal: sapAsset.rfidDecimal });

    if (data?.isSuccess) {
        var datamap = rows.value.map((x) => {
            if (x.id == sapAsset.id) {
                x.rfidDecimal = data.result.rfidDecimal;
                x.rfid = data.result.rfid;
            }
            return x;
        });
        rows.value = datamap;
        var datawritetagrfiddecimal = await DeviceRFIDService.writetagrfiddecimal({ rfidDecimal: data.result.rfidDecimal });
        if (datawritetagrfiddecimal?.data) {
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Assign Successfuly', life: 3000 });
        } else {
            if (isReconnect) {
                if (await connectUSB()) {
                    assignRFID(sapAsset, false);
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: "Can't connect to device", life: 3000 });
                }
                return;
            }
            toast.add({ severity: 'error', summary: 'Error', detail: "Can't find tag rfid", life: 3000 });
        }
    } else {
        if (data?.StatusCode == 1) {
            toast.add({ severity: 'error', summary: 'Error', detail: `this Tag RFID : ${apiBaseUrl},do you want overwrite?`, life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Try again', life: 3000 });
        }
    }
};
const connectUSB = async () => {
    const { data } = await DeviceRFIDService.connectdeviceusb({ index: selectedusb.value, isDisConnect: false });
    return data;
};
const fetchDataForTestRFIDs = async () => {
    var addsearchRfids = [];
    searchRfids.value.map((x) => {
        if (!rows.value.find((y) => y.rfid == x)) {
            addsearchRfids.push(x);
        }
    });
    if (addsearchRfids.length == 0) return;

    // flatten filters for query string
    const params = {
        pageNumber: 1,
        pageSize: 1000000,
        sortField: dataAsset.pagination.sortField,
        sortOrder: dataAsset.pagination.sortOrder,
        searchFixedAssetNumber: searchFixedAssetNumber.value,
        searchSubAssetNumber: searchSubAssetNumber.value,
        searchStatusRemark: searchStatusRemark.value,
        searchAssetDescription: searchAssetDescription.value,
        searchAssetClassDescription: searchAssetClassDescription.value,
        searchAdditionalAssetDescription: searchAdditionalAssetDescription.value,
        searchSerialNumber: searchSerialNumber.value,
        searchWBS: searchWBS.value,
        searchCostCenter: searchCostCenter.value,
        searchDeactivationDateFrom: searchDeactivationDateFrom.value,
        searchDeactivationDateTo: searchDeactivationDateTo.value,
        searchAssetGroup: searchAssetGroup.value,
        searchRfids: addsearchRfids
    };

    //loading.value=true
    const { data } = await AssetService.getAssets(params);
    //loading.value=false

    rows.value = [...rows.value, ...data.items];
    var finalRows = [];
    rows.value.map((x) => {
        if (!finalRows.find((y) => y.id == x.id)) finalRows.push(x);
    });
    rows.value = finalRows;
    console.log('test:' + rows.value[0].rfid);
    countRFID.value = rows.value.length;
};

const onCheckRFID = async () => {
    isClickCheck.value = true;
    countRFID.value = 0;
    isChecking.value = !isChecking.value;
    searchRfids.value = [];
    if (isChecking.value) {
        if (await connectUSB()) {
            rows.value = [];
            await DeviceRFIDService.startstopreadtagRFID({ isReadTagRFID: isChecking.value });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: "Can't connect to device", life: 3000 });
            isChecking.value = false;
        }
    } else {
        await DeviceRFIDService.startstopreadtagRFID({ isReadTagRFID: isChecking.value });
        await fetchData();
    }
    isClickCheck.value = false;
    //dataAsset.searchFixedAssetNumber.value='test'
    //await fetchData();
};
//#endregion

//#region
function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        fixedAssetNumber: { matchMode: FilterMatchMode.CONTAINS },
        subAssetNumber: { matchMode: FilterMatchMode.CONTAINS }
    };

    searchAssetClass.value = null;
    searchFixedAssetNumber.value = null;
    searchSubAssetNumber.value = null;
    searchStatusRemark.value = null;
    searchAssetDescription.value = null;
    searchAssetClassDescription.value = null;
    searchAdditionalAssetDescription.value = null;
    searchSerialNumber.value = null;
    searchWBS.value = null;
    searchCostCenter.value = null;
    searchDeactivationDateFrom.value = null;
    searchDeactivationDateTo.value = null;
    searchRfids.value = null;
}

const onExportExcel = async () => {
    //fileupload.value .click()
    const params = {
        pageNumber: 1,
        pageSize: 10000000,
        searchFixedAssetNumber: searchFixedAssetNumber.value,
        searchSubAssetNumber: searchSubAssetNumber.value,
        searchStatusRemark: searchStatusRemark.value,
        searchAssetDescription: searchAssetDescription.value,
        searchAssetClassDescription: searchAssetClassDescription.value,
        searchAdditionalAssetDescription: searchAdditionalAssetDescription.value,
        searchSerialNumber: searchSerialNumber.value,
        searchWBS: searchWBS.value,
        searchCostCenter: searchCostCenter.value,
        searchDeactivationDateFrom: searchDeactivationDateFrom.value,
        searchDeactivationDateTo: searchDeactivationDateTo.value,
        searchRfids: searchRfids.value
    };
    AssetService.exportExcelAsset(isChecking.value ? 'Results_Test.xlsx' : 'Assets.xlsx', params)
        .then((reponse) => {})
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
        });
};

const onSearch = async () => {
    dataAsset.pagination.first = 0;
    dataAsset.pagination.rows = 10;

    //dataAsset.searchFixedAssetNumber.value='test'
    await fetchData();
};
var numberNo = 0;
const onLazyEvent = async (event) => {
    numberNo = 0;
    // event contains: first, rows, sortField, sortOrder, filters
    dataAsset.pagination = { ...event };
    fetchData();
};

const fetchData = async () => {
    // flatten filters for query string
    const params = {
        pageNumber: dataAsset.pagination.first / dataAsset.pagination.rows + 1,
        pageSize: dataAsset.pagination.rows,
        sortField: dataAsset.pagination.sortField,
        sortOrder: dataAsset.pagination.sortOrder,
        searchAssetClass: searchAssetClass.value,
        searchAssetGroup: searchAssetGroup.value,
        searchFixedAssetNumber: searchFixedAssetNumber.value,
        searchSubAssetNumber: searchSubAssetNumber.value,
        searchStatusRemark: searchStatusRemark.value,
        searchAssetDescription: searchAssetDescription.value,
        searchAssetClassDescription: searchAssetClassDescription.value,
        searchAdditionalAssetDescription: searchAdditionalAssetDescription.value,
        searchSerialNumber: searchSerialNumber.value,
        searchWBS: searchWBS.value,
        searchCostCenter: searchCostCenter.value,
        searchDeactivationDateFrom: searchDeactivationDateFrom.value?.toISOString(),
        searchDeactivationDateTo: searchDeactivationDateTo.value?.toISOString(),
        searchRfids: searchRfids.value
    };
    loading.value = true;
    const { data } = await AssetService.getAssets(params);
    loading.value = false;
    rows.value = data.items;
    if (currentAsset.value && currentAsset.value.id) {
        data.items.map((x) => {
            if (x.id == currentAsset.value.id) {
                currentAsset.value = x;
            }
        });
    }
    var no = dataAsset.pagination.first;
    rows.value = rows.value.map((x) => {
        no = no + 1;
        x.no = no;
        return x;
    });
    totalRecords.value = data.totalRecords;
};

const clearFilter = async () => {
    initFilters();
    await fetchData();
};

//#endregion

//#region
const onSelect = (event) => {
    selectedFile.value = event.files[0];
};
const uploadimage = (data) => {
    if (data) currentAsset.value = data;
    Array.from(document.querySelectorAll(".p-fileupload [type='file']")).forEach((button) => button.click());
};
const onUpload = () => {
    if (!selectedFile.value) {
        alert('Please select a file first.');
        //fileupload.value.clear()
        return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('fixedAssetNumber', currentAsset.value.fixedAssetNumber);
    formData.append('SubAssetNumber', currentAsset.value.subAssetNumber);
    formData.append('AssetId', currentAsset.value.id);

    // Replace with your .NET Core API URL
    const uploadUrl = assetApi.uploadimageasset();

    instance
        .post(uploadUrl, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        .then((response) => {
            toast.add({ severity: 'success', summary: 'Successful', detail: 'File uploaded successfully', life: 3000 });
            console.log('File uploaded successfully:', response);
            fetchData();
            //alert('File uploaded successfully!');
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Upload failed', life: 3000 });
        });
    fileupload.value.clear();
    selectedFile.value = null;
};

//#endregion

const openPopup = async (data) => {
    displayPopup.value = true;
    currentAsset.value = data;
};

const setDefaultImage = async () => {
    const { data } = AssetService.setDefaultImageAsset({ assetImageId: currentAssetImageId.value })
        .then((response) => {
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Set Default Successfully', life: 3000 });
            console.log('File uploaded successfully:', response);
            fetchData();
            //alert('File uploaded successfully!');
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
        });
};
const assignCurrentImage = async (imageId) => {
    currentAssetImageId.value = imageId;
};
const onclose = async () => {
    console.log('close');
    //await  fetchData();
};
const onUpdateIsInventoryAssets = async () => {
    var request = rows.value.map((x) => {
        return {
            id: x.id,
            isInventory: x.isInventory
        };
    });
    AssetService.updateIsInventoryAssets({ assets: request })
        .then((response) => {
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Save Successfully', life: 3000 });

            fetchData();
            //alert('File uploaded successfully!');
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
        });
};
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Assets Managerment</div>

        <!-- Advanced Search Panel -->
        <div class="advanced-search-panel">
            <div class="search-field">
                <label for="StatusRemark">Status Remark</label>
                <InputText v-model="searchStatusRemark" id="StatusRemark" placeholder="StatusRemark" />
            </div>

            <div class="search-field">
                <label for="FixedAssetNumber">Fixed Asset Number</label>
                <InputText v-model="searchFixedAssetNumber" id="FixedAssetNumber" placeholder="FixedAssetNumber" />
            </div>
            <div class="search-field">
                <label for="SubAssetNumber">Sub Asset Number</label>
                <InputText v-model="searchSubAssetNumber" id="SubAssetNumber" placeholder="SubAssetNumber" />
            </div>
            <div class="search-field">
                <label for="AssetDescription">Asset Description</label>
                <InputText v-model="searchAssetDescription" id="AssetDescription" placeholder="AssetDescription" />
            </div>
            <div class="search-field">
                <label for="AssetClassDescription">Asset Class Description</label>
                <InputText v-model="searchAssetClassDescription" id="AssetClassDescription" placeholder="AssetClassDescription" />
            </div>
            <div class="search-field">
                <label for="AdditionalAssetDescription">Additional Asset Description</label>
                <InputText v-model="searchAdditionalAssetDescription" id="AdditionalAssetDescription" placeholder="AdditionalAssetDescription" />
            </div>
            <div class="search-field">
                <label for="AssetClass">Asset Class</label>
                <InputText v-model="searchAssetClass" id="AssetClass" placeholder="AssetClass" />
            </div>
            <div class="search-field">
                <label for="AssetClass">Asset Group</label>
                <InputText v-model="searchAssetGroup" id="AssetClass" placeholder="AssetGroup" />
            </div>
            <div class="search-field">
                <label for="SerialNumber">Seria lNumber</label>
                <InputText v-model="searchSerialNumber" id="SerialNumber" placeholder="SerialNumber" />
            </div>
            <div class="search-field">
                <label for="WBS">WBS</label>
                <InputText v-model="searchWBS" id="WBS" placeholder="WBS" />
            </div>

            <div class="search-field">
                <label for="CostCenter">Cost Center</label>
                <InputText v-model="searchCostCenter" id="CostCenter" placeholder="Cost Center" />
            </div>

            <div class="search-field">
                <label for="DeactivationDateFrom">Deactivation Date From</label>

                <DatePicker v-model="searchDeactivationDateFrom" placeholder="Format:dd/mm/yy" dateFormat="dd/mm/yy" />
            </div>
            <div class="search-field">
                <label for="DeactivationDateTo">Deactivation Date To</label>

                <DatePicker v-model="searchDeactivationDateTo" placeholder="Format:dd/mm/yy" dateFormat="dd/mm/yy" />
            </div>
            <div class="search-buttons">
                <Button @click="onSearch" label="Search" icon="pi pi-search" />
                <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" />
                <Button id="export" type="button" label="Export Excel" icon="pi pi-file-excel" @click="onExportExcel()" />
                <Button :disabled="isClickCheck" @click="onCheckRFID" :label="isChecking ? 'Testing(' + countRFID + ')' : 'Test RFIDs'" class="p-button-success" />
                <Button @click="onUpdateIsInventoryAssets" label="Update" />
            </div>
        </div>

        <DataTable
            paginatorTemplate="CurrentPageReport  FirstPageLink PrevPageLink  NextPageLink LastPageLink RowsPerPageDropdown"
            :value="rows"
            :lazy="true"
            :paginator="!isChecking"
            :rows="dataAsset.pagination.rows"
            :totalRecords="totalRecords"
            :first="dataAsset.pagination.first"
            dataKey="id"
            :rowHover="true"
            v-model:filters="filters"
            filterDisplay="menu"
            :loading="loading"
            :filters="filters"
            @page="onLazyEvent"
            @sort="onLazyEvent"
            @filter="onLazyEvent"
            showGridlines
            :globalFilterFields="['fixedAssetNumber', 'subAssetNumber']"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            currentPageReportTemplate="Page {currentPage}  of {totalPages} ({totalRecords} Items)"
        >
            <template #empty> No Assets found. </template>
            <template #loading> Loading Assets data. Please wait. </template>
            <Column field="no" header="No">
                <template #body="{ data }"> {{ data.no }} </template>
            </Column>
            <Column field="id" header="ID">
                <template #body="{ data }">
                    <Button style="min-width: 10rem; margin-right: 1rem" v-if="!isChecking" @click="assignRFID(data, true)" label="Assign Rfid" />
                    <span v-if="isChecking"> {{ data.id }}</span>
                    <br />
                    <Button style="min-width: 10rem; margin-top: 2rem" v-if="!isChecking" @click="uploadimage(data)" label="Upload image" />
                </template>
            </Column>
            <Column field="IsInventory" header="IsInventory">
                <template #body="{ data }">
                    <Checkbox v-model="data.isInventory" binary />
                </template>
            </Column>
            <Column header="Image">
                <template #body="{ data }">
                    <Image v-if="data.imageDefault && data.imageDefault?.imagePathSmall" alt="Image">
                        <template #image>
                            <img :src="`${baseURL}${data.imageDefault?.imagePathSmall}`" @click="openPopup(data)" alt="image" class="w-24 h-24 rounded" />
                        </template>
                    </Image>
                </template>
            </Column>
            <Column field="rfid" header="RFID">
                <template #body="{ data }">
                    {{ data.rfid }}
                </template>
            </Column>

            <Column field="costCenter" header="Cost Center">
                <template #body="{ data }">
                    {{ data.costCenter }}
                </template>
            </Column>

            <Column field="costCenter" header="Cost Center Name">
                <template #body="{ data }">
                    {{ data.costCenterName }}
                </template>
            </Column>
            <Column field="statusRemark" header="Status Remark">
                <template #body="{ data }">
                    {{ data.statusRemark }}
                </template>
            </Column>
            <Column field="fixedAssetNumber" header="Fixed Asset Number">
                <template #body="{ data }">
                    {{ data.fixedAssetNumber }}
                </template>
            </Column>
            <Column field="subAssetNumber" header="Sub Asset Number">
                <template #body="{ data }">
                    {{ data.subAssetNumber }}
                </template>
            </Column>
            <Column field="assetDescription" header="Asset Description">
                <template #body="{ data }">
                    {{ data.assetDescription }}
                </template>
            </Column>
            <Column field="assetClassDescription" header="Asset Class Description">
                <template #body="{ data }">
                    {{ data.assetClassDescription }}
                </template>
            </Column>

            <Column field="additionalAssetDescription" header="Additional Asset Description">
                <template #body="{ data }">
                    {{ data.additionalAssetDescription }}
                </template>
            </Column>
            <Column field="AssetGroup" header="Asset Group">
                <template #body="{ data }">
                    {{ data.assetGroup }}
                </template>
            </Column>
            <Column field="assetClass" header="Asset Class">
                <template #body="{ data }">
                    {{ data.assetClass }}
                </template>
            </Column>

            <Column field="serialNumber" header="Serial Number">
                <template #body="{ data }">
                    {{ data.serialNumber }}
                </template>
            </Column>

            <Column field="wbs" header="WBS">
                <template #body="{ data }">
                    {{ data.wbs }}
                </template>
            </Column>

            <Column field="deactivationDate " header="Deactivation Date ">
                <template #body="{ data }">
                    {{ data.deactivationDate }}
                </template>
            </Column>
        </DataTable>
    </div>
    <Dialog v-model:visible="displayPopup" :header="dialogTitle" :style="{ width: '50rem', 'text-align': 'center', borderTop: '5px solid var(--primary-color)' }" :modal="true" :dismissableMask="true" @hide="onclose()">
        <div class="advanced-search-panel" style="margin-bottom: 2rem">
            <div class="search-buttons">
                <Button @click="setDefaultImage()" label="Set Default" />
                <Button type="button" label="Upload Image" outlined @click="uploadimage()" />
            </div>
        </div>

        <Galleria :value="currentAsset.images" :responsiveOptions="responsiveOptions" :numVisible="4" containerStyle="max-width: 640px;">
            <template #item="data">
                <img :src="`${baseURL}${data.item.imagePath}`" style="max-width: 100%; max-height: 300px" />
            </template>
            <template #thumbnail="data">
                <img :src="`${baseURL}${data.item.imagePathSmall}`" @click="assignCurrentImage(data.item.id)" class="rounded" style="max-width: 100px; max-height: 100px" />
            </template>
        </Galleria>
    </Dialog>
    <FileUpload
        ref="fileupload"
        mode="basic"
        accept="image/*"
        label="Upload an Image"
        chooseLabel="Select"
        auto="true"
        uploadLabel="Upload"
        :customUpload="true"
        showUploadButton="false"
        @select="onSelect"
        @uploader="onUpload($event)"
        :chooseButtonProps="{ id: 'selectupload', style: 'display:none' }"
    />
</template>

<style scoped lang="scss">
:deep(.p-fileupload-basic) {
    display: none !important;
}

:deep(.p-datatable-frozen-tbody) {
    font-weight: bold;
}

:deep(.p-datatable-scrollable .p-frozen-column) {
    font-weight: bold;
}

:deep(.p-datatable-filter-rule .p-select) {
    display: none !important;
}

.advanced-search-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* 1. The panel container */
.advanced-search-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 0.5rem;
    align-items: end;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 2. Each field wrapper */
.search-field {
    display: flex;
    flex-direction: column;
}

.search-field label {
    margin-bottom: 0.25rem;
    font-weight: 600;
    color: #333;
}

/* 3. Button group */
.search-buttons {
    display: contents;
    gap: 0.5rem;
    align-items: center;
}

.ui-fileupload-buttonbar button:not(.ui-fileupload-choose) {
    display: none;
}
</style>
