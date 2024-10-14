// Core Vue & Router
import Vue from 'vue';
import Router from 'vue-router';

// Store & Utilities
import api from './api';
import store from './store';
import { TOGGLE_NAV, TOGGLE_INFO } from './store/mutation-types';
import { i18n } from './lang';
import EventBus from './events';
import hydrateStore from '@/hydrate';

// Static Routes (Eager Loaded)
import Collections from './routes/collections.vue';
import Items from './routes/items.vue';
import FileLibrary from './routes/file-library.vue';
import Item from './routes/item.vue';
import Login from './routes/login.vue';
import PayrollItems from './routes/payrollitems.vue';
import PayrollItem from './routes/payrollitem.vue';
import PayrollItemEdit from './routes/payrollitemedit.vue';
import PaySlipItem from './routes/payslipitem.vue';
import PaySlipItems from './routes/payslipitems.vue';
import PaySlipItemEdit from './routes/payslipitemedit.vue';
import TimeTracking from './routes/timeTracking.vue';
import TimeTrackings from './routes/timeTrackings.vue';
import Overvew from './routes/overview.vue';
import EmployeeItems from './routes/employeeItems.vue';
import Dashboard from './pages/Dashboard.vue';

// Lazy-loaded Routes (Improves Performance)
const Setup2FA = () => import(/* webpackChunkName: "setup-2fa" */ './routes/setup-2fa.vue');
const ResetPassword = () => import(/* webpackChunkName: "reset-password" */ './routes/reset-password.vue');
const Install = () => import(/* webpackChunkName: "install" */ './routes/install.vue');
const NotFound = () => import(/* webpackChunkName: "not-found" */ './routes/not-found.vue');
const Interfaces = () => import(/* webpackChunkName: "settings_interfaces" */ './routes/settings/interfaces.vue');
const InterfaceDebugger = () => import(/* webpackChunkName: "settings_interfaces-debugger" */ './routes/settings/interface-debugger.vue');
const Settings = () => import(/* webpackChunkName: "settings_settings" */ './routes/settings/settings.vue');
const SettingsGlobal = () => import(/* webpackChunkName: "settings_global" */ './routes/settings/global.vue');
const SettingsCollections = () => import(/* webpackChunkName: "settings_collections" */ './routes/settings/collections.vue');
const SettingsFields = () => import(/* webpackChunkName: "settings_fields" */ './routes/settings/fields.vue');
const SettingsRoles = () => import(/* webpackChunkName: "settings_roles" */ './routes/settings/roles.vue');
const SettingsPermissions = () => import(/* webpackChunkName: "settings_permissions" */ './routes/settings/permissions.vue');
const ModuleExtension = () => import(/* webpackChunkName: "module-extension" */ './routes/module-extension.vue');

// Use Vue Router
Vue.use(Router);

// Route Definitions
const routes = [
  {
    path: '/overview',
    component: Dashboard
  },
  // Other routes...
];

// Router Instance
const router = new Router({
  mode: 'hash',
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { x: 0, y: 0 };
  },
  routes
});

// Global Route Guards
router.beforeEach(async (to, from, next) => {
  const publicRoute = to.meta.publicRoute;

  // Collapse sidebars on route change
  if (store.state.sidebars.nav) store.commit(TOGGLE_NAV, false);
  if (store.state.sidebars.info) store.commit(TOGGLE_INFO, false);

  // Initialize projects on first load
  if (!store.state.projects) {
    await store.dispatch('getProjects');
  }

//   // Redirect to install page if no projects are set up
//   if (store.state.projects === false && to.path !== '/install') {
//     return next('/install');
//   }

  // Handle public routes
  if (publicRoute) return next();

  const loggedIn = store.getters.currentProject?.data?.authenticated || false;

  // Reload project if URL manually changes the project
//   if (from.params.project && from.params.project !== to.params.project) {
//     if (to.params.project !== store.state.currentProjectKey) {
//       await store.dispatch('setCurrentProject', to.params.project);
//     }
//   } else if (loggedIn && !store.state.hydrated) {
//     await hydrateStore();
//   }

  // Redirect to login if not authenticated
//   if (!loggedIn) {
//     return to.path === '/' 
//       ? next({ path: '/login', query: to.query }) 
//       : next({ path: '/login', query: { redirect: to.fullPath } });
//   }

  next();
});

// After each route change
router.afterEach((to) => {
  setTimeout(() => store.dispatch('latency'), 1000);

//   if (store.state.hydrated && !['/setup-2fa', '/logout', '/login'].includes(to.path)) {
//     store.dispatch('track', { page: to.path });
//   }
});

export default router;
