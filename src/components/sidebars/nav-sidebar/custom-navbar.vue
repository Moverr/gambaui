<style lang="css" scoped>
.navbar-nav {}

.navbar-nav .nav-item {
  font-size: 20px;
  background: #fff;
  margin-bottom: 15px;
  margin-top: 15px;
  padding: 10px;
}
</style>

<template>
  <div class="collapse navbar-collapse w-auto ps ps--active-y">

    <div style="height:100px; width:100px;  display:block;">
      &nbsp;
    </div>



    <ul class="navbar-nav">
      <li class="nav-item"> <router-link :to="`/${this.currentProjectKey}/overview`">

          <i class="ni ni-money-coins text-lg opacity-10" aria-hidden="true"></i>

          Dashboard
        </router-link></li>

      <li class="nav-item">
        <router-link :to="`/${this.currentProjectKey}/collections/branches`">
          <i class="ni ni-money-coins text-lg opacity-10" aria-hidden="true"></i>

          Branches</router-link>
      </li>

      
      <li class="nav-item">


        <router-link :to="`/${this.currentProjectKey}/collections/employees`">

          <i class="ni ni-money-coins text-lg opacity-10" aria-hidden="true"></i>

          Employees</router-link>
      </li>


      
      <li class="nav-item">


        <router-link :to="`/${this.currentProjectKey}/collections/departments`">

          <i class="ni ni-money-coins text-lg opacity-10" aria-hidden="true"></i>

          Departments</router-link>
      </li>






    </ul>
  </div>
</template>

<script>
import { ref } from 'vue';


import ProjectSwitcher from './project-switcher.vue';
import NavMenu from './nav-menu.vue';
import NavBookmarks from './nav-bookmarks.vue';
import VBlocker from '../../blocker.vue';
import { TOGGLE_NAV } from '@/store/mutation-types';
import { mapState } from 'vuex';
import ModuleBar from './module-bar';
import CustomNavBar from './custom-navbar.vue'
import { some } from 'lodash';



export default {
  name: 'CustomNavBar',
  computed: {
    ...mapState(['currentProjectKey', 'currentUser']),
    permissions() {
      return this.$store.state.permissions;
    },
    collections() {
      const collections = this.$store.state.collections;

      if (collections == null) return [];

      console.log(collections);

      return Object.values(collections)
        .filter(
          collection =>
            collection.hidden == false &&
            collection.managed == true &&
            collection.collection.startsWith('directus_') === false
        )
        .filter(collection => {
          if (
            collection.status_mapping &&
            this.permissions[collection.collection].statuses
          ) {
            return some(
              this.permissions[collection.collection].statuses,
              permission => permission.read !== 'none'
            );
          }

          return this.permissions[collection.collection].read !== 'none';
        });
    },
    projectName() {
      return this.$store.getters.currentProject.project_name;
    },
    active() {
      return this.$store.state.sidebars.nav;
    },
    bookmarks() {
      return this.$store.state.bookmarks;
    },
    customCollections() {
      const collectionListing = this.currentUser.role.collection_listing;
      console.log(collectionListing)
      const hasCustom = Array.isArray(collectionListing) && collectionListing.length > 0;

      if (hasCustom === false) return null;

      return collectionListing.map(group => {
        return {
          title: group.group_name,
          links: (group.collections || []).map(({ collection }) => {
            const collectionInfo = this.collections.find(
              c => c.collection === collection
            );

            if (collection === "salary")

              return {
                link: `/${this.currentProjectKey}/payroll`,
                name: "payroll",
                icon: collectionInfo ? collectionInfo.icon : null
              }

            else

              return {
                link: `/${this.currentProjectKey}/collections/${collection}`,
                name: this.$helpers.formatCollection(collection),
                icon: collectionInfo ? collectionInfo.icon : null
              };
          })
        };
      });
    },
    defaultCollections() {

      let collect =
        this.collections
          .map(({ collection, icon }) => (
            // 	(collection === "salary" || collection === "payroll" ) ?
            // {
            // 	link: `/${this.currentProjectKey}/payroll`,
            // 	name: "payroll ",
            // 	icon
            // } :
            {
              link: `/${this.currentProjectKey}/collections/${collection}`,
              name: this.$helpers.formatCollection(collection),
              icon
            }

          ))

          .sort((a, b) => (a.name > b.name ? 1 : -1));


      return collect;
    }
  },
  methods: {
    logout() {
      this.$store.dispatch('logout');
    },
    deleteBookmark(id) {
      this.$store.dispatch('deleteBookmark', id);
    },
    toBookmark(bookmark) {
      /* eslint-disable camelcase */
      const {
        collection,
        search_query,
        filters,
        view_options,
        view_type,
        view_query
      } = bookmark;

      this.$store
        .dispatch('setListingPreferences', {
          collection,
          updates: {
            search_query,
            filters,
            view_options,
            view_type,
            view_query
          }
        })
        .then(() => {
          this.$router.push(`/${this.currentProjectKey}/collections/${collection}`);
        });
    },
    disableNav() {
      this.$store.commit(TOGGLE_NAV, false);
    }
  }
  ,
  setup() {
    const feature = ref();

    return {

    };
  },
};
</script>
