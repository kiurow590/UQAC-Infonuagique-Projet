import { createRouter, createWebHistory } from 'vue-router';
import LoginComponent from './components/Login.vue';
import AbonnementComponent from './components/Abonnement.vue';
import AccueilComponent from './components/Accueil.vue';

const routes = [
    {
        path: '/',
        component: LoginComponent
    },
    { 
        path: '/login', 
        name: 'login', 
        component: LoginComponent 
    },
    { 
        path: '/abonnement', 
        name: 'abonnement', 
        component: AbonnementComponent 
    },
    { 
        path: '/accueil', 
        name: 'accueil', 
        component: AccueilComponent 
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
