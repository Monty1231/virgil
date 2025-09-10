import { type NextRequest, NextResponse } from "next/server";

interface Slide {
  id: number;
  title: string;
  content: string;
  type: string;
  order: number;
}

interface ExportRequest {
  slides: Slide[];
  deckConfig: {
    deckName: string;
    presenterName: string;
    presentationDate: string;
    targetCompany: string;
    additionalNotes: string;
  };
  templateId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if this is a file upload or presentation creation
    const contentType = request.headers.get("content-type");
    
    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload
      console.log("📤 Template upload request received");
      
      const formData = await request.formData();
      const file = formData.get("template") as File;
      
      if (!file) {
        return NextResponse.json(
          { error: "No template file provided" },
          { status: 400 }
        );
      }

      // Validate file type
      if (!file.name.toLowerCase().endsWith(".pptx")) {
        return NextResponse.json(
          { error: "Only .pptx files are supported" },
          { status: 400 }
        );
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size must be less than 10MB" },
          { status: 400 }
        );
      }

      // Get Python backend URL from environment
      const pythonBackendUrl = process.env.PYTHON_TEMPLATE_API_URL || "http://localhost:8000";

      // Forward the form data to Python backend
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch(`${pythonBackendUrl}/templates/upload`, {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Python backend upload error:", errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || errorData.error || "Python backend upload error");
        } catch {
          throw new Error(`Python backend upload error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log("✅ Template uploaded successfully via Python backend");
      return NextResponse.json(data);
      
    } else {
      // Handle presentation creation
      const body: ExportRequest = await request.json();
      const { slides, deckConfig, templateId } = body;

      console.log("🐍 Python template export request received");
      console.log("📄 Template ID:", templateId);
      console.log("📊 Slides count:", slides?.length);

      if (!slides || slides.length === 0) {
        return NextResponse.json(
          { error: "No slides provided" },
          { status: 400 }
        );
      }

      if (!templateId) {
        return NextResponse.json(
          { error: "Template ID is required" },
          { status: 400 }
        );
      }

    // Get Python backend URL from environment
    const pythonBackendUrl = process.env.PYTHON_TEMPLATE_API_URL || "http://localhost:8000";

    console.log("🔗 Connecting to Python backend:", pythonBackendUrl);

    // Prepare request for Python backend
    const pythonRequest = {
      slides: slides.map(slide => ({
        type: slide.type,
        title: slide.title,
        content: slide.content,
        order: slide.order
      })),
      deck_config: deckConfig,
      template_id: templateId
    };

    console.log("📤 Sending request to Python backend...");

    // Call Python backend
    const response = await fetch(`${pythonBackendUrl}/presentations/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pythonRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Python backend error:", errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || errorData.error || "Python backend error");
      } catch {
        throw new Error(`Python backend error: ${response.status} ${response.statusText}`);
      }
    }

    // Get the PowerPoint file from Python backend
    const pptxBuffer = await response.arrayBuffer();
    
    // Generate filename
    const filename = `${deckConfig.deckName || "presentation"}.pptx`;

    console.log("✅ PowerPoint generated successfully via Python backend");

    // Return the PowerPoint file
    return new NextResponse(pptxBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
    }
  } catch (error) {
    console.error("❌ Python template export failed:", error);
    return NextResponse.json(
      { 
        error: `Failed to export PowerPoint: ${
          error instanceof Error ? error.message : "Unknown error"
        }` 
      },
      { status: 500 }
    );
  }
}

// Proxy template management endpoints to Python backend
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const templateId = searchParams.get("id");

    const pythonBackendUrl = process.env.PYTHON_TEMPLATE_API_URL || "http://localhost:8000";

    let endpoint = "";
    if (action === "list") {
      endpoint = "/templates";
    } else if (action === "info" && templateId) {
      endpoint = `/templates/${templateId}/info`;
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const response = await fetch(`${pythonBackendUrl}${endpoint}`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Python backend error:", errorText);
      throw new Error(`Python backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("❌ Template management failed:", error);
    return NextResponse.json(
      { 
        error: `Failed to manage templates: ${
          error instanceof Error ? error.message : "Unknown error"
        }` 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    const pythonBackendUrl = process.env.PYTHON_TEMPLATE_API_URL || "http://localhost:8000";

    const response = await fetch(`${pythonBackendUrl}/templates/${templateId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Python backend error:", errorText);
      throw new Error(`Python backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("❌ Template deletion failed:", error);
    return NextResponse.json(
      { 
        error: `Failed to delete template: ${
          error instanceof Error ? error.message : "Unknown error"
        }` 
      },
      { status: 500 }
    );
  }
} 