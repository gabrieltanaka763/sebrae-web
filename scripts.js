document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("table-body");
    const paginationInfo = document.getElementById("pagination-info");
    const firstPageButton = document.getElementById("first-page");
    const lastPageButton = document.getElementById("last-page");
    const prevPageButton = document.getElementById("prev-page");
    const nextPageButton = document.getElementById("next-page");
    const searchBar = document.getElementById("search-bar");
    const filterBtn = document.getElementById("filter-btn");
    const filterModal = document.getElementById("filter-modal");
    const closeBtn = document.querySelector(".close");
    const applyFiltersBtn = document.getElementById("apply-filters");
    const clearFiltersBtn = document.getElementById("clear-filters");
    const filterArea = document.getElementById("filter-area-checkboxes");
    const filterSubarea = document.getElementById("filter-subarea-checkboxes");
    const filterPortfolio = document.getElementById("filter-portfolio-checkboxes");
    const downloadButton = document.getElementById("download-btn");
    const menuItems = document.querySelectorAll(".menu-item");


    const selectedItemsContainer = document.getElementById("selected-items");

    const rowsPerPage = 25;
    let currentPage = 1;
    let data = [];
    let filteredData = [];

    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            const link = item.getAttribute("data-link");
            if (link) {
                window.location.href = link; // Redireciona para o link correspondente
            }
        });
    });
    downloadButton.addEventListener("click", () => {
        if (filteredData.length === 0) {
            alert("Nenhum dado para exportar.");
            return;
        }
    
        const headers = Object.keys(filteredData[0]);
        const rows = filteredData.map(row => headers.map(header => row[header]));
    
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");
    
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
    
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "dados_filtrados.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    // Carregar os dados do arquivo JSON
    fetch("corrigido_tabela_dados.json")
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData;
            filteredData = [...data]; // Inicializar com todos os dados
            populateFilters(data);
            renderTable(currentPage);
            updatePaginationInfo();
        })
        .catch(error => console.error("Erro ao carregar os dados:", error));

    // Preencher os filtros dinamicamente
    function populateFilters(data) {
        const areas = new Set();
        const subareas = new Map();
        const portfolios = new Set();

        data.forEach(row => {
            if (row['ÁREA']) areas.add(row['ÁREA']);
            if (row['NOME DO PORTFOLIO']) portfolios.add(row['NOME DO PORTFOLIO']);

            if (!subareas.has(row['ÁREA'])) {
                subareas.set(row['ÁREA'], new Set());
            }
            subareas.get(row['ÁREA']).add(row['SUBÁREA']);
        });

        populateCheckboxes('filter-area-checkboxes', Array.from(areas));
        populateCheckboxes('filter-subarea-checkboxes', Array.from(new Set(data.map(d => d['SUBÁREA']))));
        populateCheckboxes('filter-portfolio-checkboxes', Array.from(portfolios));

        window.subareasByArea = subareas;
    }

    applyFiltersBtn.addEventListener("click", () => {
        const selectedAreas = Array.from(
            document.querySelectorAll("#filter-area-checkboxes input:checked")
        ).map(checkbox => checkbox.value);
    
        const selectedSubareas = Array.from(
            document.querySelectorAll("#filter-subarea-checkboxes input:checked")
        ).map(checkbox => checkbox.value);
    
        const selectedPortfolios = Array.from(
            document.querySelectorAll("#filter-portfolio-checkboxes input:checked")
        ).map(checkbox => checkbox.value);
    
        // Filtrar os dados com base nos valores selecionados
        filteredData = data.filter(row => {
            const matchesArea = !selectedAreas.length || selectedAreas.includes(row['ÁREA']);
            const matchesSubarea = !selectedSubareas.length || selectedSubareas.includes(row['SUBÁREA']);
            const matchesPortfolio = !selectedPortfolios.length || selectedPortfolios.includes(row['NOME DO PORTFOLIO']);
    
            return matchesArea && matchesSubarea && matchesPortfolio;
        });
    
        // Atualizar a tabela e a paginação
        currentPage = 1;
        renderTable(currentPage);
        updatePaginationInfo();
    
        // Fechar o modal
        filterModal.style.display = "none";
    });

    clearFiltersBtn.addEventListener("click", () => {
        // Desmarcar todos os checkboxes de filtro
        ['filter-area-checkboxes', 'filter-subarea-checkboxes', 'filter-portfolio-checkboxes'].forEach(id => {
            const checkboxes = document.querySelectorAll(`#${id} input`);
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    
        // Resetar os dados filtrados para todos os dados
        filteredData = data;
    
        // Atualizar os filtros (preencher novamente as opções iniciais)
        populateFilters(data);
    
        // Renderizar a tabela com todos os dados
        currentPage = 1;
        renderTable(currentPage);
        updatePaginationInfo();
    
        // Atualizar a exibição dos itens selecionados no modal
        updateSelectedItemsDisplay();
    
        // Fechar o modal (opcional, caso necessário)
        filterModal.style.display = "none";
    });

    function populateCheckboxes(containerId, options) {
        const container = document.getElementById(containerId);
        container.innerHTML = "";

        options.sort().forEach(option => {
            const label = document.createElement("label");
            label.style.display = "block";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = option;

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(option));
            container.appendChild(label);
        });
    }

    // Atualizar sub-áreas dinamicamente com base nas áreas selecionadas
    filterArea.addEventListener("change", () => {
        const selectedAreas = Array.from(
            document.querySelectorAll('#filter-area-checkboxes input:checked')
        ).map(checkbox => checkbox.value);

        const filteredSubareas = new Set();

        selectedAreas.forEach(area => {
            const subareas = window.subareasByArea.get(area) || [];
            subareas.forEach(subarea => filteredSubareas.add(subarea));
        });

        if (selectedAreas.length > 0) {
            populateCheckboxes('filter-subarea-checkboxes', Array.from(filteredSubareas));
        } else {
            populateCheckboxes('filter-subarea-checkboxes', Array.from(new Set(data.map(d => d['SUBÁREA']))));
        }

        updateSelectedItemsDisplay();
    });

  function updateSelectedItemsDisplay() {
    selectedItemsContainer.innerHTML = ""; // Limpar a exibição anterior

    const selectedAreas = Array.from(
        document.querySelectorAll("#filter-area-checkboxes input:checked")
    ).map(checkbox => checkbox.value);

    const selectedSubareas = Array.from(
        document.querySelectorAll("#filter-subarea-checkboxes input:checked")
    ).map(checkbox => checkbox.value);

    const selectedPortfolios = Array.from(
        document.querySelectorAll("#filter-portfolio-checkboxes input:checked")
    ).map(checkbox => checkbox.value);

    if (selectedAreas.length > 0) {
        selectedItemsContainer.innerHTML += `<h3>Áreas Selecionadas:</h3><ul>${selectedAreas.map(area => `<li>${area}</li>`).join("")}</ul>`;
    }

    if (selectedSubareas.length > 0) {
        selectedItemsContainer.innerHTML += `<h3>Sub-áreas Selecionadas:</h3><ul>${selectedSubareas.map(subarea => `<li>${subarea}</li>`).join("")}</ul>`;
    }

    if (selectedPortfolios.length > 0) {
        selectedItemsContainer.innerHTML += `<h3>Portfólios Selecionados:</h3><ul>${selectedPortfolios.map(portfolio => `<li>${portfolio}</li>`).join("")}</ul>`;
    }
}

// Adicionando eventos de atualização para sub-áreas e portfólios
filterSubarea.addEventListener("change", updateSelectedItemsDisplay);
filterPortfolio.addEventListener("change", updateSelectedItemsDisplay);

    function renderTable(page) {
        tableBody.innerHTML = "";
        const start = (page - 1) * rowsPerPage;
        const end = Math.min(start + rowsPerPage, filteredData.length);
        const paginatedData = filteredData.slice(start, end);

        paginatedData.forEach(row => {
            const tableRow = document.createElement("tr");
            Object.values(row).forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                tableRow.appendChild(cell);
            });
            tableBody.appendChild(tableRow);
        });
    }

    function updatePaginationInfo() {
        const totalItems = filteredData.length;
        const startItem = (currentPage - 1) * rowsPerPage + 1;
        const endItem = Math.min(startItem + rowsPerPage - 1, totalItems);
        const totalPages = Math.ceil(totalItems / rowsPerPage);

        paginationInfo.textContent = `${startItem}-${endItem} de ${totalItems}`;

        firstPageButton.disabled = currentPage === 1;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages;
        lastPageButton.disabled = currentPage === totalPages;
    }
    filterBtn.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevenir propagação do evento
        filterModal.style.display = "block"; // Mostrar o modal
    });
    
    // Fechar o modal ao clicar no botão de fechar
    closeBtn.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevenir propagação do evento
        filterModal.style.display = "none"; // Ocultar o modal
    });
    
    // Fechar o modal ao clicar fora dele
    document.addEventListener("click", (event) => {
        if (event.target === filterModal) {
            filterModal.style.display = "none";
        }
    });
    document.addEventListener("DOMContentLoaded", () => {
        const menuItems = document.querySelectorAll(".menu-item");
    
        // Adiciona o evento de clique a cada item do menu
        menuItems.forEach(item => {
            item.addEventListener("click", () => {
                // Remove a classe 'active' de todos os itens
                menuItems.forEach(menu => menu.classList.remove("active"));
    
                // Adiciona a classe 'active' ao item clicado
                item.classList.add("active");
    
                // Redireciona o usuário para a página correspondente
                const link = item.getAttribute("data-link");
                if (link) {
                    window.location.href = link;
                }
            });
        });
    
        // Destacar o item ativo com base na URL atual
        const currentUrl = window.location.pathname;
        menuItems.forEach(item => {
            const link = item.getAttribute("data-link");
            if (link && currentUrl.includes(link)) {
                item.classList.add("active");
            }
        });
    });
    document.addEventListener("DOMContentLoaded", () => {
        const toggleMenuButton = document.getElementById("toggle-menu");
        const sidebar = document.querySelector(".sidebar");
    
        // Alternar o estado minimizado ao clicar no botão
        toggleMenuButton.addEventListener("click", () => {
            sidebar.classList.toggle("minimized");
    
            // Salvando o estado minimizado no armazenamento local para persistência
            const isMinimized = sidebar.classList.contains("minimized");
            localStorage.setItem("sidebarMinimized", isMinimized);
        });
    
        // Restaurar o estado minimizado com base no armazenamento local
        const savedState = localStorage.getItem("sidebarMinimized") === "true";
        if (savedState) {
            sidebar.classList.add("minimized");
        }
    });
});
