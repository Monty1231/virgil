# Python Backend Integration Guide

This guide explains how to deploy and integrate the Python template handler backend with your existing Next.js application.

## Overview

The Python backend provides a more reliable approach to PowerPoint template handling using `python-pptx` instead of complex style extraction. It uses templates as-is and overlays content on existing slide layouts.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │───▶│  Python Backend  │───▶│  PowerPoint     │
│   (Port 3000)   │    │  (Port 8000)     │    │  Template       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites

- Python 3.11+
- PostgreSQL database
- AWS S3 bucket
- Docker (optional)

## Environment Configuration

### Next.js Environment Variables

Add these to your `.env.local` file:

```bash
# Python Template Backend
PYTHON_TEMPLATE_API_URL=http://localhost:8000

# Database (existing)
DATABASE_URL="postgresql://username:password@localhost:5432/virgil"

# AWS S3 (existing)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=virgil-files
```

### Python Backend Environment Variables

Create a `.env` file in the `pipeline-export-backend/` directory:

```bash
# Database
DB_HOST=localhost
DB_NAME=virgil
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=virgil-files
```

## Deployment Options

### Option 1: Local Development

1. **Start Python Backend**:

   ```bash
   cd pipeline-export-backend/
   pip install -r requirements.txt
   uvicorn template_api:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start Next.js App**:

   ```bash
   cd virgil-sap-dashboard/
   npm run dev
   ```

3. **Test Integration**:
   - Open http://localhost:3000/decks
   - Upload a PowerPoint template
   - Create slides and export to PowerPoint
   - Verify the Python backend is being used

### Option 2: Docker Deployment

1. **Build Python Backend Image**:

   ```bash
   cd pipeline-export-backend/
   docker build -t virgil-template-api .
   ```

2. **Run Python Backend Container**:

   ```bash
   docker run -d \
     --name virgil-template-api \
     -p 8000:8000 \
     -e DB_HOST=your_db_host \
     -e DB_NAME=virgil \
     -e DB_USER=postgres \
     -e DB_PASSWORD=your_password \
     -e AWS_ACCESS_KEY_ID=your_key \
     -e AWS_SECRET_ACCESS_KEY=your_secret \
     -e S3_BUCKET_NAME=virgil-files \
     virgil-template-api
   ```

3. **Update Next.js Environment**:
   ```bash
   # In .env.local
   PYTHON_TEMPLATE_API_URL=http://localhost:8000
   ```

### Option 3: Production Deployment

1. **Deploy Python Backend**:

   ```bash
   # Using your preferred cloud provider (AWS, GCP, Azure)
   # Example for AWS ECS:
   aws ecs create-service \
     --cluster your-cluster \
     --service-name virgil-template-api \
     --task-definition virgil-template-api \
     --desired-count 1
   ```

2. **Update Environment Variables**:
   ```bash
   # In production .env.local
   PYTHON_TEMPLATE_API_URL=https://your-python-backend-domain.com
   ```

## Integration Features

### Frontend Toggle

The deck generation page now includes a toggle to switch between backends:

- **Python Backend**: Uses `python-pptx` for reliable template handling
- **Original Backend**: Uses the existing style extraction approach

### Template Management

- **Upload**: Templates are stored in S3 and metadata in PostgreSQL
- **List**: Shows available templates with metadata
- **Delete**: Removes templates from storage
- **Info**: Displays template layout information

### Export Process

1. **Template Selection**: User selects a PowerPoint template
2. **Content Preparation**: Slides are prepared with content
3. **Python Processing**: Template is loaded and content overlaid
4. **File Generation**: PowerPoint file is created and downloaded

## Testing

### Health Check

Test the Python backend is running:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "PowerPoint Template API"
}
```

### Template Upload Test

```bash
curl -X POST http://localhost:8000/templates/upload \
  -F "file=@test_template.pptx"
```

### Presentation Generation Test

```bash
curl -X POST http://localhost:8000/presentations/create \
  -H "Content-Type: application/json" \
  -d '{
    "slides": [
      {
        "type": "title",
        "title": "Test Presentation",
        "content": "Test content",
        "order": 1
      }
    ],
    "deck_config": {
      "deckName": "Test Deck",
      "presenterName": "Test User",
      "presentationDate": "2024-01-15",
      "targetCompany": "Test Company",
      "additionalNotes": ""
    },
    "template_id": "your_template_id.pptx"
  }'
```

## Monitoring

### Logs

Monitor Python backend logs:

```bash
# If running locally
tail -f pipeline-export-backend/logs/app.log

# If running in Docker
docker logs -f virgil-template-api
```

### Metrics

Key metrics to monitor:

- Template upload success rate
- Presentation generation time
- Error rates by endpoint
- Memory usage
- CPU usage

## Troubleshooting

### Common Issues

1. **Connection Refused**:

   - Check if Python backend is running on port 8000
   - Verify firewall settings
   - Check environment variables

2. **Template Upload Fails**:

   - Verify S3 credentials
   - Check file size limits (10MB)
   - Ensure file is .pptx format

3. **Database Connection Issues**:

   - Verify database credentials
   - Check network connectivity
   - Ensure database is running

4. **Presentation Generation Fails**:
   - Check template exists in database
   - Verify S3 access to template file
   - Review Python backend logs

### Debug Mode

Enable debug logging in Python backend:

```python
# In template_api.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Migration from Style Extraction

### Phase 1: Parallel Deployment

- Deploy Python backend alongside existing system
- Test with subset of users
- Monitor performance and reliability

### Phase 2: Gradual Migration

- Enable Python backend for new users
- Migrate existing templates
- Update documentation

### Phase 3: Complete Migration

- Disable original style extraction
- Remove old code
- Optimize performance

## Performance Considerations

### Python Backend

- **Memory**: ~100-200MB per request
- **CPU**: Moderate usage during template processing
- **Network**: S3 download/upload for templates

### Scaling

- **Horizontal**: Deploy multiple Python backend instances
- **Load Balancing**: Use reverse proxy (nginx, haproxy)
- **Caching**: Cache frequently used templates

## Security

### Network Security

- Use HTTPS in production
- Implement API authentication
- Restrict network access

### File Security

- Validate uploaded files
- Scan for malware
- Implement file size limits

### Data Security

- Encrypt sensitive data
- Use secure database connections
- Implement proper access controls

## Support

For issues or questions:

1. Check the logs for error messages
2. Verify environment configuration
3. Test with simple templates first
4. Review the Python backend documentation
