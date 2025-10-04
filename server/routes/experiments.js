const express = require('express');
const router = express.Router();
const AdminContent = require('../models/AdminContent');

// Sample data for testing
const sampleExperiments = [
    {
        id: 1,
        title: "Plant Habitat-01",
        description: "Study of Arabidopsis thaliana growth in microgravity",
        organism: "Arabidopsis",
        organismCategory: "Plant",
        mission: "ISS",
        year: 2018,
        keyFindings: "Plants exhibited normal growth patterns with slight morphological changes",
        dataLink: "https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=2032",
        principalInvestigator: "Dr. Anna-Lisa Paul",
        duration: 30
    },
    {
        id: 2,
        title: "Rodent Research-1",
        description: "Effects of microgravity on mammalian musculoskeletal system",
        organism: "Mouse",
        organismCategory: "Mammal",
        mission: "ISS",
        year: 2014,
        keyFindings: "Significant bone density loss and muscle atrophy observed",
        dataLink: "https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=2",
        principalInvestigator: "Dr. Michael Roberts",
        duration: 45
    },
    {
        id: 3,
        title: "Microbial Tracking-1",
        description: "Monitoring microbial changes in the ISS environment",
        organism: "Microbes",
        organismCategory: "Microbe",
        mission: "ISS",
        year: 2016,
        keyFindings: "Microbial diversity remains stable with some species showing adaptation",
        dataLink: "https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=1665",
        principalInvestigator: "Dr. Kasthuri Venkateswaran",
        duration: 180
    }
];

// Get all experiments
router.get('/', async (req, res) => {
    try {
        const { organism, category, yearFrom, yearTo, keyword, page = 1, limit = 10 } = req.query;
        
        let query = {};
        
        if (organism && organism !== 'all') query.organism = organism;
        if (category && category !== 'all') query.organismCategory = category;
        if (yearFrom || yearTo) {
            query.year = {};
            if (yearFrom) query.year.$gte = parseInt(yearFrom);
            if (yearTo) query.year.$lte = parseInt(yearTo);
        }
        if (keyword) {
            query.$text = { $search: keyword };
        }

        const experiments = await Experiment.find(query)
            .sort({ year: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Experiment.countDocuments(query);

        // Check for admin content if keyword search
        let adminContent = null;
        if (keyword) {
            adminContent = await AdminContent.findOne({
                keyword: keyword.toLowerCase(),
                isActive: true
            });
        }

        res.json({
            experiments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            adminContent: adminContent || null
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            byCategory: [
                { _id: 'Plant', count: 1 },
                { _id: 'Mammal', count: 1 },
                { _id: 'Microbe', count: 1 }
            ],
            byYear: [
                { _id: 2014, count: 1 },
                { _id: 2016, count: 1 },
                { _id: 2018, count: 1 }
            ],
            byOrganism: [
                { _id: 'Arabidopsis', count: 1 },
                { _id: 'Mouse', count: 1 },
                { _id: 'Microbes', count: 1 }
            ]
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;