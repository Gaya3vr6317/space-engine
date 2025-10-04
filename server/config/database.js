const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Try different MongoDB connection strings
        const connectionStrings = [
            'mongodb://127.0.0.1:27017/space_biology',
            'mongodb://localhost:27017/space_biology',
            'mongodb://0.0.0.0:27017/space_biology'
        ];

        let connected = false;
        
        for (let connString of connectionStrings) {
            try {
                console.log(`🔗 Attempting to connect to MongoDB: ${connString}`);
                await mongoose.connect(connString);
                console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
                console.log(`📊 Database: ${mongoose.connection.name}`);
                connected = true;
                break;
            } catch (err) {
                console.log(`❌ Failed to connect to: ${connString}`);
                if (err.message.includes('connect ECONNREFUSED')) {
                    console.log('💡 MongoDB is not running. Please start MongoDB service.');
                }
                continue;
            }
        }

        if (!connected) {
            console.log('\n🚨 MongoDB Connection Failed!');
            console.log('💡 Please make sure MongoDB is installed and running.');
            console.log('   On Windows: net start MongoDB');
            console.log('   On macOS: brew services start mongodb/brew/mongodb-community');
            console.log('   On Linux: sudo systemctl start mongod');
            console.log('\n📝 The app will run without database functionality.');
        }

    } catch (error) {
        console.error('❌ Database connection error:', error.message);
    }
};

module.exports = connectDB;