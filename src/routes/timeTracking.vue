<template>
	<div>
		<div v-if="showalert" class="lightbox">
			<h1>{{ msgTitle }}</h1>
			<span>{{ msgDetail }}</span>
		</div>

		<div>
			<v-header :icon-link="`/${currentProjectKey}/collections/time_tracking`" />
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
					@click="saveTimeTracker"
					@input="save"
				/>
			</template>
		</v-header>

		<div class="form " style="margin-top: 10px; margin-left:40px;">
			<div>
				<h1>TIME TRACKING</h1>
				<br />
			</div>
			<div>
				<template>
					<div style=" margin-left: 5px;display:flex">
						&nbsp;Status
						<div class="radios">
							<label v-if="draftStatus.create === 'full'">
								<input
									type="radio"
									name="radio"
									v-model="selectedStatus"
									value="draft"
								/>
								Draft
							</label>

							<label v-if="submitedStatus.create === 'full'">
								<input
									type="radio"
									name="radio"
									v-model="selectedStatus"
									value="submitted"
								/>
								Submitted
							</label>

							<label>
								<input
									type="radio"
									name="radio"
									v-model="selectedStatus"
									value="approved"
								/>
								Approved
							</label>
						</div>
					</div>
				</template>
				<br />
			</div>

			<div class="  drop-down">
				<label for="">Branch</label>
				<select v-model="selectedBranch" @change="fetchEmployees">
					<option value="" :selected="true">Select Option</option>
					<option v-for="branch in branches" :key="branch.id" :value="branch.id">
						{{ branch.name }}
					</option>
				</select>
			</div>

			<div class="  drop-down">
				<label for="">Employee</label>
				<select v-model="selectedEmployee" @change="handleEmployee">
					<option value="" :selected="true">Select Option</option>
					<option v-for="employee in employees" :key="employee.id" :value="employee.id">
						{{ employee.first_name }}
						{{ employee.last_name }}
					</option>
				</select>
			</div>

			<div class="  drop-down">
				<label for="">Type</label>
				<select v-model="checkinType">
					<option value="" :selected="true">Select Option</option>
					<option value="checkin">Check in</option>
					<option value="checkout">Check out</option>
				</select>
			</div>

			<div class="  drop-down">
				<label for="">Date</label>
				<input
					data-v-52275a91=""
					id="rFbG3QlJIF-date"
					type="date"
					autocomplete="on"
					name="rFbG3QlJIF-date"
					pattern=".*"
					placeholder=""
					spellcheck="true"
					step="1"
					class="test"
					v-model="ttdate"
				/>
			</div>

			<div class="  drop-down">
				<label for="">Time</label>
				<input
					data-v-52275a91=""
					id=""
					type="time"
					autocomplete="on"
					name=""
					pattern=".*"
					placeholder=""
					spellcheck="true"
					step="1"
					class="test"
					v-model="tttime"
				/>
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
import formatTitle from '@directus/format-title';
import VNotFound from './not-found.vue';
import store from '../store/';
import api from '../api';
import { mapState } from 'vuex';
import { mapValues, findIndex, find, merge, forEach, keyBy } from 'lodash';

export default {
	name: 'TimeTracking',
	mounted() {
		this.fetchPermissions();
		this.fetchBranches();
		this.getCurrentMonth();
		this.getCurrentDateTime();
	},

	data() {
		return {
			selectedBranch: '',
			statusColor: '',
			statusName: '',
			selectedStatus: null,
			submitedStatus: null,
			approvedStatus: null,
			declinedStatus: null,
			draftStatus: null,
			deleteStatus: null,
			createStatus: null,
			showalert: false,
			branches: [],
			collection: 'time_tracking',
			employees: [],
			selectedEmployee: '',
			checkinType: '',
			ttdate: this.getCurrentMonth(),
			tttime: null,
			saving: false,

			notFound: false,
			error: false,

			confirmRemove: false,
			confirmRemoveLoading: false,
			confirmBatchSave: false,

			confirmNavigation: false
		};
	},
	computed: {
		...mapState(['currentProjectKey']),
		newItem() {
			return this.primaryKey === '+';
		},
		batch() {
			return false;
			// this.primaryKey.includes(',');
		},
		activityDetail() {
			return this.collection === 'directus_activity';
		},
		activity() {
			return this.collection === 'directus_activity';
		},
		breadcrumbIcon() {
			if (this.collection === 'directus_webhooks') return 'arrow_back';
			return this.collectionInfo?.icon || 'box';
		},
		createLink() {
			if (this.collection === 'directus_webhooks') {
				return `/${this.currentProjectKey}/settings/webhooks/+`;
			}

			if (this.collection.startsWith('directus_')) {
				return `/${this.currentProjectKey}/${this.collection.substr(9)}/+`;
			}

			return `/${this.currentProjectKey}/collections/${this.collection}/+`;
		},
		breadcrumb() {
			if (this.collection === 'directus_users') {
				return [
					{
						name: this.$t('user_directory'),
						path: `/${this.currentProjectKey}/users`
					}
				];
			}

			if (this.collection === 'directus_webhooks') {
				return [
					{
						name: this.$t('settings'),
						path: `/${this.currentProjectKey}/settings`
					},
					{
						name: this.$t('settings_webhooks'),
						path: `/${this.currentProjectKey}/settings/webhooks`
					}
				];
			}

			if (this.collection === 'directus_files') {
				return [
					{
						name: this.$t('file_library'),
						path: `/${this.currentProjectKey}/files`
					}
				];
			}

			if (this.collection.startsWith('directus_')) {
				return [
					{
						name: this.$helpers.formatTitle(this.collection.substr(9)),
						path: `/${this.currentProjectKey}/${this.collection.substring(9)}`
					}
				];
			} else {
				return [
					{
						name: this.$tc('collection', 2),
						path: `/${this.currentProjectKey}/collections`
					},
					{
						name: this.$helpers.formatCollection(this.collection),
						path: `/${this.currentProjectKey}/collections/${this.collection}`
					}
				];
			}
		}
	},

	methods: {
		printPage() {},
		getCurrentMonth() {
			var today = new Date();
			const year = today.getFullYear();
			const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is zero-based
			const day = String(today.getDate()).padStart(2, '0');
			this.ttdate = `${month}/${day}/${year}`;
		},
		getCurrentDateTime() {
			var today = new Date();
			const year = today.getFullYear();
			const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is zero-based
			const day = String(today.getDate()).padStart(2, '0');

			let hours = today.getHours();
			const minutes = String(today.getMinutes()).padStart(2, '0');
			const seconds = String(today.getSeconds()).padStart(2, '0');
			const ampm = hours >= 12 ? 'PM' : 'AM';

			hours = hours % 12;
			hours = hours ? hours : 12; // The hour '0' should be '12'
			const strHours = String(hours).padStart(2, '0');

			this.tttime = `${day}/${month}/${year} ${strHours}:${minutes}:${seconds} ${ampm}`;
		},

		handleEmployee() {},
		async saveTimeTracker() {
			if (
				this.tttime === null ||
				this.ttdate === null ||
				this.selectedEmployee === null ||
				this.selectedStatus === null
			) {
				return alert('Enter all fields');
			}

			this.saving = true;

			const body = {
				time: this.tttime,
				date: this.ttdate,
				type: this.checkinType,
				employee: this.selectedEmployee,
				status: this.selectedStatus
			};

			this.saving = true;
			this.showalert = true;
			this.msgTitle = 'Information';
			this.msgDetail = 'Processing';

			const bd = await this.$api.createItem('time_tracking', body);
			this.$router.push('/hrsystem/collections/time_tracking');
			//	{"status":"submitted","employee":73,"type":"checkin","date":"2024-06-13","time":"14:39:19"}
		},
		async fetchBranches() {
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
		},

		async fetchEmployees() {
			try {
				this.alreadyapprovedemps = null;
				this.showalert = true;
				this.msgTitle = 'Information';
				this.msgDetail = 'Processing';

				const branch = this.selectedBranch;

				if (branch === '') return;

				console.log('Employees');

				let filter;

				filter = {
					'department.branch.id': { eq: branch },

					status: { eq: 'active' }
				};

				const res = await this.$api.getItems('employees', {
					fields: '*.*',
					filter
				});

				const data = res.data;

				console.log('..::..employeees .......................... ');
				console.log(data);
				console.log('..::..employeees .......................... ');

				this.employees = data;
			} catch (error) {
				console.error('Error fetching employees:', error);
			} finally {
				this.showalert = false;
			}
		},

		fetchPermissions() {
			console.log('zuma bill');
			let permissions = this.$store.state.permissions[this.collection];
			console.log('Permissions off payrrolls');
			console.log(permissions);

			//const {approved,submitted, declined} = permissions.statuses.approved.create;
			const { approved, submitted, declined, draft, deleted } = permissions.statuses;

			this.approvedStatus = approved;
			this.submitedStatus = submitted;
			this.declinedStatus = declined;
			this.draftStatus = draft;
			this.deleteStatus = deleted;
			this.createStatus = permissions.$create;
		},
		isSaveButtonEnabled() {
			return false;
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

.form {
	width: 100%;
	float: left;
	padding: 5px;
	padding-left: 15px;
}

.form .drop-down {
}

.form select,
.form input[type='date'],
.form input[type='time'] {
	padding: 10px;
	font-size: 14px;
	width: 80% !important;
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

.radios {
	padding-left: 15px;
}
.radios label {
	float: left;
	width: 100px;
	font-size: 14px;
	cursor: pointer;
}
</style>
