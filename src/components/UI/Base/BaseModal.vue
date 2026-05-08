<template>
    <teleport to="body">
        <transition name="modal-fade">
            <div v-if="modelValue" class="base-modal" role="dialog" aria-modal="true" :aria-labelledby="titleId"
                @click="handleBackdropClick">
                <div class="base-modal__dialog" :class="dialogClass" @click.stop>
                    <div class="base-modal__header" v-if="!hideHeader">
                        <slot name="header">
                            <h5 :id="titleId" class="base-modal__title">{{ title }}</h5>
                        </slot>
                        <button v-if="showClose" type="button" class="base-modal__close" aria-label="Close"
                            @click="closeModal">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>

                    <div class="base-modal__body">
                        <slot />
                    </div>

                    <div class="base-modal__footer" v-if="$slots.footer || !hideDefaultFooter">
                        <slot name="footer">
                            <button type="button" class="btn btn-light" @click="closeModal">{{ cancelText }}</button>
                            <button type="button" class="btn btn-primary" @click="confirmModal">{{ confirmText
                                }}</button>
                        </slot>
                    </div>
                </div>
            </div>
        </transition>
    </teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, watch } from "vue";

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        default: "Modal",
    },
    size: {
        type: String,
        default: "md",
        validator: (value) => ["sm", "md", "lg", "xl"].includes(value),
    },
    showClose: {
        type: Boolean,
        default: true,
    },
    closeOnBackdrop: {
        type: Boolean,
        default: true,
    },
    closeOnEsc: {
        type: Boolean,
        default: true,
    },
    hideHeader: {
        type: Boolean,
        default: false,
    },
    hideDefaultFooter: {
        type: Boolean,
        default: false,
    },
    cancelText: {
        type: String,
        default: "Cancel",
    },
    confirmText: {
        type: String,
        default: "Confirm",
    },
});

const emit = defineEmits(["update:modelValue", "close", "confirm"]);

const titleId = `base-modal-title-${Math.random().toString(36).slice(2, 10)}`;

const dialogClass = computed(() => ({
    "base-modal__dialog--sm": props.size === "sm",
    "base-modal__dialog--md": props.size === "md",
    "base-modal__dialog--lg": props.size === "lg",
    "base-modal__dialog--xl": props.size === "xl",
}));

const closeModal = () => {
    emit("update:modelValue", false);
    emit("close");
};

const confirmModal = () => {
    emit("confirm");
};

const handleBackdropClick = () => {
    if (props.closeOnBackdrop) {
        closeModal();
    }
};

const handleEsc = (event) => {
    if (event.key === "Escape" && props.modelValue && props.closeOnEsc) {
        closeModal();
    }
};

watch(
    () => props.modelValue,
    (isOpen) => {
        document.body.classList.toggle("modal-open", isOpen);
    },
    { immediate: true },
);

watch(
    () => props.closeOnEsc,
    (enabled) => {
        if (enabled) {
            document.addEventListener("keydown", handleEsc);
        } else {
            document.removeEventListener("keydown", handleEsc);
        }
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", handleEsc);
});
</script>

<style scoped>
.base-modal {
    position: fixed;
    inset: 0;
    z-index: 1055;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(2px);
}

.base-modal__dialog {
    width: min(100%, 640px);
    max-height: calc(100vh - 2rem);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-radius: 0.75rem;
    background: #ffffff;
    box-shadow: 0 20px 50px rgba(2, 6, 23, 0.25);
}

.base-modal__dialog--sm {
    width: min(100%, 420px);
}

.base-modal__dialog--md {
    width: min(100%, 640px);
}

.base-modal__dialog--lg {
    width: min(100%, 840px);
}

.base-modal__dialog--xl {
    width: min(100%, 1040px);
}

.base-modal__header,
.base-modal__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e2e8f0;
}

.base-modal__footer {
    border-top: 1px solid #e2e8f0;
    border-bottom: 0;
    justify-content: flex-end;
}

.base-modal__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: #0f172a;
}

.base-modal__close {
    border: 0;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    color: #334155;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.base-modal__close:hover {
    background: #e2e8f0;
}

.base-modal__body {
    overflow: auto;
    padding: 1.25rem;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>
