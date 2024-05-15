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
		<div> 
		
		<template>
  <div style=" margin-left: 5px;display:flex">
  &nbsp;Status
  <div class="radios">
    <label>
      <input type="radio" name="radio" v-model="selectedStatus" value="draft">
      Draft
    </label>
    <label>
      <input type="radio" name="radio" v-model="selectedStatus" value="declined">
      Declined
    </label>

	 <input type="radio" name="radio" v-model="selectedStatus" value="deleted">
      Deleted
    </label>


    <label>
      <input type="radio" name="radio" v-model="selectedStatus" value="paid">
      Paid
    </label>
    <label>
      <input type="radio" name="radio" v-model="selectedStatus" value="approved">
      Approved
    </label>
  </div>
  </div>
</template>


		</div>
			<div
				v-if="payroll !== ''"
				class=" display_window "
				style=" clear:both; display: block;  float: left; margin: 10px; margin-top: 15px; font-size: 20px; font-weight: 400;"
			>
				<div>From : {{ payroll.from }}</div>
				<div>To : {{ payroll.to }}</div>
			</div>
		</div>
		<br />
		<div
			v-if="payroll !== ''"
			class="inline-form "
			style="margin-top: 10px; margin-left:40px;"
		>
			<form action="" method="post">
				<div class="  drop-down">
					<label for="">Branch : {{branchname}}</label>
				</div>

				 
			</form>
		</div>

		<div v-if="payroll.from !== ''">
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
							<th>EARNING AND DEDUCTION</th>
							<th>NET SALARY</th>
						</tr>
					</thead>

					<tbody v-model="payroll">
						<tr
							v-for="payslip in payroll.payslips"
							:key="payslip.id"
							:value="payslip.id"
						>
							<td>
								<button>Details </button>
							</td>
							<td>{{ payslip.payslip_id.department.name }}</td>
							<td>{{ payslip.payslip_id.employee.position }}</td>
							<td>
								{{ payslip.payslip_id.employee.first_name }}
								{{ payslip.payslip_id.employee.last_name }}
							</td>
							<td>-</td>
							<td v-model="fromDate">{{ payslip.payslip_id.from }}</td>
							<td v-model="toDate">{{ payslip.payslip_id.to }}</td>
							<td>{{ payslip.payslip_id.employee.account_number }}</td>
							<td>{{ payslip.payslip_id.employee.bank_name }}</td>
							<td>{{ payslip.payslip_id.employee.account_name }}</td>
							<td>-</td>
							<td>
								{{ payslip.payslip_id.employee.gross_salary }}
								{{ payslip.payslip_id.employee.currency }}
							</td>
							<td>
								{{ payslip.payslip_id.earnings_and_deductions }}
								{{ payslip.payslip_id.employee.currency }}
							</td>

							<td>
								{{ payslip.payslip_id.net_salary }}
								{{ payslip.payslip_id.employee.currency }}
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
	name: 'PayrollItemEdit',
	mounted() {
		console.log('Primary Key:', this.primaryKey);
		this.fetchPayRoll(this.primaryKey);
	},

	props: {
		primaryKey: {
			type: null,
			required: true
		}
	},

	computed: {},

	data() {
		return {
			payroll: '',
			branchname:'',
			selectedStatus:'',
				showalert: false
		};
	},

	methods: {
		printPage() {
			window.print();
		},

		async savePayroll(){
		 
			this.showalert = true;
			this.msgTitle = 'Information';
			this.msgDetail = 'Processing';
			let id = this.primaryKey;

			const body = { status: this.selectedStatus };
 			
			const bd = await this.$api.updateItem("payrolls",id, body);

			this.showalert = false;
			this.$router.push('/hrsystem/collections/payrolls');
		},

		async fetchPayRoll(id) {
			try {
				this.showalert = true;
			this.msgTitle = 'Information';
			this.msgDetail = 'Processing';
				console.log('Payroll');

				const res = await this.$api.getItem('payrolls', id, {
					fields:
						'status.*,from.*,to.*,payslips.*,created_on.*,id,payslips.payslip_id.*,payslips.payslip_id.employee.*,payslips.payslip_id.branch.*,payslips.payslip_id.department.*'
				});

				const data = res.data;
 
				
				if(data.payslips.length > 0 ){
			 
					this.selectedStatus = data.status;
				 	this.branchname = data.payslips[0].payslip_id.branch.name;
				 
				}
				this.payroll = data; 
			} catch (error) {
				console.error('Error fetching employees:', error);
			} finally {
				this.showalert = false;
			}
		}
	},
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
	border-radius: 5px;
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
.radios{
	padding-left:15px;
}
.radios label{
	float:left;
	width:100px; 
	font-size:14px;
	cursor:pointer;
}
</style>
