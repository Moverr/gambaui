<template>

    <div>
        <div>
            <v-header :icon-link="`/${currentProjectKey}/collections`" />
            <v-loader area="content" />
        </div>

        <v-header :breadcrumb="breadcrumb" :info-toggle="!newItem && !batch && !activityDetail" :icon-link="iconLink"
            :icon="singleItem ? collectionInfo.icon || 'box' : 'arrow_back'" item-detail
            :settings="collection === 'directus_webhooks'">
            <template slot="title">
                <span v-tooltip="statusName" class="status-indicator"
                    :style="{ backgroundColor: `var(--${statusColor})` }" />
            </template>
            <template slot="buttons">


                <v-header-button :loading="saving" :label="$t('save')" :options="saveOptions" icon="check"
                    icon-color="button-primary-text-color" background-color="button-primary-background-color"
                    hover-color="button-primary-background-color-hover"
                    @click="singleItem ? save('stay') : save('leave')" @input="save" />
            </template>
        </v-header>

        <div class="inline-form " style="margin-top: 10px; margin-left:40px;">
            <form action="" method="post">

                <div class="  drop-down">
                    <label for=""> Branches </label>
                    <select v-model="selectedBranch" @change='fetchDepartments'>
                        <option value="">Select Option </option>
                        <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                            {{ branch.name }}</option>
                    </select>

                </div>

                <div class="  drop-down">
                    <label for="">Deparment</label>
                    <select v-model="selectedDepartment" @change='fetchEmployees'>
                        <option value="">Select Option </option>
                        <option v-for="department in departments" :key="department.id" :value="department.id">
                            {{ department.name }}</option>
                    </select>

                </div>

                <div class="  drop-down">
                    <label for=""> Employee </label>
                    <select v-model="selectedEmployee" @change="displaySelectedEmployee">
                        <option value="">Select Option </option>
                        <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                            {{ employee.first_name }}
                            {{ employee.last_name }}
                        </option>
                    </select>

                </div>


            </form>
        </div>

        <div v-if="employeeDetail !== '' && employeeDetail !== undefined" class="inline-form "
            style="margin-top: 10px; margin-left:40px;">
            <label for=""><strong>Name:</strong> {{ employeeDetail.first_name }} {{ employeeDetail.last_name }} </label>
            <label for="">Job Status: {{ employeeDetail.job_status }} </label>
            <label for="">Gross Amount: {{ employeeDetail.gross_salary }} </label>

        </div>
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
            selectedEmployee: "",
            employeeDetail: "",
            branches: [], departments: [], employees: []
        };
    },

    methods: {


        displaySelectedEmployee() {
            let br = this.employees;
            let bingo = br.find(x => x.id == this.selectedEmployee);
            this.employeeDetail = bingo;
            console.log(this.employeeDetail)

        }
        ,
        fetchEmployees() {
            console.log("Beneere")
            this.$api.getItems("employees", {
                fields: '*.*'

            })
                .then(res => res.data)
                .then(data => {
                    console.log(data);

                    this.employees = data;
                })


        },


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
.inline-form {

    width: 1000%;
    float: left;
    padding: 5px;
    padding-left: 15px;
}

.inline-form .drop-down {
    float: left;
}

.inline-form select {
    padding: 10px;
    font-size: 14px;
    width: 300px !important;
    overflow: hidden;
    margin-left: 4px;
}

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
