const express = require('express');
const AdminContent = require('../models/AdminContent');
const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

// Get all admin content
router.get('/content', requireAdmin, async (req, res) => {
    try {
        const contents = await AdminContent.find().sort({ createdAt: -1 });
        res.json(contents);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add new admin content
router.post('/content', requireAdmin, async (req, res) => {
    try {
        const { keyword, title, content, category } = req.body;

        // Check if keyword already exists
        const existingContent = await AdminContent.findOne({ 
            keyword: keyword.toLowerCase() 
        });
        
        if (existingContent) {
            return res.status(400).json({ error: 'Keyword already exists' });
        }

        const newContent = new AdminContent({
            keyword: keyword.toLowerCase(),
            title,
            content,
            category: category || 'general',
            createdBy: req.session.user.username
        });

        await newContent.save();
        res.json({ success: true, content: newContent });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update admin content
router.put('/content/:id', requireAdmin, async (req, res) => {
    try {
        const { title, content, category, isActive } = req.body;
        
        const updatedContent = await AdminContent.findByIdAndUpdate(
            req.params.id,
            {
                title,
                content,
                category,
                isActive,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!updatedContent) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json({ success: true, content: updatedContent });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete admin content
router.delete('/content/:id', requireAdmin, async (req, res) => {
    try {
        const deletedContent = await AdminContent.findByIdAndDelete(req.params.id);
        
        if (!deletedContent) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json({ success: true, message: 'Content deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Search admin content (public endpoint)
router.get('/content/search/:keyword', async (req, res) => {
    try {
        const { keyword } = req.params;
        const content = await AdminContent.findOne({ 
            keyword: keyword.toLowerCase(),
            isActive: true
        });

        res.json(content);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;