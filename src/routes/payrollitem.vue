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
					<select v-model="selectedDepartment">
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
					<button
						@click="fetchEmployees"
						class="button button-primary"
						type="button"
						style="margin-top:20px;"
					>
						Search
					</button>
				</div>

				<!-- 
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
				</div> -->
			</form>
		</div>

		<div>
			<div class="tabular-data" style="margin-top: 10px; margin-left:50px;">
				<table border="0">
					<thead>
						<tr>
							<th>
								.
							</th>

							<th>Deparment</th>
							<th>Position</th>
							<th>Name</th>
							<th>N/M</th>
							<th>Start</th>
							<th>END</th>
							<th>BANK ACCOUNT</th>
							<th>BANK NAME</th>
							<th>ACCOUNT NAME</th>
							<th>D/N</th>
							<th>GROSS SALARY</th>
							<th>BONUS</th>
							<th>DEDUCTIONS</th>
							<th>NET SALARY</th>
						</tr>
					</thead>

					<tbody v-model="selectedEmployee">
						<tr
							v-for="employee in employees"
							:key="employee.id"
							:value="employee.id"
							:class="{ 'already-paid': alreadyPaid(employee) }"
						>
							<td>
								<template v-if="alreadyPaid(employee)">
									<div style="color:green; font-weight:bold;">approved</div>
								</template>
								<template v-else>
									<button @click="removeItem(employee.id)">Remove</button>
								</template>
							</td>
							<td>{{ employee.department.name }}</td>
							<td>{{ employee.position }}</td>
							<td>
								{{ employee.first_name }}
								{{ employee.last_name }}
							</td>
							<td>-</td>
							<td v-model="fromDate">{{ fromDate }}</td>
							<td v-model="toDate">{{ toDate }}</td>
							<td>{{ employee.account_number }}</td>
							<td>{{ employee.bank_name }}</td>
							<td>{{ employee.account_name }}</td>
							<td>-</td>
							<td>{{ employee.gross_salary }} {{ employee.currency }}</td>
							<td>{{ employee.ledger[1] }} {{ employee.currency }}</td>
							<td>{{ employee.ledger[2] }} {{ employee.currency }}</td>
							<td>
								{{
									(employee.gross_salary === undefined
										? 0
										: employee.gross_salary) + employee.ledger[0]
								}}
								{{ employee.currency }}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
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
import VNotFound from './not-found.vue';
import store from '../store/';
import api from '../api';
import { mapState } from 'vuex';
import { mapValues, findIndex, find, merge, forEach, keyBy } from 'lodash';

export default {
	name: 'PayrollItem',
	mounted() {
		this.fetchBranches();
		this.getBeginningOfMonth();
		this.getLastDayOfMonth();
		this.getCurrentMonth();
	},

	computed: {
		isSelected: {
			get() {
				return this.selectedEmployee.includes('employeeId');
			},
			set(newValue) {
				if (newValue) {
					this.selectedEmployee.push('employeeId');
				} else {
					const index = this.selectedEmployee.indexOf('employeeId');
					if (index !== -1) {
						this.selectedEmployee.splice(index, 1);
					}
				}
			}
		}
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
			selectedMonth: '',
			ledgerDetails: undefined,
			showalert: false,
			alreadyapprovedemps: null,
			msgTitle: '',
			msgDetail: '',
			allSelected: false,
			selectedEmployee: []
		};
	},

	methods: {
		calculateMonthBounds() {
			if (!this.selectedMonth) return;
			const [year, month] = this.selectedMonth.split('-');
			const startDate = new Date(year, month - 1, 1);
			const endDate = new Date(year, month, 0); // Last day of selected month

			// Format the dates as needed
			const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
			this.fromDate = this.getCurrentDateFromString(
				startDate.toLocaleDateString('en-US', options)
			);
			this.toDate = this.getCurrentDateFromString(
				endDate.toLocaleDateString('en-US', options)
			);
		},
		removeItem(id) {
			const index = this.employees.findIndex(employee => employee.id === id);
			if (index !== -1) {
				this.employees.splice(index, 1);
			}
		},
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

		//calculate the net amounts
		calculateNetAmount(ledger) {
			console.log('Ledger');
			console.log(ledger[0]);

			let totalAmount = 0;
			let deductions = 0;
			let additions = 0;

			for (let x = 0; x < ledger.length; x++) {
				const item = ledger[x];
				console.log('Item:', item);
				console.log('Inner bit and else:');

				const amountDetails = item.amount_details || [];
				console.log('Amount Details:', amountDetails);

				for (const detail of amountDetails) {
					console.log('------------------------------------');
					console.log('Type:', detail.payment_ledger_detail_id.type);
					console.log('Amount:', detail.payment_ledger_detail_id.amount);
					console.log('------------------------------------');

					if (detail.payment_ledger_detail_id.type === 'increment') {
						totalAmount += parseFloat(detail.payment_ledger_detail_id.amount);
						additions += parseFloat(detail.payment_ledger_detail_id.amount);
					} else if (detail.payment_ledger_detail_id.type === 'decrement') {
						totalAmount -= parseFloat(detail.payment_ledger_detail_id.amount);
						deductions += parseFloat(detail.payment_ledger_detail_id.amount);
					}
				}
			}

			console.log('Total Calculated Amount:', totalAmount);
			return [totalAmount, additions, deductions];
		},

		getCurrentMonth() {
			var today = new Date();
			const year = today.getFullYear();
			const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is zero-based
			this.selectedMonth = `${year}-${month}`;
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

		getCurrentDateFromString(dateString) {
			const date = new Date(dateString);

			// Get year, month, and day
			const year = date.getFullYear();
			const month = date.getMonth() + 1; // Month is zero-based, so we add 1
			const day = date.getDate();

			const formattedDate = `${year}-${month < 10 ? '0' : ''}${month}-${
				day < 10 ? '0' : ''
			}${day}`;

			return formattedDate;
		},

		//todo: fetch items from the back end and let me know if i have already paid

		async getPaySlips() {
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

			console.log('Payslip existing already ');
			console.log(emps);

			const filters = {
				'employee.id': { in: emps },
				status: { eq: 'approved' },
				from: { gt: from },
				to: { lt: to }
			};

			const bb = await this.$api.getItems('payslip', {
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
		},

		async savePayroll() {
			this.showalert = true;
			this.msgTitle = 'Information';
			this.msgDetail = 'Processing';

			let from = this.getCurrentDateFromString(this.fromDate);
			let to = this.getCurrentDateFromString(this.toDate);

			let employeesRecords = this.employees;
			console.log('..........ssdmovers............');

			console.log(employeesRecords);
			//todo: filter all records from the pay ledger

			console.log(employeesRecords);

			//initialize the payslips array ::
			let payslips = [];

			for (const record of employeesRecords) {
				console.log('..........save payslip............');
				console.log(record);
				if (this.alreadyPaid(record) === false) {
					console.log(' find if payment already approved  ');

					console.log('record');
					console.log(record);

					try {
						let earnings_and_deductions = record.ledger[0];
						let net_salary =
							(record.gross_salary === undefined ? 0 : record.gross_salary) +
							record.ledger[0];

						let branch = this.selectedBranch;

						let currency = record.currency;

						let department = this.selectedDepartment;

						let empId = record.id;
						let status = 'approved';
						let basic_salary = record.gross_salary;

						const body = {
							basic_salary: basic_salary,
							earnings_and_deductions: earnings_and_deductions,
							net_salary: net_salary,
							branch: branch,
							currency: currency,
							department: department,
							employee: empId,
							from: from,
							to: to,
							status: status
						};

						const bd = await this.$api.updateOne('payslip', body); 
						payslips.push(bd.data);
						 
					} catch (error) {
						console.log(error);
					} finally {
						//this.$router.push('/hrsystem/collections/payroll');
					}
				}
			}
 
			if (payslips.length > 0) {
				//todo: add payslips to the addition

				let paylipObject = [];

				for (let i = 0; i < payslips.length; i++) {
					let payslipId = payslips[i].id; 
					let payslip = { payslip_id: { id: payslipId } };
					paylipObject.push(payslip);
				}

				console.log(paylipObject)

				const requestBody = {
					status: 'draft',
					from: from,
					to: to,
					payslips: paylipObject
				};

				const bd = await this.$api.createItem('payrolls', requestBody);
			}

			this.showalert = false;

			//todo: some missing information
			this.$router.push('/hrsystem/collections/payrolls');
		},
		printPage() {
			window.print();
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
					//	this.calculateNetAmount();
				})
				.catch(error => {
					console.log('Error impl');
					console.log(error);
					this.netAmont = null;
				});
		},

		async fetchEmployees() {
			try {
				this.alreadyapprovedemps = null;
				this.showalert = true;
				this.msgTitle = 'Information';
				this.msgDetail = 'Processing';

				let branch = this.selectedBranch;
				let department = this.selectedDepartment;

				if (branch === '') return;

				console.log('Employees');

				let filter;
				if (department !== '' && department !== undefined) {
					filter = {
						'department.id': { eq: department },
						'start_date': { lt: this.fromDate },
						status: { eq: 'active' }
					};
				} else {
					filter = {
						'department.branch.id': { eq: branch },
						'start_date': { lt: this.fromDate },
						status: { eq: 'active' }
					};
				}

				const res = await this.$api.getItems('employees', {
					fields: '*.*',
					filter
				});

				const data = res.data;
				console.log(data);

				let emps = '';
				data.forEach(element => {
					emps += element.id + ',';
				});

				console.log('Payment Ledger');
				console.log(emps);

				const filters = {
					'employees.id': { in: emps },
					from_date: { gte: this.fromDate },
					to_date: { lte: this.toDate }
				};

				const bb = await this.$api.getItems('payment_ledger', {
					fields: '*.*,amount_details.*,amount_details.payment_ledger_detail_id.*',
					filters
				});

				const ledgerData = bb.data;

				data.forEach(element => {
					const empDetailsArray = [];

					const empDetails = ledgerData.filter(entry => {
						return entry.employees != null && entry.employees.id === element.id;
					});

					//todo: calculate the 2 and get the data
					console.log('..............WWWW>>>>>>>>>>>>>>>>>>>>>..');
					console.log(empDetails);
					const ledgerDetails = this.calculateNetAmount(empDetails);
					const totalAmount = ledgerDetails[0] != undefined ? ledgerDetails[0] : 0;
					element.ledger = ledgerDetails;
				});

				this.employees = data;

				this.getPaySlips();
			} catch (error) {
				console.error('Error fetching employees:', error);
			} finally {
				this.showalert = false;
			}
		},

		fetchDepartments() {
			this.showalert = true;
			this.msgTitle = 'Information';
			this.msgDetail = 'Processing';

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
			console.log('Branches');
			console.log(this.$api);
			this.showalert = true;
			this.msgTitle = 'Information';
			this.msgDetail = 'Processing';

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

button {
	display: flex;
	align-items: center;
	padding: 2px 4px;
	color: var(--popover-text-color);
	padding: 10px;
	margin-left: 5px;
	transition: color var(--fast) var(--transition);
	background: #eee;

	&.disabled {
		color: var(--popover-text-color-disabled);
		cursor: not-allowed;
		i {
			color: var(--popover-text-color-disabled);
		}

		&:hover {
			background-color: transparent;
			color: var(--popover-text-color-disabled);
			i {
				color: var(--popover-text-color-disabled);
			}
		}
	}

	&:hover {
		color: var(--popover-text-color-hover);
		transition: none;
		i {
			color: var(--popover-text-color-hover);
			transition: none;
		}
	}
}

.lightbox {
	position: fixed;
	background: #eee;

	margin: auto;
	margin-left: 10%;
	width: 700px;
	height: 100px;

	border: 1px solid;
	border-radius:5px;
	font-size: 16px;
	padding: 20px;
}

.checkbox {
	height: 20px;
	width: 20px;
	cursor: pointer;
}
.tabular-data th {
	background: #eee;
	font-size: 12px;
}

.tabular-data td {
	font-size: 12px;
	background: #fff;
}
.tabular-data table {
	border: 0px;
	background: antiquewhite;
	border-radius: 10px 10px 0px 0px;
	border-top: 1px solid #eee;
}
</style>
