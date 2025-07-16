<script setup>
//#region
import router from '@/router';
import { CommonService } from '@/service/CommonService';
import { CostCenterInventoryService } from '@/service/CostCenterInventoryService';
import { PeriodService } from '@/service/PeriodService';
import { useGlobalStore } from '@/stores/global';
import { FilterMatchMode } from '@primevue/core/api';
import moment from 'moment';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
const confirm = useConfirm();
var intervalId;
var intervalIdProcessScanResult;
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

const note = ref('');
onMounted(async () => {
    if (route.params.periodId && route.params.costcenter) await getCostCenterInventoryDetail(route.params.periodId, route.params.costcenter);
    const params = {
        pageNumber: 1,
        pageSize: 1000
    };
    PeriodService.getperiods(params)
        .then((response) => {
            var periodInventories = response.data.items
                .filter((x) => x.status == 'Openning' || x.id == route.params.periodId)
                .map((x) => {
                    x.name = `${x.name}(${x.type})`;
                    return x;
                });
            if (periodInventories && periodInventories.length > 0) {
                filterValues.value.period = periodInventories.filter((x) => x.id == route.params.periodId)[0];
            }
            filterperiods.value = periodInventories;
        })
        .catch((error) => {});
});
onUnmounted(async () => {
    clearInterval(intervalId);
    clearInterval(intervalIdProcessScanResult);
});

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

const fetchDataForInventoryCostCenter = async () => {
    console.log('starting.........');
    if (!document.getElementById('rfids')) return;
    var rfids = [];
    rfids = document.getElementById('rfids').value;
    console.log(rfids);
    var addsearchRfids = [];
    rfids
        .split('\n')
        .filter((t) => t.length == 24)
        .map((x) => {
            addsearchRfids.push(x);
            searchRfids.value.push(x);
        });
    console.log(addsearchRfids);
    if (addsearchRfids.length == 0) return;

    // flatten filters for query string
    const params = {
        costCenter: currentCostCenterInventory?.value.costCenter,
        periodId: currentCostCenterInventory?.value.periodId,
        rfids: addsearchRfids
    };

    //loadingDetail.value=true
    globalStore.disiableLoading = true;
    await CostCenterInventoryService.scanAssetsCostCenterInventory(params).then((response) => {
        const { data } = response;
        dataScanRFIDResult.push(data);
    });

    globalStore.disiableLoading = false;

    // loadingDetail.value=false
};

const processScanRFIDResult = async () => {
    dataScanRFIDResult.map((data) => {
        var costCenterInventoryDetails = data.filter((x) => x.isMatch);
        var costCenterInventoryDetailOthers = data.filter((x) => !x.isMatch);

        //  rowDetails.value = [...rowDetails.value, ...costCenterInventoryDetails];
        var finalRows = [];
        rowDetails.value.map((x) => {
            if (!finalRows.find((y) => y.assetId == x.assetId) && !costCenterInventoryDetails.find((y) => y.assetId == x.assetId)) finalRows.push(x);
        });
        costCenterInventoryDetails.map((x) => {
            if (!finalRows.find((y) => y.assetId == x.assetId)) finalRows.push(x);
        });
        finalRows = finalRows.sort((a, b) => {
            if (!a.modifiedAt && !b.modifiedAt) {
                return 0;
            }
            if (a.modifiedAt && b.modifiedAt) {
                return a.modifiedAt > b.modifiedAt ? -1 : 1;
            }
            if (a.modifiedAt && !b.modifiedAt) {
                return -1;
            }
            if (!a.modifiedAt && b.modifiedAt) {
                return 1;
            }
        });
        rowDetails.value = finalRows;

        var finalOtherRows = [];
        rowOtherDetails.value.map((x) => {
            if (!finalOtherRows.find((y) => y.assetId == x.assetId) && !costCenterInventoryDetailOthers.find((y) => y.assetId == x.assetId)) finalOtherRows.push(x);
        });
        costCenterInventoryDetailOthers.map((x) => {
            if (!finalOtherRows.find((y) => y.assetId == x.assetId)) finalOtherRows.push(x);
        });
        finalOtherRows = finalOtherRows.sort((a, b) => {
            return a.modifiedAt > b.modifiedAt ? 1 : -1;
        });
        rowOtherDetails.value = finalOtherRows;
    });
};
//#endregion

//#region

const clearRfids = () => {
    const textarea = document.getElementById('rfids');
    if (!textarea) return;
    //textarea.focus();
    //textarea.readOnly = !textarea.readOnly;
    textarea.value = '';
    var searchRfidsShow = [];
    searchRfids.value.map((x) => {
        if (!searchRfidsShow.find((y) => y == x)) {
            searchRfidsShow.push(x);
        }
    });
    document.getElementById('realrfids').value = searchRfidsShow.length + '\n' + searchRfidsShow.join('\n');
    searchRfids.value = [];
    dataScanRFIDResult = [];
};

const getCostCenterInventoryDetail = async (periodId, costcenter) => {
    clearInterval(intervalId);
    clearInterval(intervalIdProcessScanResult);
    intervalId = setInterval(fetchDataForInventoryCostCenter, 1000);
    intervalIdProcessScanResult = setInterval(processScanRFIDResult, 1000);

    // flatten filters for query string
    loadingDetail.value = true;
    const { data } = await CostCenterInventoryService.getCostCenterInventoryByPeriodAndCostCenter(periodId, costcenter);
    openPopup();
    currentCostCenterInventory.value = data;
    loadingDetail.value = false;
    rowDetails.value = data.costCenterInventoryDetails;
    rowOtherDetails.value = data.costCenterInventoryDetailOthers;
    dialogTitle.value = `${data.periodName}(${data.periodType})-${data.costCenterName}-${data.costCenter}`;
    rowNoteDetails.value = data.remarks;
    rowNoteAssetDetails.value = data.costCenterInventoryDetails.concat(data.costCenterInventoryDetailOthers).filter((x) => x.remark);
    rowLogActions.value = data.logActions;
};

const startPauseCostCenterInventoryDetail = async (periodId, costcenter, isPause) => {
    // flatten filters for query string
    loadingDetail.value = true;
    if (isPause) {
        clearInterval(intervalId);
        clearInterval(intervalIdProcessScanResult);
    }
    CostCenterInventoryService.startPauseScanCostCenterInventory({ periodId, costcenter, isPause })
        .then(async (response) => {
            openPopup();
            const { data } = response;

            currentCostCenterInventory.value = data;
            rowDetails.value = data.costCenterInventoryDetails;
            rowOtherDetails.value = data.costCenterInventoryDetailOthers;
            dialogTitle.value = 'Cost Center Inventory-' + `${data.periodName}-${data.costCenterName}-${data.costCenter}`;
            currentCostCenterInventory.value.status = data.status;
            loadingDetail.value = false;
            rowNoteDetails.value = data.remarks;
            rowNoteAssetDetails.value = data.costCenterInventoryDetails.concat(data.costCenterInventoryDetailOthers).filter((x) => x.remark);
            rowLogActions.value = data.logActions;
            //fetchData();
            clearRfids();
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
        });

    if (!isPause) {
        intervalId = setInterval(fetchDataForInventoryCostCenter, 1000);
        intervalIdProcessScanResult = setInterval(processScanRFIDResult, 1000);
    }
};
const resetCostCenterInventory = async (periodId, costcenter) => {
    confirm.require({
        message: 'Are you sure you want reset?',
        header: 'Danger Zone',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Cancel',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Reset',
            severity: 'danger'
        },
        accept: async () => {
            loadingDetail.value = true;
            await CostCenterInventoryService.resetScanCostCenterInventory({ periodId, costcenter })
                .then((response) => {
                    if (response && response.data) {
                        let data = response.data;
                        currentCostCenterInventory.value = data;
                        rowDetails.value = data.costCenterInventoryDetails;
                        rowOtherDetails.value = data.costCenterInventoryDetailOthers;
                        dialogTitle.value = 'Cost Center Inventory-' + `${data.periodName}-${data.costCenterName}-${data.costCenter}`;
                        currentCostCenterInventory.value.status = data.status;
                        loadingDetail.value = false;
                        rowNoteDetails.value = data.remarks;
                        rowNoteAssetDetails.value = data.costCenterInventoryDetails.concat(data.costCenterInventoryDetailOthers).filter((x) => x.remark);
                        rowLogActions.value = data.logActions;
                        loadingDetail.value = false;
                    }
                    clearRfids();
                })
                .catch((error) => {
                    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
                });

            //toast.add({ severity: 'info', summary: 'Confirmed', detail: 'Record deleted', life: 3000 });
        },
        reject: () => {
            //toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
        }
    });
};
const finishCostCenterInventory = async (periodId, costcenter) => {
    confirm.require({
        message: 'Are you sure you want finish?',
        header: 'Danger Zone',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Cancel',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Finish',
            severity: 'danger'
        },
        accept: async () => {
            clearInterval(intervalId);
            clearInterval(intervalIdProcessScanResult);

            loadingDetail.value = true;
            await CostCenterInventoryService.finishScanCostCenterInventory({ periodId, costcenter })
                .then((response) => {
                    if (response && response.data) {
                        currentCostCenterInventory.value.status = 'Finished';
                        rowNoteDetails.value = response.data.remarks;
                        rowNoteAssetDetails.value = response.data.costCenterInventoryDetails.concat(response.data.costCenterInventoryDetailOthers).filter((x) => x.remark);
                        rowLogActions.value = response.data.logActions;
                        loadingDetail.value = false;
                    }
                    clearRfids();
                })
                .catch((error) => {
                    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
                });

            //toast.add({ severity: 'info', summary: 'Confirmed', detail: 'Record deleted', life: 3000 });
        },
        reject: () => {
            //toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
        }
    });
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

const rowDetailStatusScanStyle = (rowData) => {
    if (rowData.statusScan != 'Incomplete' && rowData.statusAsset == 'Damage') {
        return { color: '#ea9e99 !important' };
    } else if (rowData.statusAsset == 'Use') {
        return { color: '#10B981 !important' };
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
    getCostCenterInventoryDetail(filterValues.value.period.id, route.params.costcenter);
};

const requestToOpenCostCenterInventory = async () => {
    CostCenterInventoryService.requestToOpenCostCenterInventory(currentCostCenterInventory.value.id)
        .then((response) => {
            if (response.data) {
                getCostCenterInventoryDetail(filterValues.value.period.id, route.params.costcenter);
            }
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
        });
};
const addNote = () => {
    CostCenterInventoryService.addRemarkToCostCenterInventory({ id: currentCostCenterInventory.value.id, remark: note.value }).then((response) => {
        if (response.data) {
            rowNoteDetails.value = response.data;
            note.value = '';
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Add Note successfully', life: 3000 });
        }
    });
};
//#endregion
</script>

<template>
    <div class="card" v-if="CommonService.isMobile()">
        <div class="font-semibold text-xl mb-4">{{ dialogTitle }}</div>
        <div class="advanced-search-panel">
            <div class="search-field">
                <Select @change="onChangePeriod" style="width: 100%" :options="filterperiods" v-model="filterValues.period" optionLabel="name" placeholder="Select a Period" />
            </div>
            <div class="search-field">
                <label for="StatusRemark">
                    Status : <span class="value"> {{ currentCostCenterInventory?.status }} </span>
                </label>
            </div>
            <div v-if="currentCostCenterInventory?.requestToOpenStatus" class="search-field">
                <label for="StatusRemark">
                    Status Request To Open :
                    <span class="value"> {{ currentCostCenterInventory?.requestToOpenStatus }} </span>
                </label>
            </div>

            <div class="search-field">
                <label for="StatusRemark">
                    Total : <span style="margin-right: 2rem" class="value"> {{ currentCostCenterInventory?.total }} </span> Complete :
                    <span style="margin-right: 2rem" class="value"> {{ rowDetails?.filter((x) => x.statusScan == 'Complete').length }} </span> Not Found :
                    <span style="color: #999999; margin-right: 2rem" class="value"> {{ rowDetails?.filter((x) => x.statusScan == 'Not Found').length }} </span> Incomplete :
                    <span style="color: #ea9e99" class="value"> {{ rowDetails?.filter((x) => x.statusScan == 'Incomplete').length }} </span>
                </label>
            </div>

            <div class="search-buttons">
                <Button v-if="currentCostCenterInventory?.status == 'Scanning'" @click="startPauseCostCenterInventoryDetail(currentCostCenterInventory?.periodId, currentCostCenterInventory?.costCenter, true)" label="Pause" icon="pi" class="button" />
                <Button
                    v-if="currentCostCenterInventory?.status == 'Pause'"
                    @click="startPauseCostCenterInventoryDetail(currentCostCenterInventory?.periodId, currentCostCenterInventory?.costCenter, false)"
                    label="Continue"
                    icon="pi"
                    class="button"
                />

                <Button v-if="currentCostCenterInventory?.status == 'Scanning'" @click="finishCostCenterInventory(currentCostCenterInventory?.periodId, currentCostCenterInventory?.costCenter)" label="Finish" icon="pi" class="button" />
                <Button v-if="currentCostCenterInventory?.status == 'Scanning'" @click="resetCostCenterInventory(currentCostCenterInventory?.periodId, currentCostCenterInventory?.costCenter, false)" label="Reset" icon="pi" class="button" />
                <Button
                    v-if="currentCostCenterInventory?.status == 'None'"
                    @click="startPauseCostCenterInventoryDetail(currentCostCenterInventory?.periodId, currentCostCenterInventory?.costCenter, false)"
                    label="Start Scan"
                    icon="pi"
                    class="button"
                />
                <Button
                    @click="requestToOpenCostCenterInventory()"
                    v-if="currentCostCenterInventory?.status == 'Finished' && currentCostCenterInventory?.requestToOpenStatus != 'Waiting For Approve'"
                    label="Request To Open"
                    icon="pi"
                    class="button"
                />
            </div>

            <div id="divrfids" class="search-field">
                <textarea id="rfids" name="rfids" rows="5" cols="30" style="resize: none"> </textarea>
            </div>
            <br />
            <div id="divrealrfids" style="display: none" class="search-field">
                <textarea id="realrfids" name="realrfids" rows="5" cols="30" style="resize: none"> </textarea>
            </div>
            <div class="search-buttons">
                <Button @click="clearRfids()" label="Reset Rfid" icon="pi" class="button" />
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
                    <DataTable scrollable scrollHeight="300px" @row-click="onRowClick" :value="rowDetails" :paginator="false" dataKey="id" :rowHover="true" filterDisplay="menu" :loading="loadingDetail" :rowsPerPageOptions="[5, 10, 20, 50]">
                        <template #empty> No Assets found. </template>
                        <template #loading> Loading Assets data. Please wait. </template>

                        <Column :headerStyle="{ display: 'none' }" header="" style="padding-left: 0px; padding-right: 0px; width: 50%; border-width: 0px 0px 0px 0px">
                            <template #body="{ data }">
                                <div class="column1" :style="rowDetailsStyle(data)">
                                    <span class="assetName"> {{ data.costCenterName }}</span>
                                    <br />
                                    <span class="assetName"> {{ data.assetName }}</span>
                                    <br />
                                    <span class="assetCode"> {{ data.assetCode }}</span>
                                    <br />
                                    <span :style="rowDetailStatusScanStyle(data)" class="statusAsset"> {{ data.statusAsset }}</span>
                                </div>
                            </template>
                        </Column>
                        <Column :headerStyle="{ display: 'none' }" header="" style="padding-left: 0px; padding-right: 0px; width: 30%; border-width: 0px 0px 0px 0px">
                            <template #body="{ data }">
                                <div class="column2" :style="rowDetailsStyle(data)">
                                    <Image v-if="data.imageDefault && data.imageDefault?.imagePath" alt="Image" preview>
                                        <template #image>
                                            <img style="height: 70px; width: 70px" :src="`${baseURL}${data.imageDefault?.imagePathSmall}`" alt="image" class="rounded" />
                                        </template>
                                        <template #preview="slotProps">
                                            <img :src="`${baseURL}${data.imageDefault?.imagePath}`" alt="preview" :style="slotProps.style" @click="slotProps.onClick" />
                                        </template>
                                    </Image>
                                </div>
                            </template>
                        </Column>

                        <Column :headerStyle="{ display: 'none' }" style="padding-left: 0px; padding-right: 0px; width: 20%; border-width: 0px 0px 0px 0px">
                            <template #body="{ data }">
                                <div class="column3" :style="rowDetailsStyle(data)">
                                    <i v-if="data.statusScan == 'Complete'" class="pi pi-check" style="font-size: 1.5rem; color: var(--p-button-primary-background); margin-right: 10px"></i>
                                    <i v-if="data.remark" class="pi pi-comments" style="font-size: 1.5rem; color: var(--p-button-primary-background)"></i>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
                <TabPanel value="1">
                    <DataTable :table-style="{ 'border-spacing': '5px' }" @row-click="onRowClick" :value="rowOtherDetails" :paginator="false" dataKey="id" :rowHover="true" filterDisplay="menu" :rowsPerPageOptions="[5, 10, 20, 50]">
                        <template #empty> No Other Assets found. </template>
                        <template #loading> Loading Other Assets data. Please wait. </template>
                        <Column :headerStyle="{ display: 'none' }" header="" style="padding-left: 0px; padding-right: 0px; width: 50%; border-width: 0px 0px 0px 0px">
                            <template #body="{ data }">
                                <div class="column1" :style="rowDetailsStyle(data)">
                                    <span class="assetName"> {{ data.costCenterName }}</span>
                                    <br />
                                    <span class="assetName"> {{ data.assetName }}</span>
                                    <br />
                                    <span class="assetCode"> {{ data.assetCode }}</span>
                                    <br />
                                    <span :style="rowDetailStatusScanStyle(data)" class="statusAsset"> {{ data.statusAsset }}</span>
                                </div>
                            </template>
                        </Column>
                        <Column :headerStyle="{ display: 'none' }" header="" style="padding-left: 0px; padding-right: 0px; width: 30%; border-width: 0px 0px 0px 0px">
                            <template #body="{ data }">
                                <div class="column2" :style="rowDetailsStyle(data)">
                                    <Image v-if="data.imageDefault && data.imageDefault?.imagePath" alt="Image" preview>
                                        <template #image>
                                            <img style="height: 70px; width: 70px" :src="`${baseURL}${data.imageDefault?.imagePathSmall}`" alt="image" class="rounded" />
                                        </template>
                                        <template #preview="slotProps">
                                            <img :src="`${baseURL}${data.imageDefault?.imagePath}`" alt="preview" :style="slotProps.style" @click="slotProps.onClick" />
                                        </template>
                                    </Image>
                                </div>
                            </template>
                        </Column>

                        <Column :headerStyle="{ display: 'none' }" style="padding-left: 0px; padding-right: 0px; width: 20%; border-width: 0px 0px 0px 0px">
                            <template #body="{ data }">
                                <div class="column3" :style="rowDetailsStyle(data)">
                                    <i v-if="data.statusScan == 'Complete'" class="pi pi-check" style="font-size: 1.5rem; color: var(--p-button-primary-background); margin-right: 10px"></i>
                                    <i v-if="data.remark" class="pi pi-comments" style="font-size: 1.5rem; color: var(--p-button-primary-background)"></i>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
                <TabPanel value="2">
                    <Panel style="border-width: 1px; border-color: black; margin-bottom: 1rem" header="Overview" toggleable>
                        <DataTable
                            style="border-spacing: 5px"
                            scrollable
                            scrollHeight="250px"
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
                        <div class="search-field">
                            <br />
                            <Textarea v-model="note" placeholder="Note" id="address1" />
                            <br />
                            <Button @click="addNote()" :disabled="note?.length == 0" label="Add Note" icon="pi" class="Add" /></div
                    ></Panel>
                    <Panel style="border-width: 1px; border-color: black" header="Detailed notes" toggleable>
                        <DataTable
                            @row-click="onRowClick"
                            scrollable
                            scrollHeight="250px"
                            :value="rowNoteAssetDetails"
                            :paginator="false"
                            dataKey="id"
                            :rowHover="true"
                            filterDisplay="menu"
                            :loading="loadingDetail"
                            :rowsPerPageOptions="[5, 10, 20, 50]"
                        >
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
    display: inline-table;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 0.5rem;
    align-items: end;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    width: 100%;
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
    font-size: 1.25rem;
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
.statusAsset {
    font-size: 0.9rem;
    font-weight: 900;
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
