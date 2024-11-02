<template>
	<div>
		<div class="container position-sticky z-index-sticky top-0">
			<div class="row">
			  <div class="col-12">
				<!-- Navbar -->
				<nav class="navbar navbar-expand-lg blur blur-rounded top-0 z-index-3 shadow position-absolute my-3 py-2 start-0 end-0 mx-4">
				  <div class="container-fluid pe-0">
					<a class="navbar-brand font-weight-bolder ms-lg-0 ms-3 " href="../pages/dashboard.html">
					 Curly HR
					</a>
					 
					<div class="collapse navbar-collapse" id="navigation">
					  <ul class="navbar-nav mx-auto ms-xl-auto me-xl-7">
						<li class="nav-item">
						  <a class="nav-link d-flex align-items-center me-2 active" aria-current="page" href="../pages/dashboard.html">
							<i class="fa fa-chart-pie opacity-6 text-dark me-1"></i>
							About us
						  </a>
						</li>
						<li class="nav-item">
						  <a class="nav-link me-2" href="../pages/profile.html">
							<i class="fa fa-user opacity-6 text-dark me-1"></i>
							Jobs
						  </a>
						</li>
						
					  </ul>
					  <li class="nav-item d-flex align-items-center">
						<a class="btn btn-round btn-sm mb-0 btn-outline-primary me-2" target="_blank" href="#">Contact Us</a>
					  </li>
					  
					</div>
				  </div>
				</nav>
				<!-- End Navbar -->
			  </div>
			</div>
		  </div>
	
	
	<PublicView :heading="$t('reset_password')">
		<form v-if="resetMode === false && requestSent === false" @submit.prevent="onRequest">
			<project-chooser />

			<input v-model="email" v-focus type="email" :placeholder="$t('email')" required />
			<div class="buttons">
				<button type="submit" class="btn bg-gradient-info w-100 mt-4 mb-0" >{{ $t('reset') }}</button>
				<router-link to="/login" class="secondary">{{ $t('sign_in') }}</router-link>
			</div>
		</form>

		<template v-else-if="requestSent === true">
			<p>{{ $t('password_reset_sent') }}</p>
		</template>

		<form v-if="resetMode === true && resetDone === false" @submit.prevent="onReset">
			<project-chooser />

			<input v-model="password" type="password" :placeholder="$t('password')" required />

			<div class="buttons">
				<button type="submit">{{ $t('reset') }}</button>
			</div>
		</form>

		<template v-else-if="resetDone === true">
			<p>{{ $t('password_reset_successful') }}</p>
			<router-link to="/login">{{ $t('sign_in') }}</router-link>
		</template>

		<public-notice
			v-if="notice.text"
			slot="notice"
			:color="notice.color"
			:icon="notice.icon"
			:loading="requesting || resetting"
		>
			{{ notice.text }}
		</public-notice>
	</PublicView>
</div>
</template>

<script>
import PublicView from '@/components/public-view';
import ProjectChooser from '@/components/public/project-chooser';
import PublicNotice from '@/components/public/notice';
import { mapState } from 'vuex';
import axios from 'axios';

export default {
	name: 'ResetPassword',
	components: {
		PublicView,
		ProjectChooser,
		PublicNotice
	},
	data() {
		return {
			email: '',
			password: '',
			requesting: false,
			requestSent: false,
			resetting: false,
			resetDone: false,
			notice: {
				text: this.$t('not_authenticated'),
				color: 'blue-grey-100',
				icon: 'lock_outline'
			}
		};
	},
	computed: {
		...mapState(['currentProjectKey', 'apiRootPath']),
		resetMode() {
			return this.$route.query.token !== undefined;
		}
	},
	methods: {
		async onRequest() {
			this.requesting = true;
			const apiUrl = `${this.apiRootPath}${this.currentProjectKey}`;

			this.notice.text = this.$t('password_reset_sending');

			try {
				await axios.post(apiUrl + '/auth/password/request', {
					email: this.email
				});

				this.requestSent = true;
			} catch (error) {
				this.$events.emit('error', {
					notify: error.response?.data?.error?.message,
					error
				});
			} finally {
				this.requesting = false;
				this.notice.text = this.$t('not_authenticated');
			}
		},
		async onReset() {
			const body = {
				token: this.$route.query.token,
				password: this.password
			};

			this.requesting = true;
			const apiUrl = `${this.apiRootPath}${this.currentProjectKey}`;

			try {
				await axios.post(apiUrl + '/auth/password/reset', body);

				this.resetDone = true;
			} catch (error) {
				this.$events.emit('error', {
					notify: error.response?.data?.error?.message,
					error
				});
			} finally {
				this.resetting = false;
				this.notice.text = this.$t('not_authenticated');
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.project-chooser {
	margin-top: 32px;

	@media (min-height: 800px) {
		margin-top: 52px;
	}
}

form {
	margin-top: 52px;
}

button {
	position: relative;
	background-color: var(--darkest-gray);
	border: 2px solid var(--darkest-gray);
	border-radius: var(--border-radius);
	color: var(--white);
	width: 100%;
	height: 60px;
	max-width: 154px;
	padding: 18px 10px;
	font-size: 16px;
	font-weight: 400;
	transition: background-color var(--fast) var(--transition);

	&[disabled] {
		cursor: not-allowed;
	}

	&:not([disabled]) {
		&:hover {
			background-color: var(--darkest-gray);
			border-color: var(--darkest-gray);
		}
	}

	&.outline {
		background-color: transparent;
		color: var(--darkest-gray);

		&[disabled] {
			background-color: transparent;
		}

		&:not([disabled]) {
			&:hover {
				background-color: transparent;
			}
		}
	}
}

input {
	position: relative;
	width: 100%;
	margin-bottom: 32px;
	border: 0;
	font-size: 16px;
	border: 2px solid var(--blue-grey-100);
	width: 100%;
	padding: 20px 10px;
	color: var(--darker-gray);
	transition: border-color var(--fast) var(--transition);
	border-radius: var(--border-radius);

	&::placeholder {
		color: var(--light-gray);
	}

	&:-webkit-autofill {
		color: var(--darker-gray) !important;
		-webkit-text-fill-color: var(--darker-gray);
		-webkit-box-shadow: 0 0 0px 1000px var(--white) inset;
	}

	&:hover:not([disabled]) {
		transition: none;
		border-color: var(--gray);
		&:focus {
			border-color: var(--darker-gray);
		}
	}

	&[disabled] {
		cursor: not-allowed;
	}

	&:focus {
		outline: 0;
		border-color: var(--darker-gray);

		&:-webkit-autofill {
			color: var(--darker-gray) !important;
			-webkit-text-fill-color: var(--darker-gray);
			-webkit-box-shadow: 0 0 0px 1000px var(--white) inset;
		}
	}
}

p {
	font-size: 16px;
	line-height: 26px;
	margin-top: 32px;
	margin-bottom: 32px;
	color: var(--blue-grey-300);
}

.buttons {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 8px;
	.secondary {
		transition: color var(--fast) var(--transition);
		text-decoration: none;
		cursor: pointer;
		font-size: 16px;
		color: var(--input-placeholder-color);
		&:hover {
			color: var(--page-text-color);
		}
	}
}
</style>
