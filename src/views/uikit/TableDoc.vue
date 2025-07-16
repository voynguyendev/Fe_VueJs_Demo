<script setup>
import { CustomerService } from '@/service/CustomerService';
import { ProductService } from '@/service/ProductService';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onBeforeMount, onMounted,reactive, ref } from 'vue';
import { AssetService } from '@/service/AssetService';


const expandedRows = ref([]);

const filters=ref(null)
const rows=ref(null)
const totalRecords=ref(null)
const loading=ref(null)
 
const searchFixedAssetNumber=ref('')
const searchSubAssetNumber=ref('')
const searchStatusRemark=ref('')
const searchAssetDescription=ref('')
const searchAssetClassDescription=ref('')
const searchAdditionalAssetDescription=ref('')
const searchSerialNumber=ref('')
const searchWBS=ref('')
const searchResponsibleCostCenter=ref('')
const searchDeactivationDateFrom=ref(null)
const searchDeactivationDateTo=ref(null)

      
 const dataAsset = {
       pagination: {
        first: 0,
        rows: 10,
        sortField: null,
        sortOrder: null,    // 1 = asc, -1 = desc
          
      }     
       
 };

 onMounted(async ()=>{
    await  fetchData();
  })

onBeforeMount( () => {
    initFilters();
    
});

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        fixedAssetNumber: {matchMode: FilterMatchMode.CONTAINS },
        subAssetNumber: {matchMode: FilterMatchMode.CONTAINS }
       
    };
}

function expandAll() {
    expandedRows.value = products.value.reduce((acc, p) => (acc[p.id] = true) && acc, {});
}

function collapseAll() {
    expandedRows.value = null;
}
const onSearch= async() => {
 //dataAsset.searchFixedAssetNumber.value='test'
 await fetchData();
  
}


const onLazyEvent=async (event)=> {
      // event contains: first, rows, sortField, sortOrder, filters
      dataAsset.pagination = { ...event };
       fetchData();
    }
 const  fetchData = async ()=> {
      // flatten filters for query string
      const params = {
        pageNumber: dataAsset.pagination.first/ dataAsset.pagination.rows +1,
        pageSize: dataAsset.pagination.rows,
        sortField: dataAsset.pagination.sortField,
        sortOrder: dataAsset.pagination.sortOrder,
        
        searchFixedAssetNumber:searchFixedAssetNumber.value,
        searchSubAssetNumber:searchSubAssetNumber.value,
        searchStatusRemark:searchStatusRemark.value,
        searchAssetDescription:searchAssetDescription.value,
        searchAssetClassDescription:searchAssetClassDescription.value,
        searchAdditionalAssetDescription:searchAdditionalAssetDescription.value,
        searchSerialNumber:searchSerialNumber.value,
        searchWBS:searchWBS.value,
        searchResponsibleCostCenter:searchResponsibleCostCenter.value,
        searchDeactivationDateFrom:searchDeactivationDateFrom.value,
        searchDeactivationDateTo:searchDeactivationDateTo.value
        
      };
      loading.value=true
      const { data } = await AssetService.getAssets( params );
      loading.value=false
      rows.value = data.items;
      totalRecords.value= data.totalPage;
    }
const clearFilter =async () => {
    initFilters();
    await fetchData()
};
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Assets</div>


    <!-- Advanced Search Panel -->
    <div class="advanced-search-panel">
      
      <div class="search-field">
        <label for="StatusRemark">StatusRemark</label>
        <InputText  v-model="searchStatusRemark" id="StatusRemark"  placeholder="StatusRemark" />
      </div>
     
      <div class="search-field">
        <label for="FixedAssetNumber">FixedAssetNumber</label>
        <InputText  v-model="searchFixedAssetNumber" id="FixedAssetNumber"  placeholder="FixedAssetNumber" />
      </div>
       <div class="search-field">
        <label for="SubAssetNumber">SubAssetNumber</label>
        <InputText v-model="searchSubAssetNumber" id="SubAssetNumber"  placeholder="SubAssetNumber" />
      </div>
      <div class="search-field">
        <label for="AssetDescription">AssetDescription</label>
        <InputText  v-model="searchAssetDescription" id="AssetDescription"  placeholder="AssetDescription" />
      </div>
       <div class="search-field">
        <label for="AssetClassDescription">AssetClassDescription</label>
        <InputText v-model="searchAssetClassDescription"  id="AssetClassDescription"  placeholder="AssetClassDescription" />
      </div>
      <div class="search-field">
        <label for="AdditionalAssetDescription">AdditionalAssetDescription</label>
        <InputText v-model="searchAdditionalAssetDescription" id="AdditionalAssetDescription"  placeholder="AdditionalAssetDescription" />
      </div> 
      <div class="search-field">
        <label for="AssetClass">AssetClass</label>
        <InputText v-model="searchAssetClass" id="AssetClass"  placeholder="AssetClass" />
      </div>
      <div class="search-field">
        <label for="SerialNumber">SerialNumber</label>
        <InputText v-model="searchSerialNumber"  id="SerialNumber"  placeholder="SerialNumber" />
      </div> <div class="search-field">
        <label for="WBS">WBS</label>
        <InputText v-model="searchWBS" id="WBS"  placeholder="WBS" />
      </div>
  
      <div class="search-field">
        <label for="ResponsibleCostCenter">ResponsibleCostCenter</label>
        <InputText v-model="searchResponsibleCostCenter" id="ResponsibleCostCenter"  placeholder="ResponsibleCostCenter" />
      </div>
   
    
      <div class="search-field">
        <label for="DeactivationDateFrom">DeactivationDate From</label>
       
        <DatePicker v-model="searchDeactivationDateFrom"  placeholder="Format:dd/mm/yy" dateFormat="dd/mm/yy" />
      </div> 
      <div class="search-field">
        <label for="DeactivationDateTo">DeactivationDate To</label>
       
        <DatePicker v-model="searchDeactivationDateTo" placeholder="Format:dd/mm/yy" dateFormat="dd/mm/yy" />
      </div> 
      <div class="search-buttons">
         <Button  @click="onSearch" label="Search" icon="pi pi-search"  />
          <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" />
      </div>
     
    </div>

        <DataTable
            :value="rows"
            :lazy="true"
            :paginator="true"
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
            :globalFilterFields="['fixedAssetNumber','subAssetNumber']"
        >
           
            <template #empty> No customers found. </template>
            <template #loading> Loading customers data. Please wait. </template>
             <Column field="id" header="ID" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.id }}
                </template>
                
            </Column>
            <Column field="statusRemark" header="StatusRemark" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.StatusRemark }}
                </template>
              
            </Column>
            <Column field="fixedAssetNumber" header="FixedAssetNumber" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.fixedAssetNumber }}
                </template>
              
            </Column>
            <Column field="subAssetNumber" header="SubAssetNumber" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.subAssetNumber }}
                </template>
              
            </Column>
            <Column field="assetDescription" header="AssetDescription" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.assetDescription }}
                </template>
              
            </Column>
            <Column field="assetClassDescription" header="AssetClassDescription" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.AssetClassDescription }}
                </template>
              
            </Column>

             <Column field="additionalAssetDescription" header="AdditionalAssetDescription" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.additionalAssetDescription }}
                </template>
              
            </Column>

             <Column field="assetClass" header="AssetClass" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.assetClass }}
                </template>
              
            </Column>

             <Column field="serialNumber" header="SerialNumber" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.serialNumber }}
                </template>
              
            </Column>

             <Column field="wbs" header="WBS" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.wbs }}
                </template>
              
            </Column>

             <Column field="responsibleCostCenter" header="ResponsibleCostCenter" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.responsibleCostCenter }}
                </template>
              
            </Column>
             <Column field="deactivationDate " header="DeactivationDate " style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.deactivationDate  }}
                </template>
              
            </Column>
        </DataTable>
    </div>

  

 
</template>

<style scoped lang="scss">
:deep(.p-datatable-frozen-tbody) {
    font-weight: bold;
}

:deep(.p-datatable-scrollable .p-frozen-column) {
    font-weight: bold;
}
:deep(.p-datatable-filter-rule  .p-select) {
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
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

</style>
