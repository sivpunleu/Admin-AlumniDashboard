<template>
    <nav aria-label="Article pagination" class="pagination-wrap d-flex justify-content-center mt-2">
        <ul class="pagination mb-0">
            <li class="page-item" :class="{ disabled: currentPage <= 1 }">
                <button class="page-link" type="button" @click="goToPrevious" :disabled="currentPage <= 1">
                    Previous
                </button>
            </li>

            <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === currentPage }">
                <button class="page-link" type="button" @click="goToPage(page)">
                    {{ page }}
                </button>
            </li>

            <li class="page-item" :class="{ disabled: currentPage >= totalPages }">
                <button class="page-link" type="button" @click="goToNext" :disabled="currentPage >= totalPages">
                    Next
                </button>
            </li>
        </ul>
    </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    currentPage: {
        type: Number,
        required: true,
    },
    totalPages: {
        type: Number,
        required: true,
    },
    maxVisiblePages: {
        type: Number,
        default: 5,
    },
})

const emit = defineEmits(['change-page'])

const visiblePages = computed(() => {
    const total = Math.max(1, props.totalPages)
    const max = Math.max(3, props.maxVisiblePages)
    const half = Math.floor(max / 2)

    let start = Math.max(1, props.currentPage - half)
    let end = Math.min(total, start + max - 1)

    if (end - start + 1 < max) {
        start = Math.max(1, end - max + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const goToPage = (page) => {
    if (page === props.currentPage || page < 1 || page > props.totalPages) {
        return
    }
    emit('change-page', page)
}

const goToPrevious = () => {
    goToPage(props.currentPage - 1)
}

const goToNext = () => {
    goToPage(props.currentPage + 1)
}
</script>
<style scoped>
.pagination-wrap {
    --page-bg: #ffffff;
    --page-border: #d9dee6;
    --page-text: #1f2937;
    --page-hover-bg: #f3f6fb;
    --page-hover-border: #bcc8d8;
    --page-active-bg: #1f2937;
    --page-active-border: #1f2937;
    --page-active-text: #ffffff;
    --page-disabled-text: #a0a7b2;
}

.pagination {
    gap: 0.45rem;
}

.page-item .page-link {
    min-width: 2.45rem;
    height: 2.45rem;
    padding: 0 0.85rem;
    border-radius: 999px;
    border: 1px solid var(--page-border);
    background-color: var(--page-bg);
    color: var(--page-text);
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: all 0.2s ease;
    box-shadow: 0 1px 1px rgba(15, 23, 42, 0.06);
}

.page-item:not(.active):not(.disabled) .page-link:hover {
    background-color: var(--page-hover-bg);
    border-color: var(--page-hover-border);
    color: #111827;
    transform: translateY(-1px);
}

.page-item.active .page-link {
    background-color: var(--page-active-bg);
    border-color: var(--page-active-border);
    color: var(--page-active-text);
    box-shadow: 0 8px 20px rgba(17, 24, 39, 0.24);
}

.page-item.disabled .page-link {
    color: var(--page-disabled-text);
    background-color: #f8fafc;
    border-color: #e5e7eb;
    cursor: not-allowed;
    opacity: 0.85;
    transform: none;
    box-shadow: none;
}

.page-link:focus-visible {
    outline: 3px solid rgba(31, 41, 55, 0.25);
    outline-offset: 2px;
}

@media (max-width: 576px) {
    .pagination {
        gap: 0.35rem;
    }

    .page-item .page-link {
        min-width: 2.15rem;
        height: 2.15rem;
        padding: 0 0.65rem;
        font-size: 0.9rem;
    }
}
</style>