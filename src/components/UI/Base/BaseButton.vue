<template>
    <button :type="type" :class="buttonClass" :disabled="disabled || loading" v-bind="$attrs">
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        <slot />
    </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    variant: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'secondary', 'danger', 'light', 'outline'].includes(value),
    },
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['sm', 'md', 'lg'].includes(value),
    },
    shape: {
        type: String,
        default: 'pill',
        validator: (value) => ['pill', 'rounded', 'sharp'].includes(value),
    },
    type: {
        type: String,
        default: 'button',
        validator: (value) => ['button', 'submit', 'reset'].includes(value),
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    loading: {
        type: Boolean,
        default: false,
    },
});

const buttonClass = computed(() => {
    const baseClasses = ['btn', 'fw-bold', 'shadow-sm', 'transition-all'];
    const variantMap = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'btn-danger',
        light: 'btn-light',
        outline: 'btn-outline-primary',
    };
    const sizeMap = {
        sm: 'btn-sm px-3',
        md: 'px-4',
        lg: 'btn-lg px-5',
    };
    const shapeMap = {
        pill: 'btn-shape-pill',
        rounded: 'btn-shape-rounded',
        sharp: 'btn-shape-sharp',
    };

    return [
        ...baseClasses,
        variantMap[props.variant],
        sizeMap[props.size],
        shapeMap[props.shape],
        props.disabled && 'opacity-75',
    ].filter(Boolean);
});
</script>

<style scoped>
.btn {
    border: none;
    transition: all 0.3s ease;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
}

.btn-shape-pill {
    border-radius: 999px;
}

.btn-shape-rounded {
    border-radius: 12px;
}

.btn-shape-sharp {
    border-radius: 8px;
}

.btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
}

.btn:active:not(:disabled) {
    transform: translateY(0);
}

.btn-primary {
    background-color: #216477;
    color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
    background-color: #1a4f5d;
}

.btn-secondary {
    background-color: #6c757d;
    color: #ffffff;
}

.btn-secondary:hover:not(:disabled) {
    background-color: #5a6268;
}

.btn-danger {
    background-color: #dc3545;
    color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
    background-color: #c82333;

}

.btn-light {
    background-color: #f8f9fa;
    color: #216477;
    border: 1px solid #e2e8f0;
}

.btn-light:hover:not(:disabled) {
    background-color: #e8e9ea;
    border-color: #216477;
}

.btn-outline-primary {
    background-color: transparent;
    color: #216477;
    border: 2px solid #216477;
}

.btn-outline-primary:hover:not(:disabled) {
    background-color: #216477;
    color: #ffffff;
}

.btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.transition-all {
    transition: all 0.3s ease;
}
</style>
