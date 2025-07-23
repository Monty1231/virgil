#!/usr/bin/env python3
"""
FastAPI endpoint for PowerPoint template processing using python-pptx
"""

import os
import tempfile
import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from template_handler import TemplateHandler, process_template_request

# Load environment variables
load_dotenv()

app = FastAPI(title="PowerPoint Template API", version="1.0.0")

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'database': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'port': os.getenv('DB_PORT')
}

# S3 configuration
S3_CONFIG = {
    'aws_access_key_id': os.getenv('AWS_ACCESS_KEY_ID'),
    'aws_secret_access_key': os.getenv('AWS_SECRET_ACCESS_KEY'),
    'region_name': os.getenv('AWS_REGION', 'us-east-2'),
    'bucket_name': 'new-account-file-upload'
}

# Initialize S3 client
s3_client = boto3.client('s3', **{k: v for k, v in S3_CONFIG.items() if k != 'bucket_name'})

class SlideData(BaseModel):
    """Model for slide data"""
    type: str
    title: str
    content: str
    order: int

class PresentationRequest(BaseModel):
    """Model for presentation creation request"""
    slides: List[SlideData]
    deck_config: Dict[str, Any]
    template_id: Optional[str] = None

def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection failed: {e}")
        # Return None instead of raising exception to allow graceful fallback
        return None

def download_template_from_s3(s3_key: str) -> str:
    """Download template from S3 and return local file path"""
    try:
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pptx')
        temp_path = temp_file.name
        temp_file.close()
        
        # Download from S3
        s3_client.download_file(S3_CONFIG['bucket_name'], s3_key, temp_path)
        
        return temp_path
        
    except Exception as e:
        print(f"Failed to download template from S3: {e}")
        # Return None instead of raising exception
        return None

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "PowerPoint Template API"}

@app.get("/templates")
async def list_templates():
    """List available templates"""
    try:
        conn = get_db_connection()
        if not conn:
            # Return empty list if database is not available
            return {"templates": []}
            
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT id, filename, original_name, file_size, uploaded_at, s3_key
            FROM company_files 
            WHERE category = 'templates' 
            ORDER BY uploaded_at DESC
        """
        
        cursor.execute(query)
        templates = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "templates": [
                {
                    "id": template['filename'],
                    "name": template['original_name'].replace('.pptx', ''),
                    "uploadedAt": template['uploaded_at'].isoformat(),
                    "size": template['file_size'],
                    "s3Key": template['s3_key']
                }
                for template in templates
            ]
        }
        
    except Exception as e:
        print(f"Failed to list templates: {e}")
        # Return empty list instead of error
        return {"templates": []}
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass

@app.get("/templates/{template_id}/info")
async def get_template_info(template_id: str):
    """Get template information and available layouts"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get template info from database
        query = """
            SELECT s3_key, original_name 
            FROM company_files 
            WHERE filename = %s AND category = 'templates'
        """
        
        cursor.execute(query, (template_id,))
        template = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Download template from S3
        template_path = download_template_from_s3(template['s3_key'])
        
        if not template_path:
            raise HTTPException(status_code=500, detail="Failed to download template")
        
        try:
            # Load template and get info
            handler = TemplateHandler(template_path)
            if not handler.load_template():
                raise HTTPException(status_code=500, detail="Failed to load template")
            
            template_info = handler.get_template_info()
            available_layouts = handler.get_available_layouts()
            
            return {
                "template_info": template_info,
                "available_layouts": available_layouts,
                "original_name": template['original_name']
            }
            
        finally:
            # Clean up temporary file
            if template_path and os.path.exists(template_path):
                os.unlink(template_path)
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to get template info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get template info")

@app.post("/presentations/create")
async def create_presentation(request: PresentationRequest):
    """Create a presentation using a template"""
    try:
        template_path = None
        
        try:
            if request.template_id:
                # Get template from database
                conn = get_db_connection()
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                query = """
                    SELECT s3_key, original_name 
                    FROM company_files 
                    WHERE filename = %s AND category = 'templates'
                """
                
                cursor.execute(query, (request.template_id,))
                template = cursor.fetchone()
                
                cursor.close()
                conn.close()
                
                if not template:
                    raise HTTPException(status_code=404, detail="Template not found")
                
                # Download template from S3
                template_path = download_template_from_s3(template['s3_key'])
            else:
                # Use default template or create without template
                raise HTTPException(status_code=400, detail="Template ID is required")
            
            # Prepare slide data
            slides_data = []
            for slide in request.slides:
                slides_data.append({
                    'type': slide.type,
                    'title': slide.title,
                    'content': slide.content,
                    'order': slide.order
                })
            
            # Sort slides by order
            slides_data.sort(key=lambda x: x['order'])
            
            # Create output file
            output_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pptx')
            output_path = output_file.name
            output_file.close()
            
            # Process template and create presentation
            result = process_template_request(template_path, slides_data, output_path)
            
            if not result['success']:
                raise HTTPException(status_code=500, detail=result.get('error', 'Failed to create presentation'))
            
            # Return the file
            return FileResponse(
                path=output_path,
                filename=f"{request.deck_config.get('deckName', 'presentation')}.pptx",
                media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
            
        finally:
            # Clean up temporary files
            if template_path and os.path.exists(template_path):
                os.unlink(template_path)
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to create presentation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create presentation")

@app.post("/templates/upload")
async def upload_template(file: UploadFile = File(...)):
    """Upload a new template"""
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pptx'):
            raise HTTPException(status_code=400, detail="Only .pptx files are supported")
        
        # Validate file size (10MB limit)
        if file.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        # Read file content
        content = await file.read()
        
        # Generate unique filename
        import time
        timestamp = int(time.time() * 1000)
        filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
        s3_key = f"templates/{filename}"
        
        # Upload to S3
        s3_client.put_object(
            Bucket=S3_CONFIG['bucket_name'],
            Key=s3_key,
            Body=content,
            ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
        
        # Store in database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO company_files (
                filename, original_name, file_size, file_type, category, 
                file_path, s3_key, uploaded_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        cursor.execute(query, (
            filename,
            file.filename,
            file.size,
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "templates",
            f"/api/files/{s3_key}",
            s3_key,
            "NOW()"
        ))
        
        file_id = cursor.fetchone()[0]
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "templateId": filename,
            "originalName": file.filename,
            "size": file.size,
            "id": file_id,
            "s3Key": s3_key
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to upload template: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload template")

@app.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """Delete a template"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get template info
        query = """
            SELECT s3_key FROM company_files 
            WHERE filename = %s AND category = 'templates'
        """
        
        cursor.execute(query, (template_id,))
        template = cursor.fetchone()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Delete from S3
        try:
            s3_client.delete_object(
                Bucket=S3_CONFIG['bucket_name'],
                Key=template['s3_key']
            )
        except Exception as e:
            print(f"Failed to delete from S3: {e}")
            # Continue with database deletion
        
        # Delete from database
        delete_query = """
            DELETE FROM company_files 
            WHERE filename = %s AND category = 'templates'
        """
        
        cursor.execute(delete_query, (template_id,))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to delete template: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete template")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 