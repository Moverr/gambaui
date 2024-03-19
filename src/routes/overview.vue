<template>
	<div class="dashboard">
		<div class="overview">
			<h1>{{ message }}</h1>
			<div class="number-card">
				<div class="title-card">Head count</div>
				<div class="amount-card">345</div>
				<div class="percent-card">12 Increase</div>
			</div>

			<div class="number-card">
				<div class="title-card">New Hires</div>
				<div class="amount-card">14</div>
				<div class="percent-card">12 Increase</div>
			</div>

			<div class="number-card">
				<div class="title-card">Terminations</div>
				<div class="amount-card">03</div>
				<div class="percent-card">12 Increase</div>
			</div>

			<div class="number-card">
				<div class="title-card">Jobs</div>
				<div class="amount-card">12</div>
				<div class="percent-card">12 Increase</div>
			</div>
		</div>

		<div class="overview">
			<h1>{{ message }}</h1>
			<div class="number-card">
				<div class="title-card">Head count</div>
				<div class="amount-card">345</div>
				<div class="percent-card">12 Increase</div>
			</div>

			<div class="number-card">
				<div class="title-card">New Hires</div>
				<div class="amount-card">14</div>
				<div class="percent-card">12 Increase</div>
			</div>

			<div class="number-card">
				<div class="title-card">Terminations</div>
				<div class="amount-card">03</div>
				<div class="percent-card">12 Increase</div>
			</div>

			<div class="number-card">
				<div class="title-card">Jobs</div>
				<div class="amount-card">12</div>
				<div class="percent-card">12 Increase</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'Overvew',
	data() {
		return {
			message: 'Overview'
		};
	}
};
</script>

<style>
.overview {
	width: 100%;
	padding: 10px;
}

.overview h1 {
	font-size: 20px;
	letter-spacing: 0.1em;
	margin-bottom: 10px;
	margin-top: -60px;
	clear: both;
	margin-left: 10px;
}

.number-card {
	width: 232px;
	height: 100px;
	background: #eee;
	float: left;
	border-radius: 5px;
	margin-left: 10px;
	padding-top: 15px;
	padding-left: 10px;
	padding-right: 10px;
	padding-bottom: 15px;
	text-align: center;
	cursor: pointer;
}
.number-card .title-card {
	font-weight: 570;
	font-size: 12px;
	text-transform: uppercase;
	letter-spacing: 0.1em;
}

.number-card .amount-card {
	font-weight: bolder;
	font-size: 30px;
	text-transform: uppercase;
	letter-spacing: 0.1em;
}

.number-card .percent-card {
	font-weight: bolder;
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: green;
}
</style>
