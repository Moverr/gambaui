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

           

            <div class="chart-card">
              Attendance
                <div ref="attendance_bar_chart"></div>
            </div>

            <div class="chart-card">
                Average working hours
                <div ref="average_working_hours"></div>
            </div>

            
            <div class="chart-card">
                <h1>{{ attendance }}</h1>
                <div ref="chart"></div>
            </div>

           
           


        </div>
    </div>
</template>

<script>
import * as d3 from 'd3';

export default {
    name: 'Overvew',
    data() {
        return {
            message: 'Overview',
            attendance: 'Attendance',
            pieData: [
                { label: 'Category A', value: 30 },
                { label: 'Category B', value: 20 },
                { label: 'Category C', value: 50 }
            ],
            attendanceData: [
                { name: 'Monday', count: 30 },
                { name: 'Tuesday', count: 25 },
                { name: 'Wednesday', count: 35 },
                { name: 'Thursday', count: 40 },
                { name: 'Friday', count: 45 }
            ],
            lineData: [
                { date: '2024-03-01', value: 10 },
                { date: '2024-03-02', value: 15 },
                { date: '2024-03-03', value: 20 },
                { date: '2024-03-04', value: 18 },
                { date: '2024-03-05', value: 25 }
            ],
        };
    },
    methods: {
        lineGraph() {

            const container = this.$refs.average_working_hours;
            const margin = { top: 20, right: 20, bottom: 30, left: 50 };
            const width = 400 - margin.left - margin.right;
            const height = 300 - margin.top - margin.bottom;

            const svg = d3.select(container)
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            const x = d3.scaleTime()
                .domain(d3.extent(this.lineData, d => new Date(d.date)))
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain([0, d3.max(this.lineData, d => d.value)])
                .range([height, 0]);

            const line = d3.line()
                .x(d => x(new Date(d.date)))
                .y(d => y(d.value));

            svg.append('path')
                .datum(this.lineData)
                .attr('fill', 'none')
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 1.5)
                .attr('d', line);

            svg.append('g')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(x));

            svg.append('g')
                .call(d3.axisLeft(y));



        },
        barChart() {
            // Access the chart container using `this.$refs`
            const container = this.$refs.attendance_bar_chart;

            // Set the dimensions of the chart
            const margin = { top: 20, right: 20, bottom: 30, left: 40 };
            const width = 400 - margin.left - margin.right;
            const height = 300 - margin.top - margin.bottom;

            // Create the SVG element
            const svg = d3.select(container)
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // Create scales
            const x = d3.scaleBand()
                .range([0, width])
                .padding(0.1)
                .domain(this.attendanceData.map(d => d.name));

            const y = d3.scaleLinear()
                .range([height, 0])
                .domain([0, d3.max(this.attendanceData, d => d.count)]);

            // Add bars
            svg.selectAll('.bar')
                .data(this.attendanceData)
                .enter().append('rect')
                .attr('class', 'bar')
                .attr('x', d => x(d.name))
                .attr('width', x.bandwidth())
                .attr('y', d => y(d.count))
                .attr('height', d => height - y(d.count));

            // Add x-axis
            svg.append('g')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(x));

            // Add y-axis
            svg.append('g')
                .call(d3.axisLeft(y));

        },
        circleChart() {

            const container = this.$refs.chart;
            const width = 200;
            const height = 200;
            const radius = Math.min(width, height) / 2;

            const svg = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('transform', `translate(${width / 2},${height / 2})`);

            const color = d3.scaleOrdinal()
                .domain(this.pieData.map(d => d.label))
                .range(d3.schemeCategory10);

            const pie = d3.pie()
                .value(d => d.value);

            const arcs = pie(this.pieData);

            const arc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius);

            svg.selectAll('path')
                .data(arcs)
                .enter()
                .append('path')
                .attr('d', arc)
                .attr('fill', d => color(d.data.label));

            svg.selectAll('text')
                .data(arcs)
                .enter()
                .append('text')
                .attr('transform', d => `translate(${arc.centroid(d)})`)
                .attr('text-anchor', 'middle')
                .text(d => d.data.label);


        },
    },
    mounted() {
        // this.circleChart();
        this.barChart();
    this.lineGraph();

       
    },
};
</script>

<style>
.chart-card{
    float: left; width:450px;   padding: 10px;
    margin: 10px;
}
.bar {
    fill: steelblue;
}


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
