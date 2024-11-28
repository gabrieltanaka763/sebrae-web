document.addEventListener("DOMContentLoaded", () => {
    const areaChartCanvas = document.getElementById("chart-area").getContext("2d");
    const subareaChartCanvas = document.getElementById("chart-subarea").getContext("2d");
    const contratacaoChartCanvas = document.getElementById("chart-contratacao").getContext("2d");
    const naturezaChartCanvas = document.getElementById("chart-natureza").getContext("2d");
    const portfolioChartCanvas = document.getElementById("chart-portfolio").getContext("2d");
    const menuItems = document.querySelectorAll(".menu-item");
    const areaFilter = document.getElementById("area-filter");
    const subareaFilter = document.getElementById("subarea-filter");
    const naturezaFilter = document.getElementById("natureza-filter");
    const formatoFilter = document.getElementById("formato-filter");
    const portfolioFilter = document.getElementById("portfolio-filter");
    const clearAllFiltersButton = document.getElementById("clear-all-filters");


    let rawData = [];
    let filteredData = [];
    let charts = {};

        
    fetch("corrigido_tabela_dados.json")
        .then(response => response.json())
        .then(data => {
            rawData = data;
            filteredData = data;

            populateFilters(data);
            updateCharts(data);
        })
        .catch(error => console.error("Erro ao carregar os dados:", error));

    function populateFilters(data) {
        populateSelect(areaFilter, "ÁREA", data, "Todas");
        populateSelect(subareaFilter, "SUBÁREA", data, "Todas");
        populateSelect(naturezaFilter, "NATUREZA DA PRESTAÇÃO DE SERVIÇO", data, "Todas");
        populateSelect(formatoFilter, "FORMA DA PRESTAÇÃO DO SERVIÇO", data, "Todos");
        populateSelect(portfolioFilter, "NOME DO PORTFOLIO", data, "Todos");
    }

    function populateSelect(selectElement, key, data, placeholder) {
        const selectedValue = selectElement.value || "";
        const items = [...new Set(data.map(item => item[key]))].sort();
        clearSelect(selectElement, placeholder);

        items.forEach(item => {
            const option = document.createElement("option");
            option.value = item;
            option.textContent = item;
            if (item === selectedValue) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });

        if (!selectedValue) {
            selectElement.value = "";
        }
    }

    function clearSelect(selectElement, placeholder) {
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    }

    function filterData() {
        const selectedArea = areaFilter.value;
        const selectedSubarea = subareaFilter.value;
        const selectedNatureza = naturezaFilter.value;
        const selectedFormato = formatoFilter.value;
        const selectedPortfolio = portfolioFilter.value;

        filteredData = rawData.filter(item => {
            const matchesArea = !selectedArea || item['ÁREA'] === selectedArea;
            const matchesSubarea = !selectedSubarea || item['SUBÁREA'] === selectedSubarea;
            const matchesNatureza = !selectedNatureza || item['NATUREZA DA PRESTAÇÃO DE SERVIÇO'] === selectedNatureza;
            const matchesFormato = !selectedFormato || item['FORMA DA PRESTAÇÃO DO SERVIÇO'] === selectedFormato;
            const matchesPortfolio = !selectedPortfolio || item['NOME DO PORTFOLIO'] === selectedPortfolio;

            return matchesArea && matchesSubarea && matchesNatureza && matchesFormato && matchesPortfolio;
        });

        updateDependentFilters();
        updateCharts(filteredData);
    }

    function updateDependentFilters() {
        populateSelect(areaFilter, "ÁREA", filteredData, "Todas");
        populateSelect(subareaFilter, "SUBÁREA", filteredData, "Todas");
        populateSelect(naturezaFilter, "NATUREZA DA PRESTAÇÃO DE SERVIÇO", filteredData, "Todas");
        populateSelect(formatoFilter, "FORMA DA PRESTAÇÃO DO SERVIÇO", filteredData, "Todos");
        populateSelect(portfolioFilter, "NOME DO PORTFOLIO", filteredData, "Todos");
    }

    function updateCharts(data) {
        updateChart("areaChart", areaChartCanvas, "bar", countBy(data, "ÁREA"), "Áreas");
        updateChart("subareaChart", subareaChartCanvas, "bar", countBy(data, "SUBÁREA"), "Subáreas");
        updateChart("portfolioChart", portfolioChartCanvas, "bar", countBy(data, "NOME DO PORTFOLIO"), "Portfólios");
        updateChart("contratacaoChart", contratacaoChartCanvas, "pie", countBy(data, "FORMA DA PRESTAÇÃO DO SERVIÇO"), "Formato de Prestação");
        updateChart("naturezaChart", naturezaChartCanvas, "pie", countBy(data, "NATUREZA DA PRESTAÇÃO DE SERVIÇO"), "Natureza de Prestação");
    }

    function countBy(data, key) {
        return data.reduce((acc, item) => {
            acc[item[key]] = (acc[item[key]] || 0) + 1;
            return acc;
        }, {});
    }

    function updateChart(chartName, canvas, type, counts, label) {
        if (charts[chartName]) {
            charts[chartName].destroy();
        }

        const isHorizontal = chartName === "portfolioChart";
        const config = {
            type: type,
            data: {
                labels: Object.keys(counts),
                datasets: [{
                    label: label,
                    data: Object.values(counts),
                    backgroundColor: Object.keys(counts).map(() => getRandomColor()),
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: type === "pie" },
                    tooltip: { enabled: true }
                },
                scales: {
                    x: { beginAtZero: true },
                    y: { beginAtZero: true }
                }
            }
        };

        if (isHorizontal) {
            config.options.indexAxis = 'y';
        }

        charts[chartName] = new Chart(canvas, config);
    }

    function getRandomColor() {
        return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    }

    document.querySelectorAll(".clear-filter-btn").forEach(button => {
        button.addEventListener("click", event => {
            const filterId = event.target.dataset.filter;
            const filterElement = document.getElementById(filterId);

            if (filterElement) {
                filterElement.value = "";
                filterData();
            }
        });
    });

    clearAllFiltersButton.addEventListener("click", () => {
        areaFilter.value = "";
        subareaFilter.value = "";
        naturezaFilter.value = "";
        formatoFilter.value = "";
        portfolioFilter.value = "";

        filteredData = rawData;
        updateDependentFilters();
        updateCharts(filteredData);
    });
    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            const link = item.getAttribute("data-link");
            if (link) {
                window.location.href = link; // Redireciona para o link correspondente
            }
        });
    });

    areaFilter.addEventListener("change", filterData);
    subareaFilter.addEventListener("change", filterData);
    naturezaFilter.addEventListener("change", filterData);
    formatoFilter.addEventListener("change", filterData);
    portfolioFilter.addEventListener("change", filterData);
});
