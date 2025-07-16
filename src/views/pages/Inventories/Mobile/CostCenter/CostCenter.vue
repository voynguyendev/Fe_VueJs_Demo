<script setup>
//#region
import router from '@/router';
import { CommonService } from '@/service/CommonService';
import { CostCenterInventoryService } from '@/service/CostCenterInventoryService';
import { PeriodService } from '@/service/PeriodService';
import { useGlobalStore } from '@/stores/global';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue';
let intervalId;
const currentCostCenterInventory = ref(null);
const displayPopup = ref(false);
const toast = useToast();
const filters = ref(null);
const rows = ref(null);
const rowDetails = ref(null);
const rowOtherDetails = ref(null);

const totalRecords = ref(null);
const loading = ref(null);
const loadingDetail = ref(null);
const searchRfids = ref([]);
const isChecking = ref(false);
const datacostCenter = {
    pagination: {
        first: 0,
        rows: 10,
        sortField: null,
        sortOrder: null // 1 = asc, -1 = desc
    }
};
const dialogTitle = ref('');
const currentCostCenterInventoryId = ref(0);
const filterValues = ref({
    type: 'Stock Taking',
    period: null,
    codeCenterName: '',
    codeCenterValue: ''
});
const periods = ref([]);
const filterperiods = ref([]);
const globalStore = useGlobalStore();
//#endregion

//#region
const openPopup = async () => {
    if (!CommonService.isMobile()) displayPopup.value = true;
};

onMounted(async () => {
    // Add message handler

    const params = {
        pageNumber: 1,
        pageSize: 1000
    };
    PeriodService.getperiods(params)
        .then((response) => {
            if (!CommonService.isMobile()) {
                periods.value = response.data.items;
                filterperiods.value = response.data.items.filter((x) => x.type == filterValues.value.type);
                filterperiods.value.unshift({ name: 'All' });
                filterValues.value.period = filterperiods.value[0];
            } else {
                var periodInventories = response.data.items.filter((x) => x.status == 'Openning');
                if (periodInventories && periodInventories.length > 0) {
                    filterValues.value.period = periodInventories[0];
                }
            }
            fetchData();
        })
        .catch((error) => {});
});

onBeforeMount(async () => {
    initFilters();
});
onUnmounted(async () => {
    clearInterval(intervalId);
});

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        fixedAssetNumber: { matchMode: FilterMatchMode.CONTAINS },
        subAssetNumber: { matchMode: FilterMatchMode.CONTAINS }
    };
}

const onStartOrViewCostCenter = async (periodid, costCenter, status, isstart) => {
    if (status == 'None' || (status == 'Finished' && isstart)) {
        await startPauseCostCenterInventoryDetail(periodid, costCenter, false);
    }
    if (status == 'Pause') {
        await startPauseCostCenterInventoryDetail(periodid, costCenter, false);
    }

    router.push(`/inventories/mobile/costcenters/${periodid}/${costCenter}`);
};
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
    globalStore.disiableLoading = true;
    //loadingDetail.value=true
    CostCenterInventoryService.scanAssetsCostCenterInventory(params).then((response) => {
        const { data } = response;
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
        rowDetails.value = finalRows;

        var finalOtherRows = [];
        rowOtherDetails.value.map((x) => {
            if (!finalOtherRows.find((y) => y.assetId == x.assetId) && !costCenterInventoryDetailOthers.find((y) => y.assetId == x.assetId)) finalOtherRows.push(x);
        });
        costCenterInventoryDetailOthers.map((x) => {
            if (!finalOtherRows.find((y) => y.assetId == x.assetId)) finalOtherRows.push(x);
        });
        rowOtherDetails.value = finalOtherRows;

        currentCostCenterInventory.value.complete = rowDetails.value.filter((z) => z.statusScan == 'Complete').length;
    });
    // loadingDetail.value=false
};

//#endregion

//#region

const onLazyEvent = async (event) => {
    // event contains: first, rows, sortField, sortOrder, filters
    datacostCenter.pagination = { ...event };
    fetchData();
};

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
};

const fetchData = async () => {
    // flatten filters for query string
    const params = {
        pageNumber: datacostCenter.pagination.first / datacostCenter.pagination.rows + 1,
        pageSize: datacostCenter.pagination.rows,
        sortField: datacostCenter.pagination.sortField,
        sortOrder: datacostCenter.pagination.sortOrder,
        periodId: filterValues.value.period ? filterValues.value.period.id : null,
        costCenterName: filterValues.value.codeCenterName,
        costCenterValue: filterValues.value.codeCenterValue,
        isIncludeFirstItem: false,
        isIncludeChildrent: false
    };
    loading.value = true;
    const { data } = await CostCenterInventoryService.getCostCentersForInventory(params);
    loading.value = false;
    rows.value = data.items;
    if (data.items.length > 0) {
        currentCostCenterInventory.value = data.items[0];
        currentCostCenterInventoryId.value = data.items[0].id;
    }
    totalRecords.value = data.totalRecords;
};

const startPauseCostCenterInventoryDetail = async (periodId, costcenter, isPause) => {
    // flatten filters for query string
    loadingDetail.value = true;
    if (isPause) clearInterval(intervalId);
    await CostCenterInventoryService.startPauseScanCostCenterInventory({ periodId, costcenter, isPause })
        .then(async (response) => {
            openPopup();
            const { data } = response;

            currentCostCenterInventory.value = data;
            rowDetails.value = data.costCenterInventoryDetails;
            rowOtherDetails.value = data.costCenterInventoryDetailOthers;
            dialogTitle.value = 'Cost Center Inventory-' + `${data.periodName}-${data.costCenterName}`;
            currentCostCenterInventory.value.status = data.status;
            loadingDetail.value = false;

            //fetchData();
            clearRfids();
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
        });

    if (!isPause) {
        intervalId = setInterval(fetchDataForInventoryCostCenter, 1000);
    }
};

const onSearch = async () => {
    await fetchData();
};

const onChange = (data) => {
    currentCostCenterInventory.value = data;
    console.log(data);
};
const rowDetailsStyle = (rowData) => {
    if (rowData.status == 'Finished') {
        return { color: '#10B981', 'margin-left': '1rem', 'font-weight': '900' };
    } else if (rowData.status == 'None') {
        return { 'margin-left': '1rem', 'font-weight': '900' };
    } else return { color: '#ea9e99', 'margin-left': '1rem', 'font-weight': '900' };
};

//#endregion
</script>

<template>
    <div class="card" v-if="CommonService.isMobile()">
        <div class="font-semibold text-xl mb-4">Cost Center Inventoy Managerment</div>
        <div class="advanced-search-panel-filter">
            <div class="search-field-filter">
                <label for="codeCenterName">Cost Center Name</label>
                <InputText v-model="filterValues.codeCenterName" id="codeCenterName" placeholder="Cost Center Name" />
            </div>
            <div class="search-field-filter">
                <label for="codeCenterValue">Cost Center </label>
                <InputText v-model="filterValues.codeCenterValue" id="codeCenterValue" placeholder="Cost Center" />
            </div>
            <div class="search-buttons-filter">
                <Button @click="onSearch" label="Search" icon="pi pi-search" />
                <Button
                    style="min-width: 10rem"
                    v-if="currentCostCenterInventory?.status == 'Finished'"
                    @click="onStartOrViewCostCenter(currentCostCenterInventory.periodId, currentCostCenterInventory.costCenter, currentCostCenterInventory.status, false)"
                    label="View"
                    icon="pi "
                ></Button>
                <Button
                    style="min-width: 10rem"
                    v-if="currentCostCenterInventory?.status == 'None'"
                    @click="onStartOrViewCostCenter(currentCostCenterInventory.periodId, currentCostCenterInventory.costCenter, currentCostCenterInventory.status, true)"
                    label="Start Scan"
                    icon="pi "
                ></Button>
                <Button
                    style="min-width: 10rem"
                    v-if="currentCostCenterInventory?.status == 'Pause' || currentCostCenterInventory?.status == 'Scanning'"
                    @click="onStartOrViewCostCenter(currentCostCenterInventory.periodId, currentCostCenterInventory.costCenter, currentCostCenterInventory.status, false)"
                    label="Continue"
                    icon="pi "
                ></Button>
            </div>
        </div>
        <DataTable
            paginatorTemplate="CurrentPageReport  FirstPageLink PrevPageLink  NextPageLink LastPageLink RowsPerPageDropdown"
            :value="rows"
            :lazy="true"
            :paginator="!isChecking"
            :rows="datacostCenter.pagination.rows"
            :totalRecords="totalRecords"
            :first="datacostCenter.pagination.first"
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
            responsiveLayout="scroll"
            :globalFilterFields="['fixedAssetNumber', 'subAssetNumber']"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            currentPageReportTemplate="Page {currentPage}  of {totalPages} ({totalRecords} Items)"
        >
            <template #empty> No Periods found. </template>
            <template #loading> Loading Periods data. Please wait. </template>

            <Column field="costCenter" header="Cost Center" style="width: 30%">
                <template #body="{ data }">
                    <RadioButton @change="onChange(data)" v-model="currentCostCenterInventoryId" name="currentCostCenterInventory" :value="data.id" />
                    <label :style="rowDetailsStyle(data)" for="ingredient4"> {{ data.costCenter }} </label>
                </template>
            </Column>
            <Column field="costCenterName" header="Cost Center Name" style="width: 35%">
                <template #body="{ data }">
                    {{ data.costCenterName }}
                </template>
            </Column>
            <Column field="complete" header="Complete" style="width: 20%">
                <template #body="{ data }">
                    {{ data.complete }}
                </template>
            </Column>

            <Column field="total" header="Total" style="width: 15%">
                <template #body="{ data }">
                    {{ data.total }}
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Popup Dialog -->

    <ConfirmDialog></ConfirmDialog>
</template>

<style scoped lang="scss">
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
    gap: 2rem;
    align-items: center;
}

.searchbutton {
    margin-right: 2rem;
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
    font-size: large;
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
</style>
