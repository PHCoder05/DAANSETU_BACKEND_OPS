# Quick Start Guide for DAANSETU Backend

This guide will help you get the DAANSETU backend up and running with proper verification.

## Prerequisites

- Node.js 18.x or higher
- npm (Node Package Manager)
- MongoDB connection (local or cloud)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/PHCoder05/DAANSETU_BACKEND_OPS.git
cd DAANSETU_BACKEND_OPS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
# Required variables:
# - MONGODB_URI: Your MongoDB connection string
# - DB_NAME: Database name (default: daansetu)
# - JWT_SECRET: Secret key for JWT tokens
# - PORT: Server port (default: 3000)
```

### 4. Verify Setup

Before starting the application, run the verification script:

```bash
npm run verify
```

This will check:
- ✅ Node.js version compatibility
- ✅ All required dependencies
- ✅ Required directories and files
- ✅ Environment variables configuration
- ✅ Application module integrity

Expected output if everything is correct:
```
🎉 All checks passed! Application is ready to start.
Run "npm start" to start the application.
```

### 5. Start the Application

#### Development Mode
```bash
npm start
# or
npm run dev
```

#### Production Mode with Docker
```bash
docker-compose up -d
```

### 6. Verify Application is Running

Once started, you can verify the application is running by accessing:

- **Main Endpoint**: http://localhost:3000/
- **Health Check**: http://localhost:3000/health
- **API Documentation**: http://localhost:3000/api-docs

Example health check with curl:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-23T11:30:00.000Z"
}
```

## Troubleshooting

### Verification Fails

If `npm run verify` reports failures:

1. **Missing Dependencies**: Run `npm install`
2. **Missing .env file**: Copy from `.env.example`
3. **Invalid MongoDB URI**: Check your connection string in `.env`
4. **Missing files/directories**: Ensure all project files are present

### Application Won't Start

1. **Check MongoDB connection**: Ensure MongoDB is running and accessible
2. **Port already in use**: Change PORT in `.env` or kill the process using the port
3. **Missing environment variables**: Run `npm run verify` to identify missing configs

### MongoDB Connection Issues

If you see MongoDB connection errors:

```bash
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/daansetu

# For MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

## Testing

Run the test suite (which includes verification):

```bash
npm test
```

## Next Steps

After successful setup:

1. Review API documentation at `/api-docs`
2. Import the Postman collection (`DAANSETU.postman_collection.json`)
3. Test the endpoints using Postman or curl
4. Configure additional environment variables as needed

## Available Scripts

- `npm start` - Start the application
- `npm run dev` - Start in development mode
- `npm run verify` - Run verification checks only
- `npm test` - Run verification and tests

## Support

For issues or questions:
- Check the [main README.md](./README.md)
- Review [API documentation](http://localhost:3000/api-docs)
- Open an issue on GitHub

## Security Notes

- Never commit `.env` file to version control
- Use strong secrets for JWT_SECRET
- Regularly update dependencies: `npm audit fix`
- Review security alerts: `npm audit`
