class Dashboard {
    constructor() {
        this.currentPage = 1;
        this.filters = {
            category: 'all',
            organism: 'all',
            yearFrom: '',
            yearTo: ''
        };
        this.stats = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadDashboardData();
        this.setupEventListeners();
        this.setupChartTemplates();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/check');
            const result = await response.json();
            
            if (!result.loggedIn) {
                window.location.href = '/';
                return;
            }
            
            // Show welcome message
            this.showNotification(`👨‍🚀 Welcome back, ${result.user.username}!`, 'success');
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/';
        }
    }

    async loadDashboardData() {
        try {
            // Load statistics
            const statsResponse = await fetch('/api/experiments/stats');
            this.stats = await statsResponse.json();
            this.updateStatsCards();
            this.updateCharts();

            // Load initial experiments
            await this.loadExperiments();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('🌐 Failed to load dashboard data');
        }
    }

    updateStatsCards() {
        if (!this.stats) return;

        const total = this.stats.byCategory.reduce((sum, cat) => sum + cat.count, 0);
        const plants = this.stats.byCategory.find(cat => cat._id === 'Plant')?.count || 0;
        const mammals = this.stats.byCategory.find(cat => cat._id === 'Mammal')?.count || 0;

        this.animateValue('totalExperiments', 0, total, 2000);
        this.animateValue('plantExperiments', 0, plants, 2000);
        this.animateValue('mammalExperiments', 0, mammals, 2000);
    }

    animateValue(elementId, start, end, duration) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value.toLocaleString();
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Add this method to the Dashboard class
displayAdminContent(adminContent) {
    if (!adminContent) return;

    const container = document.getElementById('experimentsList');
    if (!container) return;

    const adminHTML = `
        <div class="admin-content-card">
            <div class="admin-content-header">
                <div class="admin-badge">
                    <i class="fas fa-shield-alt"></i> NASA Knowledge Base
                </div>
                <span class="content-category">${adminContent.category}</span>
            </div>
            <h3 class="admin-content-title">${adminContent.title}</h3>
            <div class="admin-content-body">
                <p>${adminContent.content}</p>
            </div>
            <div class="admin-content-footer">
                <span class="content-source">
                    <i class="fas fa-database"></i> Official NASA Content
                </span>
            </div>
        </div>
    `;

    // Insert at the beginning of the experiments list
    container.insertAdjacentHTML('afterbegin', adminHTML);
}

// Update the loadExperiments method to handle admin content
async loadExperiments(page = 1, searchTerm = '') {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: 9,
            ...this.filters
        });

        if (searchTerm) {
            params.append('keyword', searchTerm);
        }

        const response = await fetch(`/api/experiments?${params}`);
        const data = await response.json();

        this.displayExperiments(data.experiments);
        
        // Display admin content if available
        if (data.adminContent && searchTerm) {
            this.displayAdminContent(data.adminContent);
        }
        
        this.updatePagination(data.totalPages, page);

    } catch (error) {
        console.error('Error loading experiments:', error);
        this.showError('🌐 Failed to load experiments');
    }
  }

    setupChartTemplates() {
        // Category chart (pie chart simulation)
        const categoryChart = document.getElementById('categoryChart');
        if (categoryChart) {
            categoryChart.innerHTML = this.createPieChart();
        }

        // Timeline chart (bar chart simulation)
        const timelineChart = document.getElementById('timelineChart');
        if (timelineChart) {
            timelineChart.innerHTML = this.createTimelineChart();
        }
    }

    createPieChart() {
        if (!this.stats?.byCategory) return '<div class="chart-loading">Loading chart...</div>';

        let total = this.stats.byCategory.reduce((sum, cat) => sum + cat.count, 0);
        let currentAngle = 0;
        let slices = '';

        const colors = ['#00f3ff', '#8a2be2', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];

        this.stats.byCategory.forEach((category, index) => {
            const angle = (category.count / total) * 360;
            const color = colors[index % colors.length];
            
            slices += `
                <div class="chart-slice" style="
                    --start-angle: ${currentAngle}deg;
                    --slice-angle: ${angle}deg;
                    --slice-color: ${color};
                "></div>
            `;
            currentAngle += angle;
        });

        return `
            <div class="pie-chart">
                ${slices}
                <div class="chart-center"></div>
            </div>
        `;
    }

    createTimelineChart() {
        if (!this.stats?.byYear) return '<div class="chart-loading">Loading chart...</div>';

        const years = this.stats.byYear.map(item => item._id);
        const counts = this.stats.byYear.map(item => item.count);
        const maxCount = Math.max(...counts);

        let bars = '';
        counts.forEach((count, index) => {
            const height = (count / maxCount) * 100;
            bars += `
                <div class="chart-bar-container">
                    <div class="chart-bar" style="height: ${height}%"></div>
                    <span class="chart-label">${years[index]}</span>
                </div>
            `;
        });

        return `<div class="bar-chart">${bars}</div>`;
    }

    updateCharts() {
        const categoryChart = document.getElementById('categoryChart');
        const timelineChart = document.getElementById('timelineChart');

        if (categoryChart) {
            categoryChart.innerHTML = this.createPieChart();
        }

        if (timelineChart) {
            timelineChart.innerHTML = this.createTimelineChart();
        }
    }

    async loadExperiments(page = 1, searchTerm = '') {
        try {
            const params = new URLSearchParams({
                page: page,
                limit: 9,
                ...this.filters
            });

            if (searchTerm) {
                params.append('keyword', searchTerm);
            }

            const response = await fetch(`/api/experiments?${params}`);
            const data = await response.json();

            this.displayExperiments(data.experiments);
            this.updatePagination(data.totalPages, page);

        } catch (error) {
            console.error('Error loading experiments:', error);
            this.showError('🌐 Failed to load experiments');
        }
    }

    displayExperiments(experiments) {
        const container = document.getElementById('experimentsList');
        if (!container) return;

        if (experiments.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No experiments found</h3>
                    <p>Try adjusting your search criteria or filters</p>
                </div>
            `;
            return;
        }

        container.innerHTML = experiments.map(exp => `
            <div class="experiment-card" data-id="${exp.id}">
                <div class="experiment-header">
                    <h3 class="experiment-title">${exp.title}</h3>
                    <span class="experiment-year">${exp.year}</span>
                </div>
                <div class="experiment-meta">
                    <span class="meta-tag">${exp.organism}</span>
                    <span class="meta-tag">${exp.mission}</span>
                    <span class="meta-tag">${exp.organismCategory}</span>
                </div>
                <p class="experiment-description">${exp.description}</p>
                <div class="experiment-findings">
                    <strong>Key Findings:</strong> ${exp.keyFindings}
                </div>
                <div class="experiment-footer">
                    <a href="${exp.dataLink}" target="_blank" class="experiment-link">
                        View Full Data <i class="fas fa-external-link-alt"></i>
                    </a>
                    <span class="experiment-duration">${exp.duration} days</span>
                </div>
            </div>
        `).join('');
    }

    updatePagination(totalPages, currentPage) {
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (pageInfo) {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        }

        if (prevBtn) {
            prevBtn.disabled = currentPage <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });
        }

        // Filter functionality
        const applyFiltersBtn = document.getElementById('applyFilters');
        const resetFiltersBtn = document.getElementById('resetFilters');

        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => this.resetFilters());
        }

        // Pagination
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');

        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => this.previousPage());
        }

        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => this.nextPage());
        }

        // Filter change listeners
        const categoryFilter = document.getElementById('categoryFilter');
        const organismFilter = document.getElementById('organismFilter');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.updateOrganismFilter();
            });
        }
    }

    async handleSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput.value.trim();
        
        this.currentPage = 1;
        await this.loadExperiments(this.currentPage, searchTerm);

        // Add search highlight animation
        if (searchTerm) {
            const cards = document.querySelectorAll('.experiment-card');
            cards.forEach(card => {
                if (card.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
                    card.classList.add('search-highlight');
                    setTimeout(() => card.classList.remove('search-highlight'), 2000);
                }
            });
        }
    }

    applyFilters() {
        const yearFrom = document.getElementById('yearFrom');
        const yearTo = document.getElementById('yearTo');
        const organismFilter = document.getElementById('organismFilter');

        this.filters.yearFrom = yearFrom.value;
        this.filters.yearTo = yearTo.value;
        this.filters.organism = organismFilter.value;

        this.currentPage = 1;
        this.loadExperiments(this.currentPage);
    }

    resetFilters() {
        this.filters = {
            category: 'all',
            organism: 'all',
            yearFrom: '',
            yearTo: ''
        };

        // Reset form elements
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('organismFilter').value = 'all';
        document.getElementById('yearFrom').value = '';
        document.getElementById('yearTo').value = '';
        document.getElementById('searchInput').value = '';

        this.currentPage = 1;
        this.loadExperiments(this.currentPage);
        
        this.showNotification('🔁 Filters reset successfully', 'success');
    }

    updateOrganismFilter() {
        const organismFilter = document.getElementById('organismFilter');
        if (organismFilter) {
            organismFilter.innerHTML = '<option value="all">All Organisms</option>';
            
            // Simulate category-specific organisms
            const organisms = {
                'Plant': ['Arabidopsis', 'Tomato', 'Rice', 'Wheat'],
                'Mammal': ['Mouse', 'Rat', 'Human'],
                'Insect': ['Drosophila', 'Bee'],
                'Microbe': ['E. coli', 'Yeast', 'Bacteria']
            };

            const selectedCategory = this.filters.category;
            if (selectedCategory !== 'all' && organisms[selectedCategory]) {
                organisms[selectedCategory].forEach(org => {
                    organismFilter.innerHTML += `<option value="${org}">${org}</option>`;
                });
            }
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadExperiments(this.currentPage);
        }
    }

    nextPage() {
        this.currentPage++;
        this.loadExperiments(this.currentPage);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `toast ${type}`;
        notification.innerHTML = `
            <div class="toast-content">
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});