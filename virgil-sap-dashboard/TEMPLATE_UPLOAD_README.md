# PowerPoint Template Upload Feature

## Overview

This feature allows users to upload PowerPoint templates (.pptx files) and use them as the base for generating presentations. The templates are stored on the server and can be selected when creating new presentations.

## Features

### Template Upload

- Upload .pptx files up to 10MB
- Automatic file validation (only .pptx files accepted)
- Unique filename generation to prevent conflicts
- Server-side storage in `/uploads/templates/` directory

### Template Management

- List all uploaded templates
- Delete templates
- Select templates for use in presentations
- Template metadata (name, upload date, file size)

### Template Integration

- Templates are used as styling guides for new presentations
- Font styles, colors, and sizes are extracted from templates
- Background colors and text colors are applied consistently
- Template selection is preserved during export

## API Endpoints

### POST `/api/export/powerpoint/template`

Upload a new PowerPoint template.

**Request:**

- Content-Type: `multipart/form-data`
- Body: Form data with `template` field containing the .pptx file

**Response:**

```json
{
  "success": true,
  "templateId": "1234567890_template_name.pptx",
  "originalName": "template_name.pptx",
  "size": 1024000
}
```

### GET `/api/export/powerpoint/template`

List all uploaded templates.

**Response:**

```json
{
  "templates": [
    {
      "id": "1234567890_template_name.pptx",
      "name": "template_name",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### DELETE `/api/export/powerpoint/template?id={templateId}`

Delete a template.

**Response:**

```json
{
  "success": true
}
```

## Frontend Integration

### Template Upload UI

The template upload interface is integrated into the deck configuration panel:

1. **Upload Section**: File input with upload button
2. **Template List**: Shows all available templates with selection
3. **Template Management**: Delete templates and view metadata

### Template Selection

- Templates are displayed in a scrollable list
- Selected template is highlighted
- Template name and upload date are shown
- Delete button for each template

### Export Integration

When exporting to PowerPoint, the selected template ID is included in the request:

```json
{
  "slides": [...],
  "deckConfig": {...},
  "background": {...},
  "templateId": "selected_template_id"
}
```

## File Storage

Templates are stored in the `uploads/templates/` directory with the following structure:

```
uploads/
  templates/
    1234567890_template_name.pptx
    1234567891_another_template.pptx
```

## Security Considerations

- File size limit: 10MB maximum
- File type validation: Only .pptx files accepted
- Filename sanitization: Special characters replaced with underscores
- Unique naming: Timestamp prefix prevents conflicts

## Usage Instructions

1. **Upload Template**:

   - Navigate to the Decks page
   - In the configuration panel, find "PowerPoint Template" section
   - Click "Choose File" and select a .pptx file
   - Click the upload button

2. **Select Template**:

   - After upload, the template appears in the "Available Templates" list
   - Click on a template to select it for use
   - Selected template is highlighted with a checkmark

3. **Use Template**:

   - Create slides (manual or AI-generated)
   - Export to PowerPoint
   - The selected template's styling will be applied to the presentation

4. **Delete Template**:
   - Click the trash icon next to any template
   - Template is permanently deleted from server

## Technical Implementation

### Template Parser

The `template-parser.ts` module handles template processing:

- Extracts styling information from templates
- Provides fallback styles if parsing fails
- Applies template styles to new presentations

### PowerPoint Export

The PowerPoint export route (`/api/export/powerpoint/route.ts`) has been updated to:

- Accept template ID in export requests
- Apply template styles to slides
- Use template fonts, colors, and sizes

### Frontend State Management

Template state is managed in the React component:

- `templates`: Array of available templates
- `selectedTemplate`: Currently selected template ID
- `isUploadingTemplate`: Upload progress indicator

## Future Enhancements

1. **Advanced Template Parsing**: Extract actual slide layouts and master slides
2. **Template Preview**: Show thumbnail previews of templates
3. **Template Categories**: Organize templates by type or company
4. **Template Sharing**: Allow sharing templates between users
5. **Template Versioning**: Track template versions and updates

## Testing

Use the in-app Decks page upload UI to verify template uploads and management:

1. Open the Decks page and upload a .pptx file
2. Confirm it appears in the Available Templates list
3. Delete a template and verify it disappears

Alternatively, you can call the Next.js API proxy to the Python backend:

- List: GET /api/export/powerpoint/python-template?action=list
- Info: GET /api/export/powerpoint/python-template?action=info&id={templateId}
- Upload (multipart/form-data with "template"): POST /api/export/powerpoint/python-template
- Delete: DELETE /api/export/powerpoint/python-template?id={templateId}

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check file size (must be < 10MB) and file type (.pptx only)
2. **Template Not Applied**: Ensure template is selected before export
3. **Template Not Found**: Verify template exists in `/uploads/templates/` directory
4. **Styling Issues**: Check that template file is not corrupted

### Debug Information

- Check browser console for upload errors
- Verify server logs for API errors
- Confirm file permissions on uploads directory
- Test with a simple PowerPoint file first
