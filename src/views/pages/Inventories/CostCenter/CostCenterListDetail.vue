<script setup>
//#region
import router from '@/router';
import { CommonService } from '@/service/CommonService';
import { CostCenterInventoryService } from '@/service/CostCenterInventoryService';
import { PeriodService } from '@/service/PeriodService';
import { useGlobalStore } from '@/stores/global';
import { FilterMatchMode } from '@primevue/core/api';
import moment from 'moment';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

var dataScanRFIDResult = [];
const baseURL = import.meta.env.VITE_API_BASE_URL;
const currentCostCenterInventory = ref(null);
const displayPopup = ref(false);
const toast = useToast();
const filters = ref(null);
const rowDetails = ref(null);
const rowOtherDetails = ref(null);
const rowNoteDetails = ref(null);
const rowNoteAssetDetails = ref(null);
const rowLogActions = ref(null);

const loadingDetail = ref(null);
const searchRfids = ref([]);

const dialogTitle = ref('');

const filterValues = ref({
    type: 'Stock Taking',
    period: null,
    codeCenterName: '',
    codeCenterValue: ''
});

const filterperiods = ref([]);

const route = useRoute();
const globalStore = useGlobalStore();
//#endregion

//#region
const openPopup = async () => {
    displayPopup.value = true;
};

onMounted(async () => {
    if (route.params.periodId && route.params.costcenter) await getCostCenterInventoryDetail(route.params.periodId, route.params.costcenter);
    if (route.params.id) await getCostCenterInventoryDetailById(route.params.id);
    const params = {
        pageNumber: 1,
        pageSize: 1000
    };
    PeriodService.getperiods(params)
        .then((response) => {
            var periodInventories = response.data.items
                .filter((x) => x.status == 'Openning' || x.id == route.params.periodId || x.id == filterValues.value.period?.id)
                .map((x) => {
                    x.name = `${x.name}(${x.type})`;
                    return x;
                });

            if (route.params.periodId && periodInventories && periodInventories.length > 0) {
                filterValues.value.period = periodInventories.filter((x) => x.id == route.params.periodId)[0];
            }
            if (route.params.id && filterValues.value.period) {
                filterValues.value.period = periodInventories.filter((x) => x.id == filterValues.value.period?.id)[0];
            }
            filterperiods.value = periodInventories;
        })
        .catch((error) => {});
});
onUnmounted(async () => {});

onBeforeMount(async () => {
    initFilters();
});

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        fixedAssetNumber: { matchMode: FilterMatchMode.CONTAINS },
        subAssetNumber: { matchMode: FilterMatchMode.CONTAINS }
    };
}

//#endregion

//#region

const getCostCenterInventoryDetail = async (periodId, costcenter) => {
    // flatten filters for query string
    loadingDetail.value = true;
    const { data } = await CostCenterInventoryService.getCostCenterInventoryByPeriodAndCostCenter(periodId, costcenter);
    currentCostCenterInventory.value = data;
    loadingDetail.value = false;
    rowDetails.value = data.costCenterInventoryDetails;
    rowOtherDetails.value = data.costCenterInventoryDetailOthers;
    dialogTitle.value = `${data.periodName}(${data.periodType})-${data.costCenterName}`;
    rowNoteDetails.value = data.remarks;
    rowNoteAssetDetails.value = data.costCenterInventoryDetails.concat(data.costCenterInventoryDetailOthers).filter((x) => x.remark);
    rowLogActions.value = data.logActions;
};
const getCostCenterInventoryDetailById = async (id) => {
    // flatten filters for query string
    loadingDetail.value = true;
    const { data } = await CostCenterInventoryService.getCostCenterInventoryById(id);
    currentCostCenterInventory.value = data;
    loadingDetail.value = false;
    rowDetails.value = data.costCenterInventoryDetails;
    rowOtherDetails.value = data.costCenterInventoryDetailOthers;
    dialogTitle.value = `${data.periodName}(${data.periodType})-${data.costCenterName}`;
    rowNoteDetails.value = data.remarks;
    rowNoteAssetDetails.value = data.costCenterInventoryDetails.concat(data.costCenterInventoryDetailOthers).filter((x) => x.remark);
    rowLogActions.value = data.logActions;
    filterValues.value.period = { id: data.periodId };
};

const rowDetailsStyle = (rowData) => {
    if (rowData.statusScan == 'Not Found') {
        return { background: '#CCCCCC !important' };
    }
    if (rowData.statusScan == 'Incomplete') {
        return { background: '#ea9e99 !important' };
    }
    return null;
};
const onRowClick = (event) => {
    if (CommonService.isMobile()) {
        globalStore.periodId = route.params.periodId;
        globalStore.costcenter = route.params.costcenter;
        router.push(`/inventories/mobile/updateCostCenterDetail/${event.data.id}`);
    }
};
const onChangePeriod = () => {
    getCostCenterInventoryDetail(filterValues.value.period.id, currentCostCenterInventory.value.costCenter);
};

//#endregion
</script>

<template>
    <div class="card">
        <div class="advanced-search-panel">
            <div class="search-field">
                <label for="StatusRemark">
                    Period : <span class="value"> {{ filterValues?.period?.name }}</span>
                </label>
            </div>
            <div class="search-field">
                <label for="StatusRemark">
                    Status : <span class="value"> {{ currentCostCenterInventory?.status }} </span>
                </label>
            </div>
            <div v-if="currentCostCenterInventory?.requestToOpenStatus" class="search-field">
                <label for="StatusRemark"
                    >Status Request To Open : <span class="value"> {{ currentCostCenterInventory?.requestToOpenStatus }} </span>
                </label>
            </div>
            <div class="search-field">
                <label for="StatusRemark"
                    >Cost Center : <span class="value"> {{ currentCostCenterInventory?.costCenterName }} </span></label
                >
            </div>
            <div class="search-field">
                <label for="StatusRemark"
                    >Total : <span class="value"> {{ currentCostCenterInventory?.total }} </span></label
                >
            </div>
            <div class="search-field">
                <label for="StatusRemark"
                    >Complete : <span class="value"> {{ rowDetails?.filter((x) => x.statusScan == 'Complete').length }} </span></label
                >
            </div>
            <div class="search-field">
                <label style="color: #999999" for="StatusRemark"
                    >Not Found : <span style="color: #999999" class="value"> {{ rowDetails?.filter((x) => x.statusScan == 'Not Found').length }} </span></label
                >
            </div>
            <div class="search-field">
                <label style="color: #ea9e99" for="StatusRemark"
                    >Incomplete : <span style="color: #ea9e99" class="value"> {{ rowDetails?.filter((x) => x.statusScan == 'Incomplete').length }} </span></label
                >
            </div>
        </div>

        <Tabs value="0">
            <TabList>
                <Tab value="0">Booked</Tab>
                <Tab value="1">Other</Tab>
                <Tab value="2">Note</Tab>
                <Tab value="3">Log</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <DataTable
                        scrollable
                        scrollHeight="700px"
                        :rowStyle="rowDetailsStyle"
                        @row-click="onRowClick"
                        :value="rowDetails"
                        :paginator="false"
                        dataKey="id"
                        :rowHover="true"
                        filterDisplay="menu"
                        :loading="loadingDetail"
                        :rowsPerPageOptions="[5, 10, 20, 50]"
                    >
                        <template #empty> No Assets found. </template>
                        <template #loading> Loading Assets data. Please wait. </template>
                        <Column header="Image">
                            <template #body="{ data }">
                                <Image alt="Image">
                                    <template #image>
                                        <img :src="`${baseURL}${data.imageDefault?.imagePathSmall}`" @click="openPopup(data)" alt="image" class="w-24 h-24 rounded" />
                                    </template>
                                </Image>
                            </template>
                        </Column>
                        <Column field="costCenterName" header="Cost Center Name" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.costCenterName }}
                            </template>
                        </Column>
                        <Column field="assetName" header="Asset Name" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.assetName }}
                            </template>
                        </Column>
                        <Column field="assetCode" header="Asset Code" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.assetCode }}
                            </template>
                        </Column>
                        <Column field="statusAsset" header="Status Asset" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.statusAsset }}
                            </template>
                        </Column>
                        <Column field="statusScan" header="Status Scan" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.statusScan }}
                            </template>
                        </Column>
                        <Column field="remark" header="Remark" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.remark }}
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
                <TabPanel value="1">
                    <DataTable scrollable scrollHeight="450px" :rowStyle="rowDetailsStyle" @row-click="onRowClick" :value="rowOtherDetails" :paginator="false" dataKey="id" :rowHover="true" filterDisplay="menu" :rowsPerPageOptions="[5, 10, 20, 50]">
                        <template #empty> No Other Assets found. </template>
                        <template #loading> Loading Other Assets data. Please wait. </template>
                        <Column header="Image">
                            <template #body="{ data }">
                                <Image alt="Image">
                                    <template #image>
                                        <img :src="`${baseURL}${data.imageDefault?.imagePathSmall}`" @click="openPopup(data)" alt="image" class="w-24 h-24 rounded" />
                                    </template>
                                </Image>
                            </template>
                        </Column>
                        <Column field="costCenterName" header="Cost Center Name" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.costCenterName }}
                            </template>
                        </Column>
                        <Column field="assetName" header="Asset Name" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.assetName }}
                            </template>
                        </Column>
                        <Column field="assetCode" header="Asset Code" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.assetCode }}
                            </template>
                        </Column>
                        <Column field="statusAsset" header="Status Asset" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.statusAsset }}
                            </template>
                        </Column>
                        <Column field="statusScan" header="Status Scan" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.statusScan }}
                            </template>
                        </Column>
                        <Column field="remark" header="Remark" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.remark }}
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
                <TabPanel value="2">
                    <Panel style="border-width: 1px; border-color: black; margin-bottom: 1rem" header="Overview" toggleable>
                        <DataTable
                            style="border-spacing: 5px"
                            scrollable
                            :value="rowNoteDetails"
                            :paginator="false"
                            dataKey="id"
                            :rowHover="true"
                            filterDisplay="menu"
                            :loading="loadingDetail"
                            :rowsPerPageOptions="[5, 10, 20, 50]"
                            :rowStyle="rowDetailsStyle"
                        >
                            <template #empty> No Note for Cost Center Inventory. </template>
                            <template #loading> Loading Note for Cost Center Inventory data. Please wait. </template>

                            <Column :headerStyle="{ display: 'none' }" header="" style="padding-left: 2px; padding-right: 2px; border: none">
                                <template #body="{ data }">
                                    <span class="userName"> {{ data.userName }} </span>
                                    <br />
                                    <div class="note">
                                        {{ data.content }} ( <span class="time">{{ moment(data.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</span> )
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </Panel>
                    <Panel style="border-width: 1px; border-color: black" header="Detailed notes" toggleable>
                        <DataTable scrollable:value="rowNoteAssetDetails" :paginator="false" dataKey="id" :rowHover="true" filterDisplay="menu" :loading="loadingDetail" :rowsPerPageOptions="[5, 10, 20, 50]">
                            <template #empty> No Detailed notes Cost Center Inventory found. </template>
                            <template #loading> Loading Detailed notes Cost Center Inventory data. Please wait. </template>

                            <Column :headerStyle="{ display: 'none' }" header="" style="padding-left: 2px; padding-right: 2px; border: none">
                                <template #body="{ data }">
                                    <span class="userName"> {{ data.assetName }} - {{ data.assetCode }} </span>
                                    <br />
                                    <div class="note">
                                        {{ data.remark }} ( <span class="time">{{ moment(data.remarks[0].createdAt).format('YYYY-MM-DD HH:mm:ss') }}</span> by {{ data.remarks[0].userName }} )
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </Panel>
                </TabPanel>
                <TabPanel value="3">
                    <DataTable scrollable scrollHeight="250px" :value="rowLogActions" :paginator="false" dataKey="id" :rowHover="true" filterDisplay="menu" :loading="loadingDetail" :rowsPerPageOptions="[5, 10, 20, 50]" :rowStyle="rowDetailsStyle">
                        <template #empty> No Log found. </template>
                        <template #loading> Loading Log data. Please wait. </template>

                        <Column :headerStyle="{ display: 'none' }" header="" style="padding-left: 2px; padding-right: 2px; border: none">
                            <template #body="{ data }">
                                <span class="userName"> {{ data.userName }} </span>
                                <br />
                                <div class="note">
                                    {{ data.content }} ( <span class="time">{{ moment(data.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</span> )
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>

    <!-- Popup Dialog -->

    <ConfirmDialog></ConfirmDialog>
</template>

<style scoped lang="scss">
.column1 {
    padding: 2px;
    border-color: black;
    border-width: 1px 0px 1px 1px;
    width: 200%;
    height: 80px;
}
.column2 {
    padding: 2px;
    border-color: black;
    border-width: 1px 0px 1px 0px;
    width: 100%;
    height: 80px;
}
.column3 {
    padding: 2px;
    border-color: black;
    border-width: 1px 1px 1px 0px;
    width: 100%;
    height: 80px;
}

.time {
    font-weight: 900;
}
.custom-datatable {
    border: 0.1rem solid;
    border-radius: 6px;
    overflow: hidden;
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
    width: 80%;
}

/* 2. Each field wrapper */
.search-field {
    display: flex;
    flex-direction: column;
    padding-bottom: 0.7rem;
}

.search-field label {
    font-weight: 600;
    color: #333;
}

/* 3. Button group */
.search-buttons {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
}

.searchbutton {
    margin-right: 2rem;
}

.search-buttons button {
    min-width: 31%;
}

.advanced-search-wrapper-filter {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* 1. The panel container */
.advanced-search-panel-filter {
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
.search-field-filter {
    display: flex;
    flex-direction: column;
}

.search-field-filter label {
    margin-bottom: 0.25rem;
    font-weight: 600;
    color: #333;
}

/* 3. Button group */
.search-buttons-filter {
    display: contents;
    gap: 0.5rem;
    align-items: center;
}

.value {
    color: var(--p-button-primary-background);
}

:deep(.p-dialog-header) {
    border-bottom: 1px solid #e5e7eb;
    padding: 1.25rem;
}

:deep(.p-dialog-content) {
    padding: 0;
    text-align: center;
}

.p-field label {
    color: #374151;
}

:deep(.p-inputtext) {
    border-radius: 6px;
    transition: border-color 0.2s;
}

:deep(.p-inputtext:hover),
:deep(.p-inputtext:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 1px var(--primary-color);
}

:deep(.p-dropdown:hover),
:deep(.p-calendar:hover) {
    border-color: var(--primary-color);
}

:deep(.p-button) {
    transition: all 0.2s;
    min-width: 100px;
    //  margin-right: 2rem;
}

.assetName {
    font-size: 0.9rem;
    font-weight: 900;
}

.assetCode {
    font-size: 0.9rem;
}

.tdStatusScanNotFound {
    background: #ea9e99 !important;
}
.tdStatusScanIncomplete {
    background: #999999 !important;
}
.userName {
    font-size: 0.9rem;
    font-weight: 900;
}

.note {
    font-size: 0.9rem;
    margin-left: 2rem;
}
</style>
