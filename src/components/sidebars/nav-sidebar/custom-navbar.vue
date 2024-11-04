<style lang="css" scoped>
.navbar-nav {}

.navbar-nav .nav-item {
  font-size: 12px;
  background: #fff;
  margin-bottom: 15px;
  margin-top: 15px;
  padding: 10px;
  width: 200px !important;
  text-align: left;
  padding-left: 20px;
}

.navbar-nav .nav-item .a {
  text-align: left;
  color: #fff;
}

.navbar-nav .nav-item div {
  text-align: left;
  padding-top: 8px;
  text-transform: capitalize !important;
}

.navbar-nav .nav-item i {
  color: aliceblue;
  background-image: linear-gradient(310deg, #7928CA 0%, #FF0080 100%);
  float: left;
}
</style>

<template>
  <div style="background-color: white;">


    <h1 style="
    font-size: 22px;
    padding: 20px;
    text-shadow: 2px 2px 4px rgba(240, 248, 255, 0.8);
    transform: rotate(-3deg);
    color: #333; letter-spacing:2px;
    "> CURLY <br/> HR SYSTEM </h1>

    <section class="main-bar">




      <ul class="navbar-nav">
        <li class="nav-item btn bg-gradient-primary mt-3 w-100">

          <router-link :to="`/${this.currentProjectKey}/overview`">

            <i class="fa fa-bars text-lg opacity-10 icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center"
              aria-hidden="true"></i>

            <div>Dashboard</div>
          </router-link>
        </li>




        <li class="nav-item btn bg-gradient-primary mt-3 w-100">

          <router-link :to="`/${this.currentProjectKey}/collections/branches`">

            <i class=" fa fa-institution  text-lg opacity-10 icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center"
              aria-hidden="true"></i>

            <div>Branches</div>
          </router-link>
        </li>




        <li class="nav-item btn bg-gradient-primary mt-3 w-100">

          <router-link :to="`/${this.currentProjectKey}/collections/departments`">

            <i class="fa fa-institution  s text-lg opacity-10 icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center"
              aria-hidden="true"></i>

            <div>Departments</div>
          </router-link>
        </li>



        <li class="nav-item btn bg-gradient-primary mt-3 w-100">

          <router-link :to="`/${this.currentProjectKey}/collections/employees`">

            <i class="fa fa-address-card text-lg opacity-10 icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center"
              aria-hidden="true"></i>

            <div>Employees</div>
          </router-link>
        </li>






      </ul>
    </section>
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
