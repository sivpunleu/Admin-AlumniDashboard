<template>
    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
                <tr>
                    <th v-for="column in columns" :key="column.key" class="py-3 px-4 text-muted small text-uppercase">
                        {{ column.label }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in data" :key="item.id">
                    <td v-for="column in columns" :key="column.key" class="py-3 px-4">
                        <slot :name="`cell-${column.key}`" :item="item">
                            {{ item[column.key] }}
                        </slot>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
defineProps({
    columns: Array,
    data: Array
});
</script>