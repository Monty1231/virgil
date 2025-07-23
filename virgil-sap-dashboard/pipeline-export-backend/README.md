# PowerPoint Template Handler with python-pptx

This Python backend provides a clean, reliable approach to handling PowerPoint templates without complex style extraction. Instead of programmatically parsing and extracting styles from templates, it uses templates as-is and overlays content on existing slide layouts.

## Why This Approach?

### Problems with Style Extraction

- **Complex XML parsing** that can fail with different template formats
- **Inconsistent results** across different PowerPoint versions
- **Maintenance overhead** for handling edge cases
- **Performance issues** with large templates

### Benefits of Template-as-Is Approach

- **Reliability**: Uses python-pptx's proven template handling
- **Simplicity**: No complex style extraction logic
- **Flexibility**: Works with any PowerPoint template format
- **Performance**: Faster processing without XML parsing
- **Maintainability**: Less code to maintain and debug

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │───▶│  Python Backend  │───▶│  PowerPoint     │
│                 │    │  (FastAPI)       │    │  Template       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Features

### Template Management

- **Upload templates** (.pptx files up to 10MB)
- **List available templates** with metadata
- **Delete templates** from storage
- **Template information** and layout analysis

### Presentation Generation

- **Use templates as-is** without style extraction
- **Content overlay** on existing slide layouts
- **Automatic layout selection** based on slide type
- **Preserve template design** and formatting

### Slide Layout Support

- **Title slides** with title placeholders
- **Content slides** with body text placeholders
- **Section headers** for organization
- **Two-content layouts** for comparison slides
- **Custom layouts** for specialized content

## API Endpoints

### Template Management

#### List Templates

```http
GET /templates
```

#### Get Template Info

```http
GET /templates/{template_id}/info
```

#### Upload Template

```http
POST /templates/upload
Content-Type: multipart/form-data
```

#### Delete Template

```http
DELETE /templates/{template_id}
```

### Presentation Generation

#### Create Presentation

```http
POST /presentations/create
Content-Type: application/json

{
  "slides": [
    {
      "type": "title",
      "title": "Presentation Title",
      "content": "Subtitle or description",
      "order": 1
    },
    {
      "type": "content",
      "title": "Slide Title",
      "content": "Slide content with bullet points",
      "order": 2
    }
  ],
  "deck_config": {
    "deckName": "My Presentation",
    "presenterName": "John Doe",
    "presentationDate": "2024-01-15",
    "targetCompany": "Acme Corp",
    "additionalNotes": "Additional notes"
  },
  "template_id": "template_filename.pptx"
}
```

## Installation

### Prerequisites

- Python 3.11+
- PostgreSQL database
- AWS S3 bucket (for template storage)

### Setup

1. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

2. **Environment variables**:

   ```bash
   # Database
   DB_HOST=localhost
   DB_NAME=virgil
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_PORT=5432

   # AWS S3
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=virgil-files
   ```

3. **Run the server**:
   ```bash
   uvicorn template_api:app --host 0.0.0.0 --port 8000
   ```

### Docker

```bash
# Build image
docker build -t virgil-template-api .

# Run container
docker run -p 8000:8000 \
  -e DB_HOST=your_db_host \
  -e DB_NAME=virgil \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  -e S3_BUCKET_NAME=virgil-files \
  virgil-template-api
```

## Integration with Next.js

The Next.js app connects to this Python backend through a proxy API route:

```typescript
// src/app/api/export/powerpoint/python-template/route.ts
const pythonBackendUrl =
  process.env.PYTHON_TEMPLATE_API_URL || "http://localhost:8000";

// Forward requests to Python backend
const response = await fetch(`${pythonBackendUrl}/presentations/create`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(requestData),
});
```

## Template Processing Flow

1. **Template Upload**:

   - User uploads .pptx file
   - File stored in S3
   - Metadata stored in database

2. **Template Analysis**:

   - python-pptx loads template
   - Analyzes available slide layouts
   - Extracts basic template information

3. **Presentation Generation**:

   - Selects appropriate layout for each slide type
   - Creates new slides using template layouts
   - Fills content into placeholders
   - Preserves template styling

4. **Content Mapping**:
   - Title slides → Title placeholders
   - Content slides → Body text placeholders
   - Section headers → Section header placeholders

## Slide Type Mapping

| Slide Type               | Layout Type | Placeholder Usage     |
| ------------------------ | ----------- | --------------------- |
| `title`                  | Title       | Title placeholder     |
| `executive_summary`      | Content     | Body text placeholder |
| `current_state`          | Content     | Body text placeholder |
| `business_challenges`    | Content     | Body text placeholder |
| `recommended_solutions`  | Content     | Body text placeholder |
| `solution_details`       | Content     | Body text placeholder |
| `benefits_roi`           | Content     | Body text placeholder |
| `implementation_roadmap` | Content     | Body text placeholder |
| `investment_summary`     | Content     | Body text placeholder |
| `next_steps`             | Content     | Body text placeholder |

## Benefits Over Style Extraction

### Reliability

- **No XML parsing failures**: Uses python-pptx's robust template handling
- **Consistent results**: Same template always produces same output
- **Version compatibility**: Works with all PowerPoint versions

### Performance

- **Faster processing**: No complex style analysis
- **Lower memory usage**: Direct template usage
- **Scalable**: Can handle large templates efficiently

### Maintainability

- **Less code**: No complex style extraction logic
- **Fewer bugs**: Simpler codebase with fewer edge cases
- **Easier debugging**: Clear separation of concerns

### User Experience

- **Template fidelity**: Preserves exact template design
- **Predictable results**: Users know what to expect
- **Professional output**: Uses templates as designed

## Migration from Style Extraction

To migrate from the current style extraction approach:

1. **Update frontend** to use new Python backend endpoints
2. **Deploy Python backend** alongside existing Next.js app
3. **Test with existing templates** to ensure compatibility
4. **Gradually migrate** template processing to new system
5. **Remove old style extraction code** once migration is complete

## Future Enhancements

- **Template preview**: Show template layouts in UI
- **Layout customization**: Allow users to choose specific layouts
- **Batch processing**: Generate multiple presentations
- **Template validation**: Ensure templates are compatible
- **Performance optimization**: Caching and parallel processing
