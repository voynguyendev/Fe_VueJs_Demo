<script setup>
import router from '@/router';
import { CostCenterInventoryService } from '@/service/CostCenterInventoryService';
import { PeriodService } from '@/service/PeriodService';
import moment from 'moment';
import { onMounted, ref } from 'vue';
const filterValues = ref({
    type: 'Stock Taking',
    period: null
});
const periods = ref([]);
const costCenters = ref([]);

const rowHistoriesByPeriodId = ref([]);
const rowHistoriesByCostCenter = ref([]);
const costCenter = ref({});
onMounted(async () => {
    const params = {
        pageNumber: 1,
        pageSize: 10000
    };
    var responsePeriods = await PeriodService.getperiods(params);

    var periodInventories = responsePeriods.data.items.map((x) => {
        x.name = `${x.name}(${x.type})`;
        return x;
    });
    if (periodInventories && periodInventories.length > 0) {
        filterValues.value.period = periodInventories[0];
    }
    periods.value = periodInventories;
    getHistoryByPeriodId();

    var responseCostCenters = await CostCenterInventoryService.getAllCostCenterForHistoryInventory();

    costCenters.value = responseCostCenters.data.map((x) => {
        x.name = `${x.code}-${x.name}`;
        return x;
    });
    costCenter.value = costCenters.value[0];

    getHistoryByCostCenter();
});

const getHistoryByPeriodId = async () => {
    const paramsHistory = {
        pageNumber: 1,
        pageSize: 10000,
        periodId: filterValues.value.period ? filterValues.value.period.id : null,
        inventoryStatus: 'Finished'
    };
    CostCenterInventoryService.getCostCenterInventoriesWithFilter(paramsHistory).then((response) => {
        rowHistoriesByPeriodId.value = response.data.items.map((x) => {
            x.childrent = x.childrent.map((y) => {
                y.modifiedAtstr = moment(y.modifiedAt).format('YYYY-MM-DD');
                return y;
            });
            return x;
        });
    });
};
const getHistoryByCostCenter = async () => {
    const paramsHistory = {
        pageNumber: 1,
        pageSize: 10000,
        costCenterValue: costCenter.value ? costCenter.value.code : null,
        inventoryStatus: 'Finished'
    };
    CostCenterInventoryService.getCostCenterInventoriesWithFilter(paramsHistory).then((response) => {
        rowHistoriesByCostCenter.value = response.data.items.map((x) => {
            x.childrent = x.childrent.map((y) => {
                y.modifiedAtstr = moment(y.modifiedAt).format('YYYY-MM-DD');
                return y;
            });
            return x;
        });
    });
};
const onChangePeriod = () => {
    getHistoryByPeriodId();
};
const onChangeCostCenter = () => {
    getHistoryByCostCenter();
};

const onRowClick = (event) => {
    router.push(`/inventories/costcenters/${event.data.periodId}/${event.data.costCenter}`);
};
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">History</div>

        <Tabs value="0">
            <TabList>
                <Tab value="0">Cost Center</Tab>
                <Tab value="1">Period</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <div class="advanced-search-panel">
                        <div class="search-field">
                            <Select @change="onChangeCostCenter" :options="costCenters" v-model="costCenter" optionLabel="name" placeholder="Select a Cost Center" />
                        </div>
                    </div>

                    <DataTable @row-click="onRowClick" :value="rowHistoriesByCostCenter" :paginator="false" dataKey="id" :rowHover="true" filterDisplay="menu" :loading="loadingDetail" :rowsPerPageOptions="[5, 10, 20, 50]" :rowStyle="rowDetailsStyle">
                        <template #empty> No Cost Center Inventories found. </template>
                        <template #loading> Loading Cost Center Inventories data. Please wait. </template>

                        <Column :headerStyle="{ display: 'none' }" style="padding-left: 0px; padding-right: 0px; border-width: 0.2rem">
                            <template #body="{ data }">
                                <DataTable
                                    paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                                    currentPageReportTemplate="{currentPage}/{totalRecords}"
                                    @row-click="onRowClick"
                                    :value="data.childrent"
                                    :paginator="true"
                                    dataKey="id"
                                    :rows="1"
                                    :rowHover="true"
                                    filterDisplay="menu"
                                    :loading="loadingDetail"
                                    :rowStyle="rowDetailsStyle"
                                >
                                    <template #empty> No Cost Center Inventories found. </template>
                                    <template #loading> Loading Cost Center Inventories data. Please wait. </template>

                                    <Column :headerStyle="{ display: 'none' }" style="width: 70%; padding-left: 2px; padding-right: 2px; padding-bottom: 0rem">
                                        <template #body="{ data }">
                                            <span class="assetName"> Period : {{ data.periodName }} ({{ data.periodType }})</span>

                                            <br />
                                            <br />
                                            <span style="margin-right: 2rem" class="assetCode"> Total: {{ data.total }}</span>
                                            <span v-if="data.total == data.complete" class="assetCode"> Complete: {{ data.complete }}</span>
                                            <span v-if="data.total != data.complete" class="assetCode-missing"> Missing: {{ data.total - data.complete }}</span>
                                        </template>
                                    </Column>
                                    <Column :headerStyle="{ display: 'none' }" style="width: 30%; padding-left: 2px; padding-right: 2px">
                                        <template #body="{ data }">
                                            <div v-if="data.total == data.complete" class="divEnough">Enough</div>
                                            <div v-if="data.total != data.complete" class="divMissing">Missing</div>
                                            <br />
                                            <span class="assetCode"> {{ data.modifiedAtstr }} </span>
                                        </template>
                                    </Column>
                                </DataTable>
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
                <TabPanel value="1">
                    <div class="advanced-search-panel">
                        <div class="search-field">
                            <Select @change="onChangePeriod" :options="periods" v-model="filterValues.period" optionLabel="name" placeholder="Select a Period" />
                        </div>
                    </div>

                    <DataTable @row-click="onRowClick" :value="rowHistoriesByPeriodId" :paginator="false" dataKey="id" :rowHover="true" filterDisplay="menu" :loading="loadingDetail" :rowsPerPageOptions="[5, 10, 20, 50]" :rowStyle="rowDetailsStyle">
                        <template #empty> No Cost Center Inventories found. </template>
                        <template #loading> Loading Cost Center Inventories data. Please wait. </template>

                        <Column :headerStyle="{ display: 'none' }" style="padding-left: 0px; padding-right: 0px; border-width: 0.1rem">
                            <template #body="{ data }">
                                <DataTable
                                    paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                                    currentPageReportTemplate="{currentPage}/{totalRecords}"
                                    @row-click="onRowClick"
                                    :value="data.childrent"
                                    :paginator="true"
                                    dataKey="id"
                                    :rows="1"
                                    :rowHover="true"
                                    filterDisplay="menu"
                                    :loading="loadingDetail"
                                    :rowStyle="rowDetailsStyle"
                                >
                                    <template #empty> No Cost Center Inventories found. </template>
                                    <template #loading> Loading Cost Center Inventories data. Please wait. </template>

                                    <Column :headerStyle="{ display: 'none' }" style="width: 70%; padding-left: 2px; padding-right: 2px; padding-bottom: 0rem">
                                        <template #body="{ data }">
                                            <span class="assetName"> {{ data.costCenter }}-{{ data.costCenterName }}</span>
                                            <br />
                                            <br />
                                            <span style="margin-right: 2rem" class="assetCode"> Total: {{ data.total }}</span>
                                            <span v-if="data.total == data.complete" class="assetCode"> Complete: {{ data.complete }}</span>
                                            <span v-if="data.total != data.complete" class="assetCode-missing"> Missing: {{ data.total - data.complete }}</span>
                                        </template>
                                    </Column>
                                    <Column :headerStyle="{ display: 'none' }" style="width: 30%; padding-left: 2px; padding-right: 2px">
                                        <template #body="{ data }">
                                            <div v-if="data.total == data.complete" class="divEnough">Enough</div>
                                            <div v-if="data.total != data.complete" class="divMissing">Missing</div>
                                            <br />
                                            <span class="assetCode"> {{ data.modifiedAtstr }} </span>
                                        </template>
                                    </Column>
                                </DataTable>
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
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
    font-size: 1.4rem;
    font-weight: 900;
}

.assetCode {
    font-size: 1.3rem;
}
.assetCode-missing {
    font-size: 1.3rem;
    color: #cf2a27;
}
.divEnough {
    height: 2.9rem;
    background: var(--primary-color);
    border-color: black;
    border-width: 0.1rem;
    border-style: solid;
    text-align: center;
    padding-top: 0.5rem;
    font-size: 1.3rem;
    font-weight: 900;
    color: white;
    border-radius: 2rem;
}
.divMissing {
    height: 2.9rem;
    background: #cf2a27;
    border-color: black;
    border-width: 0.1rem;
    border-style: solid;
    text-align: center;
    padding-top: 0.5rem;
    font-size: 1.3rem;
    font-weight: 900;
    color: white;
    border-radius: 2rem;
}
</style>
