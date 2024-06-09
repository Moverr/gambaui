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
					@click="savePayroll"
					@input="save"
				/>
			</template>
		</v-header>

		<div class="inline-form " style="margin-top: 10px; margin-left:40px;">
			 
			 ccc
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
			 
		};
	},
	computed: {
	 	...mapState(['currentProjectKey'])
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
