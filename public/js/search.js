// Enhanced search functionality for Space Biology Dashboard
class SearchManager {
    constructor() {
        this.searchIndex = [];
        this.init();
    }

    async init() {
        await this.buildSearchIndex();
        this.setupSearchListeners();
    }

    async buildSearchIndex() {
        try {
            const response = await fetch('/api/experiments');
            const data = await response.json();
            
            this.searchIndex = data.experiments.map(exp => ({
                id: exp.id,
                title: exp.title,
                description: exp.description,
                organism: exp.organism,
                mission: exp.mission,
                year: exp.year,
                keyFindings: exp.keyFindings,
                keywords: [exp.organism, exp.mission, exp.organismCategory].filter(Boolean)
            }));
        } catch (error) {
            console.error('Error building search index:', error);
        }
    }

    setupSearchListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        if (searchInput) {
            // Real-time search with debounce
            let timeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });

            // Enter key support
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('searchInput');
                this.handleSearch(searchInput.value);
            });
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.clearSearch();
            return;
        }

        const results = this.searchIndex.filter(item =>
            this.matchItem(item, query.toLowerCase())
        );

        this.displaySearchResults(results, query);
        this.highlightSearchTerms(query);
    }

    matchItem(item, query) {
        const searchableFields = [
            item.title,
            item.description,
            item.organism,
            item.mission,
            item.keyFindings,
            ...item.keywords
        ];

        return searchableFields.some(field =>
            field && field.toString().toLowerCase().includes(query)
        );
    }

    displaySearchResults(results, query) {
        const container = document.getElementById('experimentsList');
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No experiments found for "${query}"</h3>
                    <p>Try different keywords or check your spelling</p>
                </div>
            `;
            return;
        }

        // Show search summary
        const searchSummary = document.createElement('div');
        searchSummary.className = 'search-summary';
        searchSummary.innerHTML = `
            <p>Found ${results.length} experiment(s) matching "${query}"</p>
        `;
        
        container.parentNode.insertBefore(searchSummary, container);

        // Update dashboard to show filtered results
        if (window.dashboard) {
            window.dashboard.currentPage = 1;
            window.dashboard.loadExperiments(1, query);
        }
    }

    highlightSearchTerms(query) {
        const cards = document.querySelectorAll('.experiment-card');
        const terms = query.toLowerCase().split(' ').filter(term => term.length > 2);

        cards.forEach(card => {
            let cardText = card.textContent.toLowerCase();
            let hasMatch = terms.some(term => cardText.includes(term));

            if (hasMatch) {
                card.classList.add('search-highlight');
                setTimeout(() => {
                    card.classList.remove('search-highlight');
                }, 2000);
            }
        });
    }

    clearSearch() {
        const searchSummary = document.querySelector('.search-summary');
        if (searchSummary) {
            searchSummary.remove();
        }

        if (window.dashboard) {
            window.dashboard.currentPage = 1;
            window.dashboard.loadExperiments(1);
        }
    }

    // Advanced search with filters
    advancedSearch(filters) {
        return this.searchIndex.filter(item => {
            return Object.keys(filters).every(key => {
                if (!filters[key] || filters[key] === 'all') return true;
                
                const itemValue = item[key]?.toString().toLowerCase();
                const filterValue = filters[key].toString().toLowerCase();
                
                return itemValue === filterValue;
            });
        });
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
});

// Search utility functions
const SearchUtils = {
    // Fuzzy search implementation
    fuzzySearch(query, items, keys) {
        return items.filter(item => {
            return keys.some(key => {
                const value = item[key]?.toString().toLowerCase() || '';
                return this.fuzzyMatch(value, query.toLowerCase());
            });
        });
    },

    fuzzyMatch(text, pattern) {
        pattern = pattern.toLowerCase();
        let patternIdx = 0;
        
        for (let i = 0; i < text.length; i++) {
            if (text[i] === pattern[patternIdx]) {
                patternIdx++;
            }
            if (patternIdx === pattern.length) {
                return true;
            }
        }
        return false;
    },

    // Search result scoring
    scoreSearchResult(item, query) {
        let score = 0;
        const queryTerms = query.toLowerCase().split(' ');

        queryTerms.forEach(term => {
            if (item.title.toLowerCase().includes(term)) score += 10;
            if (item.keyFindings.toLowerCase().includes(term)) score += 5;
            if (item.description.toLowerCase().includes(term)) score += 3;
            if (item.organism.toLowerCase().includes(term)) score += 2;
            if (item.mission.toLowerCase().includes(term)) score += 1;
        });

        return score;
    }
};