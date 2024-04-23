<template>
	<div>

<div v-if="showalert"  class="lightbox">
    <h1>title</h1>
	<span> Processing .... </span>
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
					<select v-model="selectedDepartment" >
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
		 
				<button @click="fetchEmployees" class="button button-primary" type="button" style="margin-top:20px;">search</button>
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
			<div class=" " style="margin-top: 10px; margin-left:50px;">
				<table>
					<thead>
						<tr>
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

					<tbody  v-model="selectedEmployee">
						<tr 
							v-for="employee in employees"
							:key="employee.id"
							:value="employee.id"
							>
							 	<td>{{ employee.department.name }}</td>
							<td>{{ employee.position }}</td>
							<td>	{{ employee.first_name }}
							{{ employee.last_name }}
							</td>
							<td> - </td>
							<td v-model="fromDate" >{{fromDate}}</td>
							<td v-model="toDate">{{toDate}}</td>
							<td>	{{ employee.account_number }}</td>
							<td>  {{ employee.bank_name }}</td>
							<td> {{ employee.account_name }}</td>
							<td> - </td>
							<td> {{ employee.gross_salary }} {{ employee.currency }} </td> 
							<td>  {{ employee.ledger[1] }}  {{ employee.currency }}    </td>
							<td>  {{ employee.ledger[2] }}   {{ employee.currency }}   </td>
							<td> {{  (employee.gross_salary === undefined ? 0 : employee.gross_salary ) + employee.ledger[0] }} {{ employee.currency }}   </td>
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
			fromDate: this.getBeginningOfMonth(),
			toDate: this.getLastDayOfMonth(),
			ledgerDetails : undefined,
			showalert:false

		};
	},

 

	methods: {


 


//calculate the net amounts
calculateNetAmount(ledger) {
 

	console.log("Ledger");
	console.log(ledger[0]);
	
    let totalAmount = 0;
	let deductions = 0;
	let additions = 0;


	 
 

 

 for (let x = 0; x < ledger.length; x++) {
    const item = ledger[x];
    console.log("Item:", item);
    console.log("Inner bit and else:");
    
    const amountDetails = item.amount_details || [];
    console.log("Amount Details:", amountDetails);
    
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

		 

 
 

    console.log("Total Calculated Amount:", totalAmount);
    return [totalAmount,additions,deductions];
},

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


		getCurrentDateFromString(dateString) {
		
		
		const date = new Date(dateString);

		// Get year, month, and day
		const year = date.getFullYear();
		const month = date.getMonth() + 1; // Month is zero-based, so we add 1
		const day = date.getDate();

	     const formattedDate = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
 
			return formattedDate;
		},


//todo: fetch items from the back end and let me know if i have already paid

		async savePayroll() {
			
		 

			let from = this.getCurrentDateFromString(this.fromDate);
			let to = this.getCurrentDateFromString(this.toDate);

			let employeesRecords = this.employees;

			console.log(employeesRecords);

			employeesRecords.forEach(record => {
				console.log("record");
			console.log(record);
			
			try {
			let earnings_and_deductions = record.ledger[0];
			let net_salary =    (record.gross_salary === undefined ? 0 : record.gross_salary ) + record.ledger[0]  ;

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

		
			   this.$api.createItem('payroll', body);
				 

			

			} catch (error) {
				 console.log(error)
			} 
			finally{
				//this.$router.push('/hrsystem/collections/payroll');
			}

			});

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
		this.showalert = true;
        console.log('Employees');
        const filter = {
            'department.id': { eq: this.selectedDepartment }
        };

        const res = await this.$api.getItems('employees', {
            fields: '*.*',
            filter
        });

        const data = res.data;
        console.log(data);

        let emps = "";
        data.forEach(element => {
            emps += element.id + ",";
        });

        console.log('Payment Ledger');
        console.log(emps);
        
        const filters = {
            'employees.id': {in: emps },
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
		const empDetails = ledgerData.filter(entry => entry.employees.id === 73);
 
	
	//todo: calculate the 2 and get the data
	  console.log("..............WWWW>>>>>>>>>>>>>>>>>>>>>..");
	 console.log(empDetails);
		const ledgerDetails =  	this.calculateNetAmount(empDetails);
		const totalAmount = ledgerDetails[0] != undefined ?  ledgerDetails[0]  : 0;
		element.ledger = ledgerDetails;
		});
		
 

        this.employees = data;
		
    } catch (error) {
        console.error("Error fetching employees:", error);
    }
	finally{
		this.showalert = false;
	}
},


 

		fetchDepartments() {

			this.showalert = true;
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
		padding:10px;
		margin-left:5px;
		transition: color var(--fast) var(--transition);
		background:#eee;

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





.lightbox{
	position:fixed; 
	background:#eee;
	 


    margin: auto;
    margin-left: 10%;
    width: 700px;
    height: 100px;

	    border: 2px solid;
		font-size:16px;
		padding:20px;
}



</style>
