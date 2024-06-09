<template>
	<div>
		<div v-if="showalert" class="lightbox">
			<h1>{{ msgTitle }}</h1>
			<span>{{ msgDetail }}</span>
		</div>

		<div>
			<v-header :icon-link="`/${currentProjectKey}/collections`" />
			<v-loader area="content" />
		</div>

		<v-header
			:breadcrumb="breadcrumb"
			:info-toggle="!newItem && !batch && !activityDetail"
			:icon-link="iconLink"
			:icon="singleItem ? collectionInfo.icon || 'box' : 'arrow_back'"
			item-detail
			:settings="collection === 'directus_webhooks'"
		>
			<template slot="title">
				<span
					v-tooltip="statusName"
					class="status-indicator"
					:style="{ backgroundColor: `var(--${statusColor})` }"
				/>
			</template>
			<template slot="buttons">
				<v-header-button
					key="add"
					icon="print"
					icon-color="button-primary-text-color"
					background-color="button-primary-background-color"
					:label="Print"
					@click="printPage"
				/>

				<!-- <v-header-button
					v-if="isPending"
					:loading="saving"
					:label="$t('save')"
					:options="saveOptions"
					icon="check"
					icon-color="button-primary-text-color"
					background-color="button-primary-background-color"
					hover-color="button-primary-background-color-hover"
					@click="savePayroll"
					@input="save"
				/> -->
			</template>
		</v-header>

		<div class="inline-form " style="margin-top: 10px; margin-left:40px;">
			<div class="  drop-down">
				<label for="">Pay Month</label>
				<input
					class="datetime"
					type="month"
					name="month"
					id="month"
					v-model="selectedMonth"
					@change="calculateMonthBounds"
				/>

				<p style="margin-left:10px;">{{ selectedMonth }}</p>
			</div>
			&nbsp;
			<div
				class=" display_window "
				style="
				display: block;
			 
				float: left;
				margin: 10px;
				margin-top: 15px;
				font-size: 20px;
				font-weight: 400;
	"
			>
				<div>From : {{ fromDate }}</div>
				<div>To : {{ toDate }}</div>
			</div>
		</div>
		<br />
		<div class="inline-form " style="margin-top: 10px; margin-left:40px;">
			<form action="" method="post">
				<div class="  drop-down">
					<label for="">Branch</label>
					<select v-model="selectedBranch" @change="fetchDepartments">
						<option value="">Select Option</option>
						<option v-for="branch in branches" :key="branch.id" :value="branch.id">
							{{ branch.name }}
						</option>
					</select>
				</div>

				<div class="  drop-down">
					<label for="">Deparment</label>
					<select v-model="selectedDepartment" @change="fetchEmployees">
						<option value="">Select Option</option>
						<option
							v-for="department in departments"
							:key="department.id"
							:value="department.id"
						>
							{{ department.name }}
						</option>
					</select>
				</div>

				<div class="  drop-down">
					<label for="">Employee</label>
					<select v-model="selectedEmployee" @change="displaySelectedEmployee">
						<option value="">Select Option</option>
						<option
							v-for="employee in employees"
							:key="employee.id"
							:value="employee.id"
						>
							{{ employee.first_name }}
							{{ employee.last_name }}
						</option>
					</select>
				</div>
			</form>
		</div>

		<div
			v-if="employeeDetail !== '' && employeeDetail !== undefined"
			class="inline-form "
			style="margin-top: 10px; margin-left:40px;"
		>
			<label for="">
				<h1>Name:</h1>
				{{ employeeDetail.first_name }} {{ employeeDetail.last_name }}
			</label>
			<label for="">
				<h1>Job Status:</h1>
				{{ employeeDetail.job_status }}
			</label>
			<label for="">
				<h1>Gross Amount:</h1>
				{{ employeeDetail.gross_salary }} {{ employeeDetail.currency }}
			</label>

			<div v-for="ledger in ledgers" :key="ledger.id">
				<h1>Payment Ledger</h1>
				From: {{ ledger.from_date }} To: {{ ledger.to_date }}
				<h1>Details</h1>
				<table class="table">
					<tr>
						<th>
							Date
						</th>
						<th>
							Amount
						</th>
						<th>
							Type
						</th>
						<th>
							Reason
						</th>
					</tr>

					<tr v-for="detail in ledger.amount_details" :key="detail.id">
						<td>
							{{ detail.payment_ledger_detail_id.created_on }}
						</td>
						<td>
							{{ detail.payment_ledger_detail_id.amount }}
							{{ employeeDetail.currency }}
						</td>
						<td>{{ detail.payment_ledger_detail_id.type }}</td>

						<td>{{ detail.payment_ledger_detail_id.details }}</td>
					</tr>
				</table>
			</div>
		</div>

		<div
			v-if="netAmont !== null && netAmont !== undefined"
			class="inline-form "
			style="margin-top: 10px; margin-left:40px;"
		>
			<table>
				<tr>
					<th>Basic</th>
					<td>{{ employeeDetail.gross_salary }} {{ employeeDetail.currency }}</td>
				</tr>
				<tr>
					<th>Additions</th>
					<td>{{ earnings_and_deductions }} {{ employeeDetail.currency }}</td>
				</tr>
				<tr>
					<th>Net Amount</th>
					<td>{{ netAmont }} {{ employeeDetail.currency }}</td>
				</tr>

				<tr>
					<th>Payment Status</th>
					<td>{{ paymentstatus }} {{ approvedDate }}</td>
				</tr>
			</table>
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
	name: 'timeTracking',
	mounted() {
	 
	},

	data() {
		return {
			selectedBranch: '',
			selectedDepartment: '',
			selectedEmployee: '',
			employeeDetail: '',
			branches: [],
			departments: [],
			employees: [],
			ledgers: [],
			earnings_and_deductions: null,
			netAmont: null,
			fromDate: '',
			toDate: '',
			paymentstatus: '',
			approvedDate: '',
			alreadyapprovedemps: null,
			msgTitle: '',
			msgDetail: '',
			showalert: false
		};
	},
	computed: {
	 
	},

	methods: {
		 
		  
	 
	}
};
</script>

<style lang="scss" scoped>
.datetime {
	padding: 10px;
	margin-left: 10px;
	width: 290px;
}

.inline-form {
	width: 100%;
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

.table {
	width: 600px;
	border-collapse: collapse;
}

th,
td {
	padding: 8px;
	text-align: left;
	border-bottom: 1px solid #ddd;
}

tr:hover {
	background-color: #f5f5f5;
}

th {
	background-color: #ccc;
	color: black;
}

h1 {
	font-size: 16px;
	font-weight: 700;
	word-spacing: 1%;
}




.lightbox {
	position: fixed;
	background: #eee;

	margin: auto;
	left: 10%;
	right: 10%;
	width: 80%;
	max-width: 700px;
	height: auto;

	border: 1px solid;
	border-radius: 5px;
	font-size: 16px;
	padding: 20px;
	box-sizing: border-box;
}

@media (max-width: 768px) {
	.lightbox {
		left: 5%;
		right: 5%;
		width: 90%;
		padding: 15px;
		font-size: 14px;
	}
}

@media (max-width: 480px) {
	.lightbox {
		left: 2.5%;
		right: 2.5%;
		width: 95%;
		padding: 10px;
		font-size: 12px;
	}
}


</style>
