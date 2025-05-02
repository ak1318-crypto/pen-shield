document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById("graphCanvas").getContext("2d");

    // Initial dataset with more months
    let labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let dataPoints = [10, 25, 14, 32, 20, 30, 28, 35, 22, 40, 38, 45];

    // Create the Chart
    const graphChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels.slice(0, 6), // Show only 6 months at a time
            datasets: [{
                label: "Activity Trends",
                data: dataPoints.slice(0, 6), // Show data for the first 6 months
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: "linear"
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Function to continuously update the graph
    function updateGraph() {
        // Remove first data point and label, and add a new one
        labels.push(labels.shift()); // Rotate months
        dataPoints.push(Math.floor(Math.random() * 50) + 10); // Generate random number between 10-50
        dataPoints.shift(); // Remove oldest data

        // Update the chart's data
        graphChart.data.labels = labels.slice(0, 6); // Keep showing 6 months at a time
        graphChart.data.datasets[0].data = dataPoints.slice(0, 6);

        // Refresh the chart
        graphChart.update();
    }

    // Update the graph every 2 seconds
    setInterval(updateGraph, 2000);
});
