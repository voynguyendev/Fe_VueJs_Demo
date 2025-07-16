<script setup>
//#region
import { AssetClassService } from '@/service/AssetClassService';
import { nextTick, onBeforeMount, onMounted, ref } from 'vue';
const rows = ref(null);
const totalRecords = ref(null);
const loading = ref(null);
const searchAssetGroup = ref('');
const searchAssetClass = ref('');
const searchAssetClassDescription = ref('');
const searchIsActive = ref(true);

const dataAssetClass = {
    pagination: {
        first: 0,
        rows: 10,
        sortField: null,
        sortOrder: null // 1 = asc, -1 = desc
    }
};

// hold component refs so we can later grab their canvases
const qrComponents = [];
const barcodeComponents = [];
//#endregion

//#region event vue
onMounted(async () => {
    await fetchData();
    await nextTick();
});

onBeforeMount(async () => {
    initFilters();
});
//#endregion

//#region device rfid

//#endregion

//#region
function initFilters() {
    searchAssetGroup.value = null;
    searchAssetClass.value = null;
    searchAssetClassDescription.value = null;
    searchIsActive.value = true;
}

const onSearch = async () => {
    dataAssetClass.pagination.first = 0;
    dataAssetClass.pagination.rows = 10;

    await fetchData();
};

const onLazyEvent = async (event) => {
    // event contains: first, rows, sortField, sortOrder, filters
    dataAssetClass.pagination = { ...event };
    fetchData();
};

const fetchData = async () => {
    // flatten filters for query string
    const params = {
        pageNumber: dataAssetClass.pagination.first / dataAssetClass.pagination.rows + 1,
        pageSize: dataAssetClass.pagination.rows,
        searchAssetGroup: searchAssetGroup.value,
        searchAssetClass: searchAssetClass.value,
        searchAssetClassDescription: searchAssetClassDescription.value,
        searchIsActive: searchIsActive.value
    };
    loading.value = true;
    const { data } = await AssetClassService.getAssetClasses(params);
    loading.value = false;
    rows.value = data.items;

    totalRecords.value = data.totalRecords;
};

const clearFilter = async () => {
    initFilters();
    await fetchData();
};
// QR options
const qrSize = 100;

const exportExcel = async () => {
    const params = {
        pageNumber: 1,
        pageSize: 1000000,
        searchAssetGroup: searchAssetGroup.value,
        searchAssetClass: searchAssetClass.value,
        searchAssetClassDescription: searchAssetClassDescription.value,
        searchIsActive: searchIsActive.value
    };
    const { data } = await AssetClassService.getAssetClasses(params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('AssetClasses');

    worksheet.columns = [
        { header: 'Asset Group', key: 'assetGroup', width: 20 },
        { header: 'Asset Class', key: 'assetClass', width: 20 },
        { header: 'Asset Class Description', key: 'assetClassDescription', width: 20 },
        { header: 'IsActive', key: 'isActive', width: 20 }
    ];

    // add a header row so ExcelJS doesn’t auto-insert an empty one
    //worksheet.addRow();

    for (let i = 0; i < data.items.length; i++) {
        const rowNum = i + 1; // Excel rows are 1-based; row 1 = headers
        const { assetGroup, assetClass, assetClassDescription, isActive } = data.items[i];

        // add textual cells
        const row = worksheet.addRow({
            assetGroup: assetGroup,
            assetClass: assetClass,
            assetClassDescription: assetClassDescription,
            isActive: isActive ? 'True' : 'False'
        });
    }

    // write and download
    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf]), 'assetclasses.xlsx');
};
//#endregion

//#region

//#endregion
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Asset Classes Managerment</div>

        <!-- Advanced Search Panel -->
        <div class="advanced-search-panel">
            <div class="search-field">
                <label for="searchCode">Asset Group</label>
                <InputText v-model="searchAssetGroup" id="AssetGroup" placeholder="Asset Group" />
            </div>

            <div class="search-field">
                <label for="SearchAssetClass">Asset Class</label>
                <InputText v-model="searchAssetClass" id="SearchAssetClass" placeholder="Asset Class" />
            </div>
            <div class="search-field">
                <label for="searchCostCenterCategory">Asset Class Description</label>
                <InputText v-model="searchAssetClassDescription" id="SearchAssetClassDescription" placeholder="Asset Class Description" />
            </div>
            <div class="search-field">
                <label class="search-field-label-checkbox" for="IsActive">IsActive</label>
                <Checkbox id="IsActive" v-model="searchIsActive" binary />
            </div>

            <div class="search-buttons">
                <Button @click="onSearch" label="Search" icon="pi pi-search" />
                <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" />
                <Button id="export" type="button" label="Export Excel" icon="pi pi-file-excel" @click="exportExcel()" />
            </div>
        </div>

        <DataTable
            paginatorTemplate="CurrentPageReport  FirstPageLink PrevPageLink  NextPageLink LastPageLink RowsPerPageDropdown"
            :value="rows"
            :lazy="true"
            :paginator="true"
            :rows="dataAssetClass.pagination.rows"
            :totalRecords="totalRecords"
            :first="dataAssetClass.pagination.first"
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
            :rowsPerPageOptions="[5, 10, 20, 50]"
            currentPageReportTemplate="Page {currentPage}  of {totalPages} ({totalRecords} Items)"
        >
            <template #empty> No Asset Class found. </template>
            <template #loading> Loading Asset Classes data. Please wait. </template>

            <Column field="AssetGroup" header="Asset Group">
                <template #body="{ data }">
                    {{ data.assetGroup }}
                </template>
            </Column>
            <Column field="AssetClass" header="Asset Class">
                <template #body="{ data }">
                    {{ data.assetClass }}
                </template>
            </Column>
            <Column field="AssetClassDescription" header="Asset Class Description">
                <template #body="{ data }">
                    {{ data.assetClassDescription }}
                </template>
            </Column>

            <Column field="IsActive" header="IsActive">
                <template #body="{ data }">
                    <Checkbox :disabled="true" v-model="data.isActive" binary />
                </template>
            </Column>
        </DataTable>
    </div>
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
.search-field-label-checkbox {
    margin-bottom: 1rem !important;
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
