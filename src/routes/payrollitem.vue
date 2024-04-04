<template>

    <div>
        <form action="" method="post">

            <div class="section drop-down">
                <label for=""> Branches </label>
                <select  v-model="selectedBranch" @change='fetchDepartments'>
                    <option value="">Select Option </option>
                    <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                        {{ branch.name }}</option>
                </select>

            </div>

            <div class="section drop-down">
                <label for="">Deparment</label>
                <select  v-model="selectedDepartment"  >
                    <option value="">Select Option </option>
                    <option v-for="department in departments" :key="department.id" :value="department.id">
                        {{ department.name }}</option>
                </select>

            </div>

            <div class="section drop-down">
                Employee
                <select>
                    <option disabled>Select Option </option>
                    <option>Moves</option>
                </select>

            </div>


        </form>

    </div>

</template>

<script>
import shortid from 'shortid';
import EventBus from '../events/';
import { i18n } from '../lang/';
import VLoader from '../components/loader.vue';
import VError from '../components/error.vue';
import VActivity from '../components/activity/activity.vue';
import formatTitle from '@directus/format-title';
import VNotFound from './not-found.vue';
import store from '../store/';
import api from '../api';
import { mapState } from 'vuex';
import { mapValues, findIndex, find, merge, forEach, keyBy } from 'lodash';


export default {
    name: 'PayrollItem',
    mounted() {
        this.fetchBranches();
    },
    data() {
        return {
            selectedBranch: "",
            selectedDepartment: "",
            branches: [], departments: []
        };
    },

    methods: {


        fetchDepartments() {
            console.log("Beneere")
            this.$api.getItems("departments", {
                fields: '*.*'

            })
                .then(res => res.data)
                .then(data => {
                    console.log(data);

                    this.departments = data;
                })


        },


         fetchBranches() {
            console.log("Beneere")
            this.$api.getItems("branches", {
                fields: '*.*'

            })
                .then(res => res.data)
                .then(data => {
                    console.log(data);

                    this.branches = data;
                })


        }
    }

}
</script>

<style lang="scss" scoped>
.edit {
    padding: var(--page-padding-top) var(--page-padding) var(--page-padding-bottom);
}

.revert {
    padding: 20px;

    .notice {
        margin-bottom: 40px;
    }
}

.status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 5px;
    margin-left: 8px;
    margin-top: 1px;
}

.activity {
    margin-bottom: 64px;
}
</style>
