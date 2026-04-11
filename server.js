const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const seedAdmin = require('./seeds/seedAdmin');
const app = require('./index');

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
    try {
        await connectDB();
        await seedAdmin();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Swagger Docs: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();