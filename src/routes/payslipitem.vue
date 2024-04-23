<template>
	<div>
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
			<form action="" method="post">
				<div class="  drop-down">
					<label for="">From</label>
					<input
						class="datetime"
						type="datetime-local"
						name="from_date"
						id="start_date"
						v-model="fromDate"
					/>
				</div>
				&nbsp;
				<div class="  drop-down">
					<label for="">To</label>
					<input
						v-model="toDate"
						class="datetime"
						type="datetime-local"
						name="to_date"
						id="to_date"
					/>
				</div>
			</form>
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
	name: 'PaySlipItem',
	mounted() {
		this.fetchBranches();
		this.getBeginningOfMonth();
		this.getLastDayOfMonth();
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
			toDate: ''
		};
	},

	methods: {
		getBeginningOfMonth() {
			var today = new Date();
			var beginningOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
			beginningOfMonth.setDate(beginningOfMonth.getDate() + 1);
			var begin = beginningOfMonth.toISOString().slice(0, 16);
			this.fromDate = begin;
		},

		getLastDayOfMonth() {
			var today = new Date();
			let nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
			let lastDay = new Date(nextMonth - 1);
			this.toDate = lastDay.toISOString().slice(0, 16);
		},

		getCurrentDateTime() {
			const now = new Date();
			// Format the date as yyyy-mm-ddThh:mm (required format for datetime-local input)
			return now.toISOString().slice(0, 16);
		},

		async savePayroll() {
			let from = this.fromDate;
			let to = this.toDate;
			let earnings_and_deductions = this.earnings_and_deductions;
			let net_salary = this.netAmont;

			let branch = this.selectedBranch;

			let currency = this.employeeDetail.currency;

			let department = this.selectedDepartment;

			let employee = this.selectedEmployee;
			let status = 'draft';
			let basic_salary = this.employeeDetail.gross_salary;

			const body = {
				basic_salary: basic_salary,
				earnings_and_deductions: earnings_and_deductions,
				net_salary: net_salary,
				branch: branch,
				currency: currency,
				department: department,
				employee: employee,
				from: from,
				to: to,
				status: status
			};

			try {
				await this.$api.createItem('payroll', body);
				alert('Record Saved Succesfully');
				//  this.$router.push('/collections');
				this.$router.push('/hrsystem/collections/payroll');
			} catch (error) {
				this.error = error;
				console.error(error);
				this.$router.push('/hrsystem/collections/payroll/create');
			} finally {
			}
		},
		printPage() {
			window.print();
		},
		calculateNetAmount() {
			//todo: map to find the reduce
			let ledgers = this.ledgers;

			const totalAmount = ledgers.reduce((acc, item) => {
				const amountDetails = item.amount_details || [];
				amountDetails.forEach(detail => {
					console.log('------------------------------------ ');
					console.log(detail.payment_ledger_detail_id.type);
					console.log(detail.payment_ledger_detail_id.amount);
					console.log(' ----------------------------------- ');
					if (detail.payment_ledger_detail_id.type === 'increment') {
						acc = eval(acc + detail.payment_ledger_detail_id.amount);
					} else if (detail.payment_ledger_detail_id.type === 'decrement') {
						acc = eval(acc - detail.payment_ledger_detail_id.amount);
					}
				});
				return acc;
			}, 0);

			console.log('Total amount:', totalAmount);
			console.log('Blind date');
			console.log(ledgers);

			this.earnings_and_deductions = totalAmount;

			this.netAmont = eval(this.employeeDetail.gross_salary + totalAmount);
			// this.earnings_and_deductions;
		},

		displaySelectedEmployee() {
			let br = this.employees;
			let bingo = br.find(x => x.id == this.selectedEmployee);
			this.employeeDetail = bingo;
			console.log(this.employeeDetail);
			this.fetchPaymentLedger();
		},
		fetchPaymentLedger() {
			console.log('Payment Ledger');
			const filter = {
				'employees.id': { eq: this.selectedEmployee },
				from_date: { gte: this.fromDate },
				to_date: { lte: this.toDate }
			};

			this.$api
				.getItems('payment_ledger', {
					fields: '*.*,amount_details.*,amount_details.payment_ledger_detail_id.*',
					filter
				})
				.then(res => res.data)
				.then(data => {
					console.log(data);

					this.ledgers = data;
					this.calculateNetAmount();
				})
				.catch(error => {
					console.log('Error impl');
					console.log(error);
					this.netAmont = null;
				});
		},

		fetchEmployees() {
			console.log('Employees');
			const filter = {
				'department.id': { eq: this.selectedDepartment }
			};

			this.$api
				.getItems('employees', {
					fields: '*.*',
					filter
				})
				.then(res => res.data)
				.then(data => {
					console.log(data);

					this.employees = data;
				});
		},

		fetchDepartments() {
			console.log('Departments');

			this.selectedEmployee = '';
			this.employeeDetail = '';
			this.netAmont = undefined;
			this.employeeDetail = '';
			this.employees = undefined;
			this.selectedDepartment = undefined;

			const filter = {
				'branch.id': { eq: this.selectedBranch }
			};

			this.$api
				.getItems('departments', {
					fields: '*.*',
					filter
				})
				.then(res => res.data)
				.then(data => {
					console.log(data);

					this.departments = data;
				});
		},

		fetchBranches() {
			console.log('Branches');
			console.log(this.$api);
			this.$api
				.getItems('branches', {
					fields: '*.*'
				})
				.then(res => res.data)
				.then(data => {
					console.log(data);

					this.branches = data;
				});
		}
	}
};
</script>

<style lang="scss" scoped>
.datetime {
	padding: 10px;
	margin-left: 10px;
}

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
</style>
