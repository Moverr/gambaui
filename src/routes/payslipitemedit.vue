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

				<v-header-button
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
				/>
			</template>
		</v-header>

		<div class="inline-form " style="margin-top: 10px; margin-left:40px;">
			<form action="" method="post">
				<div class="  drop-down">
					<label for="">From</label>
					<input
						class="datetime"
						type="date"
						name="from_date"
						id="start_date"
						v-model="fromDate"
					/>
					<p style="margin-left:10px;">{{ fromDate }}</p>
				</div>
				&nbsp;
				<div class="  drop-down">
					<label for="">To</label>
					<input
						v-model="toDate"
						class="datetime"
						type="date"
						name="to_date"
						id="to_date"
					/>
					<p style="margin-left:10px;">{{ toDate }}</p>
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
	name: 'PaySlipItemEdit',
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
		isPending() {
			return this.paymentstatus === 'approved' ? false : true;
		}
	},

	methods: {
		alreadyPaid(employee) {
			// Check if the person exists in alreadyapprovedemps
			console.log('Already paid ');
			console.log(this.alreadyapprovedemps);

			// Check if alreadyapprovedemps is falsy or empty
			if (!this.alreadyapprovedemps || this.alreadyapprovedemps.length === 0) {
				return false; // No employees paid yet
			}

			// Check if the employee ID exists in alreadyapprovedemps
			return this.alreadyapprovedemps.some(item => item.employee.id === employee.id);
		},

		async getPayrolls() {
			this.showalert = true;
			this.msgTitle = 'Information';
			this.msgDetail = 'Fetching Payrolls';

			let from = this.fromDate;
			let to = this.toDate;

			console.log('Date range ');
			console.log(from);
			console.log(to);

			let employeesRecords = this.employees;

			let emps = '';
			employeesRecords.forEach(element => {
				emps += element.id + ',';
			});

			console.log('Payroll existing already ');
			console.log(emps);

			const filters = {
				'employee.id': { in: emps },
				status: { eq: 'approved' },
				from: { gt: from },
				to: { lt: to }
			};

			const bb = await this.$api.getItems('payroll', {
				fields: '*.*,employee.*',
				filters
			});

			const paryollData = bb.data;

			const filteredEMps = paryollData.filter(x => x.from >= from && x.to <= to);
			console.log('Pay roll data  ');
			console.log(paryollData);

			console.log('paydata already ');
			this.alreadyapprovedemps = filteredEMps;
			console.log('plet em go  ');

			this.showalert = false;
		},

		getBeginningOfMonth() {
			var today = new Date();
			var beginningOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
			beginningOfMonth.setDate(beginningOfMonth.getDate() + 1);
			var begin = beginningOfMonth.toISOString().slice(0, 10);
			this.fromDate = begin;
		},

		getLastDayOfMonth() {
			var today = new Date();
			let nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
			let lastDay = new Date(nextMonth - 1);
			this.toDate = lastDay.toISOString().slice(0, 10);
		},

		getCurrentDateTime() {
			const now = new Date();
			// Format the date as yyyy-mm-ddThh:mm (required format for datetime-local input)
			return now.toISOString().slice(0, 16);
		},

		async savePayroll() {
			this.showalert = true;
			this.msgTitle = 'Information';
			this.msgDetail = 'Processing';

			let from = this.fromDate;
			let to = this.toDate;
			let earnings_and_deductions = this.earnings_and_deductions;
			let net_salary = this.netAmont;

			let branch = this.selectedBranch;

			let currency = this.employeeDetail.currency;

			let department = this.selectedDepartment;

			let employee = this.selectedEmployee;
			let status = 'approved';
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
				this.showalert = false;

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
			let employee = br.find(x => x.id == this.selectedEmployee);
			this.employeeDetail = employee;
			this.paymentstatus = this.alreadyPaid(employee) === true ? 'approved' : 'none';

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

		async fetchEmployees() {
			try {
				this.showalert = true;
				this.msgTitle = 'Information';
				this.msgDetail = 'Fetching Employees';

				console.log('Employees');
				const filter = {
					'department.id': { eq: this.selectedDepartment }
				};

				const dataR = await this.$api.getItems('employees', {
					fields: '*.*',
					filter
				});
				this.employees = dataR.data;

				console.log('belong to the new era ');
				this.getPayrolls();
				this.showalert = false;
			} catch (error) {}

			//getPayrolls
		},

		fetchDepartments() {
			this.showalert = true;
			this.msgTitle = 'Information';
			this.msgDetail = 'Fetching Departments';

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
					this.showalert = false;
				});
		},

		fetchBranches() {
			this.showalert = true;
			this.msgTitle = 'Information';
			this.msgDetail = 'Fetching Branches';

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
					this.showalert = false;
				});
		}
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

.lightbox {
	position: fixed;
	background: #eee;

	margin: auto;
	margin-left: 10%;
	width: 700px;
	height: 100px;

	border: 2px solid;
	font-size: 16px;
	padding: 20px;
}


</style>
