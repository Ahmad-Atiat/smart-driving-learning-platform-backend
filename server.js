const dotenv = require('dotenv');

const connectDB = require('./config/db');
const app = require('./index');

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
    try {
        await connectDB();

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