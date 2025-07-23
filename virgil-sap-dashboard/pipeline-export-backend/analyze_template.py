#!/usr/bin/env python3

import boto3
import os
from dotenv import load_dotenv
from template_handler import TemplateHandler

def analyze_template(template_id):
    load_dotenv()
    
    # Download template from S3
    s3 = boto3.client('s3', 
                      aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                      aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                      region_name=os.getenv('AWS_REGION'))
    
    try:
        response = s3.get_object(Bucket='new-account-file-upload', 
                                Key=f'templates/{template_id}')
        
        with open('temp_template.pptx', 'wb') as f:
            f.write(response['Body'].read())
        
        # Analyze template
        handler = TemplateHandler('temp_template.pptx')
        
        print(f"\n=== Template Analysis: {template_id} ===")
        print(f"Total layouts: {len(handler.presentation.slide_layouts)}")
        
        for i, layout in enumerate(handler.presentation.slide_layouts):
            print(f"\nLayout {i}: {layout.name}")
            print(f"  Type: {layout.type}")
            print(f"  Shapes: {len(layout.shapes)}")
            
            # Analyze shapes and placeholders
            content_placeholders = 0
            title_placeholders = 0
            
            for j, shape in enumerate(layout.shapes):
                if hasattr(shape, 'placeholder_format'):
                    placeholder_type = shape.placeholder_format.type
                    if placeholder_type == 1:  # Title
                        title_placeholders += 1
                    elif placeholder_type == 2:  # Content
                        content_placeholders += 1
                    print(f"    Shape {j}: Placeholder type {placeholder_type}")
                elif hasattr(shape, 'text_frame'):
                    print(f"    Shape {j}: Text frame with '{shape.text_frame.text[:50]}...'")
                else:
                    print(f"    Shape {j}: Other shape type")
            
            print(f"  Title placeholders: {title_placeholders}")
            print(f"  Content placeholders: {content_placeholders}")
        
        # Clean up
        os.remove('temp_template.pptx')
        
    except Exception as e:
        print(f"Error analyzing template: {e}")

if __name__ == "__main__":
    # Analyze the most recent Organic template
    analyze_template('1753232308602_Organic_presentation.pptx') 