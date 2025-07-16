<script setup>
//#region
import router from '@/router';
import { CommonService } from '@/service/CommonService';
import { CostCenterInventoryService } from '@/service/CostCenterInventoryService';
import { PeriodService } from '@/service/PeriodService';
import { FilterMatchMode } from '@primevue/core/api';
import moment from 'moment';
import { useToast } from 'primevue/usetoast';
import { nextTick, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue';
let intervalId;

const currentCostCenterInventory = ref(null);
const displayPopup = ref(false);
const toast = useToast();
const filters = ref(null);
const rows = ref(null);
const totalRecords = ref(null);
const loading = ref(null);

const isChecking = ref(false);
const datacostCenter = {
    pagination: {
        first: 0,
        rows: 10,
        sortField: null,
        sortOrder: null // 1 = asc, -1 = desc
    }
};

const currentCostCenterInventoryId = ref(0);
const filterValues = ref({
    type: 'Stock Taking',
    period: null,
    codeCenterName: '',
    codeCenterValue: ''
});
const periods = ref([]);
const filterperiods = ref([]);
const expandedRows = ref({});
const isShowColumnExpand = ref(false);
//#endregion

//#region
const openPopup = async () => {
    if (!CommonService.isMobile()) displayPopup.value = true;
};

onMounted(async () => {
    // Add message handler
});
watch(rows, async () => {
    await nextTick();

    if (rows.value) {
        let index = 1;
        var rowhtmls = document.querySelectorAll('.costCenterInventory .p-datatable-table-container .p-datatable-table tr');
        let isAllChildrent = false;
        expandedRows.value = [];
        rows.value.map((x) => {
            expandedRows.value.push(false);
            if (x.childrent && rowhtmls && rowhtmls.length > 0 && rowhtmls[index]) {
                var columnButtonExpand = rowhtmls[index].querySelector('td button');
                if (x.childrent && x.childrent.length == 0 && columnButtonExpand) {
                    columnButtonExpand.style = 'display:none';
                }
                if (x.childrent.length > 0) isAllChildrent = true;
            }

            index++;
        });
        isShowColumnExpand.value = isAllChildrent;
    }
});

onBeforeMount(async () => {
    initFilters();

    const params = {
        pageNumber: 1,
        pageSize: 1000
    };
    PeriodService.getperiods(params)
        .then(async (response) => {
            if (!CommonService.isMobile()) {
                periods.value = response.data.items;
                filterperiods.value = response.data.items.map((x) => {
                    x.name = `${x.name}(${x.type})`;
                    return x;
                });
                filterperiods.value.unshift({ name: 'All' });
                filterValues.value.period = filterperiods.value[0];
            } else {
                var periodInventories = response.data.items.filter((x) => x.status == 'Openning');
                if (periodInventories && periodInventories.length > 0) {
                    filterValues.value.period = periodInventories[0];
                }
            }
            await fetchData();
        })
        .catch((error) => {});
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

//#endregion

//#region

const onLazyEvent = async (event) => {
    // event contains: first, rows, sortField, sortOrder, filters
    datacostCenter.pagination = { ...event };

    fetchData();
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
        isIncludeChildrent: true
    };
    loading.value = true;
    const { data } = await CostCenterInventoryService.getCostCenterInventoriesWithFilter(params);
    loading.value = false;
    rows.value = data.items;
    if (data.items.length > 0) {
        currentCostCenterInventory.value = data.items[0];
        currentCostCenterInventoryId.value = data.items[0].id;
    }
    var no = datacostCenter.pagination.first;
    rows.value = rows.value.map((x) => {
        no = no + 1;
        x.no = no;
        return x;
    });
    totalRecords.value = data.totalRecords;
};

const onSearch = async () => {
    await fetchData();
};

const onExportExcel = async () => {
    //fileupload.value .click()
    const params = {
        pageNumber: 1,
        pageSize: 10000000,
        sortField: datacostCenter.pagination.sortField,
        sortOrder: datacostCenter.pagination.sortOrder,
        type: filterValues.value.type,
        periodId: filterValues.value.period ? filterValues.value.period.id : null,
        codeCenterName: filterValues.value.codeCenterName,
        codeCenterValue: filterValues.value.codeCenterValue,
        isIncludeFirstItem: false,
        isIncludeChildrent: true,
        isGroupChildrent: false
    };
    CostCenterInventoryService.exportexcelCostCenterInventories('CostCenterInventories.xlsx', params)
        .then((reponse) => {})
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
        });
};

const rowDetailsStyle = (rowData) => {
    if (rowData.status == 'Finished') {
        return { color: '#10B981', cursor: 'pointer', 'font-weight': '900' };
    } else if (rowData.status != 'None') {
        return { color: '#ea9e99', cursor: 'pointer', 'font-weight': '900' };
    }
    return { cursor: 'pointer', 'font-weight': '900' };
};
const columnStyle = (rowData) => {
    if (rowData.total == rowData.complete) {
        return { color: '#10B981', cursor: 'pointer' };
    } else {
        return { color: 'red', cursor: 'pointer' };
    }
    return '';
};
const onStatusClick = (data) => {
    router.push(`/inventories/costcenters/${data.periodId}/${data.costCenter}`);
};
const onStatusClickHistory = (data) => {
    router.push(`/inventories/costcenters/${data.id}`);
};

//#endregion
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Cost Center Inventoy Managerment</div>
        <div class="advanced-search-panel-filter">
            <div class="search-field-filter">
                <label for="codeCenterName">Periods</label>
                <Select @change="onChangePeriod" :options="filterperiods" v-model="filterValues.period" optionLabel="name" placeholder="Select a Period" />
            </div>
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
                <Button id="export" type="button" label="Export Excel" icon="pi pi-file-excel" @click="onExportExcel()" />
            </div>
        </div>
        <DataTable
            paginatorTemplate="CurrentPageReport  FirstPageLink PrevPageLink  NextPageLink LastPageLink RowsPerPageDropdown"
            :inin
            v-model:expandedRows="expandedRows"
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
            class="costCenterInventory"
            responsiveLayout="scroll"
            :globalFilterFields="['fixedAssetNumber', 'subAssetNumber']"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            :rowStyle="rowStyle"
            currentPageReportTemplate="Page {currentPage}  of {totalPages} ({totalRecords} Items)"
        >
            <template #empty> No Periods found. </template>
            <template #loading> Loading Periods data. Please wait. </template>
            <Column expander :style="isShowColumnExpand ? 'width: 5rem' : 'width: 5rem;display:none'" />
            <Column field="no" header="No">
                <template #body="{ data }">
                    <span>{{ data.no }}</span>
                </template>
            </Column>
            <Column field="costCenter" header="Cost Center">
                <template #body="{ data }">
                    <span @click="onStatusClick(data)" :style="rowDetailsStyle(data)">{{ data.costCenter }}</span>
                </template>
            </Column>

            <Column field="costCenterName" header="Cost Center Name">
                <template #body="{ data }">
                    {{ data.costCenterName }}
                </template>
            </Column>
            <Column field="periodName" header="Period">
                <template #body="{ data }"> {{ data.periodName }}( {{ data.periodType }}) </template>
            </Column>

            <Column field="status" header="Status" style="width: 5%">
                <template #body="{ data }">
                    <span>{{ data.status }}</span>
                </template>
            </Column>

            <Column field="Period" header="Request To Open Status">
                <template #body="{ data }">
                    {{ data.requestToOpenStatus }}
                </template>
            </Column>
            <Column field="total" header="Total">
                <template #body="{ data }">
                    {{ data.total }}
                </template>
            </Column>
            <Column field="assetStatusComplete" header="Complete">
                <template #body="{ data }">
                    {{ data.assetStatusComplete }}
                </template>
            </Column>
            <Column field="assetStatusMissing" header="Remain">
                <template #body="{ data }">
                    {{ data.assetStatusMissing }}
                </template>
            </Column>

            <Column field="modifiedAt" header="Updated On">
                <template #body="{ data }"> {{ data.modifiedAt ? moment(data.modifiedAt).format('YYYY-MM-DD  HH:mm:ss ') : '' }} </template>
            </Column>
            <template #expansion="{ data }">
                <div v-if="data.childrent && data.childrent.length > 0" class="p-4">
                    <h5>History</h5>
                    <DataTable :value="data.childrent">
                        <Column field="status" header="Status">
                            <template #body="slotPros">
                                <span @click="onStatusClickHistory(slotPros.data)" :style="columnStyle(slotPros.data)">{{ slotPros.data.total - slotPros.data.complete == 0 ? 'Enough' : 'Missing' }}</span>
                            </template>
                        </Column>
                        <Column field="total" header="Total"></Column>
                        <Column field="assetStatusComplete" header="Complete"></Column>
                        <Column field="assetStatusMissing" header="Remain"></Column>
                        <Column field="modifiedAt" header="Updated On">
                            <template #body="slotData"> {{ slotData.data.modifiedAt ? moment(slotData.data.modifiedAt).format('YYYY-MM-DD  HH:mm:ss ') : '' }} </template>
                        </Column>
                    </DataTable>
                </div>
            </template>
        </DataTable>
    </div>

    <!-- Popup Dialog -->

    <ConfirmDialog></ConfirmDialog>
</template>

<style scoped lang="scss">
:deep(.p-radiobutton-checked .p-radiobutton-box) {
    border-color: #4b25ad;
    background: #4b25ad;
}

:deep(.p-radiobutton-checked:not(.p-disabled):has(.p-radiobutton-input:hover) .p-radiobutton-box) {
    border-color: #4b25ad;
    background: #4b25ad;
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
