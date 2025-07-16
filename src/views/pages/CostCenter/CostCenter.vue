<script setup>
//#region
import { CostCenterInventoryService } from '@/service/CostCenterInventoryService';
import { nextTick, onBeforeMount, onMounted, ref } from 'vue';
const rows = ref(null);
const totalRecords = ref(null);
const loading = ref(null);
const searchCode = ref('');
const searchName = ref('');
const searchCostCenterCategory = ref('');
const searchDept = ref('');

const dataCostCenter = {
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
    searchCode.value = null;
    searchName.value = null;
    searchCostCenterCategory.value = null;
    searchDept.value = null;
}

const onSearch = async () => {
    dataCostCenter.pagination.first = 0;
    dataCostCenter.pagination.rows = 10;

    //dataAsset.searchFixedAssetNumber.value='test'
    await fetchData();
};

const onLazyEvent = async (event) => {
    // event contains: first, rows, sortField, sortOrder, filters
    dataCostCenter.pagination = { ...event };
    fetchData();
};

const fetchData = async () => {
    // flatten filters for query string
    const params = {
        pageNumber: dataCostCenter.pagination.first / dataCostCenter.pagination.rows + 1,
        pageSize: dataCostCenter.pagination.rows,
        searchCode: searchCode.value,
        searchName: searchName.value,
        searchCostCenterCategory: searchCostCenterCategory.value,
        searchDept: searchDept.value
    };
    loading.value = true;
    const { data } = await CostCenterInventoryService.getCostCenters(params);
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
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('QR Table');

    worksheet.columns = [
        { header: 'QRCode', key: 'qr', width: 20 },
        { header: 'BarCode', key: 'barcode', width: 40 },
        { header: 'Code Center', key: 'code', width: 20 },
        { header: 'Code Center Name', key: 'name', width: 20 },
        { header: 'Code Center Category', key: 'costCenterCategory', width: 20 },
        { header: 'Dept', key: 'dept', width: 20 }
    ];

    // add a header row so ExcelJS doesn’t auto-insert an empty one
    //worksheet.addRow();

    for (let i = 0; i < rows.value.length; i++) {
        const rowNum = i + 1; // Excel rows are 1-based; row 1 = headers
        const { code, name, dept, costCenterCategory } = rows.value[i];

        // add textual cells
        const row = worksheet.addRow({
            qrCode: '',
            barcode: '', // Placeholder for image
            code: code,
            name: name,
            costCenterCategory: costCenterCategory,
            dept: dept
        });

        // get the qrcode-vue component instance, then its <canvas>
        const comp = qrComponents[i];
        const compbarcode = barcodeComponents[i];
        //firstElementChild

        if (comp && comp.$el) {
            const canvas = comp.$el.nextSibling;
            if (canvas) {
                // convert canvas to Blob PNG
                const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
                const buffer = await blob.arrayBuffer();
                const imageId = workbook.addImage({ buffer, extension: 'png' });

                // stamp it into the 3rd column (zero-based col=2)
                worksheet.addImage(imageId, {
                    tl: { col: 0, row: rowNum },
                    ext: { width: qrSize * 0.75, height: qrSize * 0.75 }
                });
            }
        }

        if (compbarcode && compbarcode.$el) {
            const canvasBarcode = compbarcode.$el.firstElementChild;
            if (canvasBarcode) {
                // convert canvas to Blob PNG
                const blob = await new Promise((resolve) => canvasBarcode.toBlob((b) => resolve(b), 'image/png'));
                const buffer = await blob.arrayBuffer();
                const imageId = workbook.addImage({ buffer, extension: 'png' });

                // stamp it into the 3rd column (zero-based col=2)
                worksheet.addImage(imageId, {
                    tl: { col: 1, row: rowNum },
                    ext: { width: 150, height: 80 }
                });
            }
        }

        row.height = 60;
    }

    // write and download
    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf]), 'costcenters.xlsx');
};
//#endregion

//#region

//#endregion
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Cost Centers Managerment</div>

        <!-- Advanced Search Panel -->
        <div class="advanced-search-panel">
            <div class="search-field">
                <label for="searchCode">Cost Center</label>
                <InputText v-model="searchCode" id="searchCode" placeholder="Cost Center<" />
            </div>

            <div class="search-field">
                <label for="searchName">Cost Center Name</label>
                <InputText v-model="searchName" id="searchName" placeholder="Cost Center Name" />
            </div>
            <div class="search-field">
                <label for="searchCostCenterCategory">Cost Center Category</label>
                <InputText v-model="searchCostCenterCategory" id="searchCostCenterCategory" placeholder="Cost Center Category" />
            </div>
            <div class="search-field">
                <label for="searchDept">Dept</label>
                <InputText v-model="searchDept" id="searchDept" placeholder="Dept" />
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
            :rows="dataCostCenter.pagination.rows"
            :totalRecords="totalRecords"
            :first="dataCostCenter.pagination.first"
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
            <template #empty> No Cost Center found. </template>
            <template #loading> Loading Cost Centers data. Please wait. </template>
            <Column field="QRcode" header="QRcode">
                <template #body="slot">
                    <Image alt="Image" preview>
                        <template #previewicon>
                            <i class="pi pi-search"></i>
                        </template>
                        <template #image>
                            <qrcode-vue :key="slot.data.code" :ref="(el) => (qrComponents[slot.index] = el)" :value="slot.data.code" :size="100" />
                        </template>
                        <template #preview="slotProps">
                            <qrcode-vue :key="slot.data.code" :value="slot.data.code" :size="200" />
                        </template>
                    </Image>
                </template>
            </Column>

            <Column field="Barcode" header="Barcode">
                <template #body="slot">
                    <Image :ref="(el) => (barcodeComponents[slot.index] = el)" alt="Image" preview>
                        <template #previewicon>
                            <i class="pi pi-search"></i>
                        </template>
                        <template #image>
                            <BarcodeGenerator :key="slot.data.code" :value="slot.data.code" :format="'CODE128'" :lineColor="'#000'" :width="2" :height="40" :elementTag="'canvas'" />
                        </template>
                        <template #preview="slotProps">
                            <BarcodeGenerator :key="slot.data.code" :value="slot.data.code" :format="'CODE128'" :lineColor="'#000'" :width="2" :height="40" :elementTag="'canvas'" />
                        </template>
                    </Image>
                </template>
            </Column>

            <Column field="Code" header="Code Center">
                <template #body="{ data }">
                    {{ data.code }}
                </template>
            </Column>
            <Column field="Name" header="Code Center Name">
                <template #body="{ data }">
                    {{ data.name }}
                </template>
            </Column>
            <Column field="CostCenterCategory" header="Cost Center Category">
                <template #body="{ data }">
                    {{ data.costCenterCategory }}
                </template>
            </Column>

            <Column field="Dept" header="Dept">
                <template #body="{ data }">
                    {{ data.dept }}
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
