<template>
    <section class="not-found-page">
        <div class="not-found-container text-center">
            <div class="error-illustration mb-4">
                <div class="glitch-wrapper">
                    <h1 class="not-found-code">404</h1>
                </div>
                <div class="ghost-icon">
                    <i class="bi bi-robot"></i>
                </div>
            </div>

            <div class="not-found-card shadow-lg">
                <h2 class="not-found-title">រកមិនឃើញទំព័រដែលអ្នកចង់បាន!</h2>
                <p class="not-found-message">
                    សោកស្តាយ! ទំព័រដែលអ្នកកំពុងស្វែងរកប្រហែលជាត្រូវបានលុប ឬផ្លាស់ប្តូរទីតាំង។
                    សូមព្យាយាមត្រឡប់ទៅកាន់ផ្ទាំងគ្រប់គ្រងវិញ។
                </p>

                <div class="action-buttons">
                    <RouterLink class="btn-back-home" to="/dashboard">
                        <i class="bi bi-house-door me-2"></i> ត្រឡប់ទៅ Dashboard
                    </RouterLink>
                </div>
            </div>

            <p class="mt-4 text-muted small">© 2026 ANT IT Team</p>
        </div>
    </section>
</template>

<script setup>
import { RouterLink } from "vue-router";
</script>

<style scoped>
/* រចនាប័ទ្មផ្ទៃខាងក្រោយទាំងមូល */
.not-found-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background-color: #f8fafc;
    background-image:
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.1) 0, transparent 50%),
        radial-gradient(at 50% 0%, rgba(168, 85, 247, 0.1) 0, transparent 50%);
}

.not-found-container {
    max-width: 500px;
    width: 100%;
}

/* រចនាអក្សរ 404 ឱ្យមាន Gradient */
.not-found-code {
    font-size: clamp(6rem, 15vw, 9rem);
    font-weight: 900;
    line-height: 1;
    margin: 0;
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -5px;
    filter: drop-shadow(0 10px 15px rgba(99, 102, 241, 0.2));
}

/* Card ព័ត៌មាន */
.not-found-card {
    background: white;
    padding: 3rem 2rem;
    border-radius: 1.5rem;
    border: 1px solid rgba(226, 232, 240, 0.8);
}

.not-found-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 1rem;
}

.not-found-message {
    color: #64748b;
    line-height: 1.6;
    margin-bottom: 2rem;
}

/* ប៊ូតុងត្រឡប់ក្រោយ */
.btn-back-home {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.8rem 2rem;
    background: #1e293b;
    color: white;
    text-decoration: none;
    font-weight: 600;
    border-radius: 0.75rem;
    transition: all 0.3s ease;
    box-shadow: 0 10px 15px -3px rgba(30, 41, 59, 0.2);
}

.btn-back-home:hover {
    background: #0f172a;
    transform: translateY(-3px);
    box-shadow: 0 20px 25px -5px rgba(30, 41, 59, 0.2);
}

/* Animation តិចតួចសម្រាប់ភាពទាក់ទាញ */
.ghost-icon {
    font-size: 3rem;
    color: #6366f1;
    animation: float 3s ease-in-out infinite;
    margin-top: -20px;
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-15px);
    }
}

/* Responsive សម្រាប់ទូរស័ព្ទ */
@media (max-width: 576px) {
    .not-found-card {
        padding: 2rem 1.5rem;
    }
}
</style>