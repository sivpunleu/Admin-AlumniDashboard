<template>
    <div class="base-table-wrap table-responsive">
        <table class="base-table table table-hover align-middle mb-0" :style="{ '--base-table-min-width': minWidth }">
            <thead class="table-light">
                <tr>
                    <th v-for="column in columns" :key="column.key" scope="col" :class="getHeaderClass(column)">
                        {{ column.label }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in data" :key="getRowKey(item)">
                    <td v-for="column in columns" :key="column.key" :class="getCellClass(column)">
                        <slot :name="`cell-${column.key}`" :item="item">
                            {{ item[column.key] }}
                        </slot>
                    </td>
                </tr>
                <tr v-if="!data?.length">
                    <td :colspan="columns.length" class="p-0">
                        <slot name="empty">
                            <div class="app-state">
                                <div>
                                    <div class="app-state__icon">
                                        <i class="bi bi-inbox"></i>
                                    </div>
                                    <p class="mb-0">មិនមានទិន្នន័យទេ</p>
                                </div>
                            </div>
                        </slot>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
const props = defineProps({
    columns: {
        type: Array,
        default: () => [],
    },
    data: {
        type: Array,
        default: () => [],
    },
    rowKey: {
        type: [String, Function],
        default: 'id',
    },
    minWidth: {
        type: String,
        default: '720px',
    },
});

const isActionColumn = (column) => column?.key === 'actions';

const getHeaderClass = (column) => [
    'base-table__header-cell',
    'py-3',
    'px-4',
    'text-muted',
    'small',
    'text-uppercase',
    isActionColumn(column) && 'base-table__cell--actions',
];

const getCellClass = (column) => [
    'base-table__cell',
    'py-3',
    'px-4',
    isActionColumn(column) && 'base-table__cell--actions',
];

const getRowKey = (item) => {
    if (typeof props.rowKey === 'function') {
        return props.rowKey(item);
    }

    return item?.[props.rowKey] ?? JSON.stringify(item);
};
</script>

<style scoped>
.base-table-wrap {
    border-radius: inherit;
}

.base-table {
    min-width: max(100%, var(--base-table-min-width));
}

.base-table__header-cell {
    white-space: nowrap;
}

.base-table__cell {
    vertical-align: middle;
}

.base-table__cell--actions {
    text-align: right;
    white-space: nowrap;
}

:deep(.base-table__cell--actions > *) {
    justify-content: flex-end;
}

@media (max-width: 768px) {
    .base-table__header-cell,
    .base-table__cell {
        padding-left: 1rem !important;
        padding-right: 1rem !important;
    }
}
</style>
