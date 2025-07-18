import { vectorDb, VectorSearchResult } from "./vector-db";
import { embeddingService, EmbeddingChunk } from "./embeddings";
import sql from "./db";

export interface SAPProduct {
  product_name: string;
  description: string;
  target_industries: string[];
  key_features: string[];
  benefits: string[];
  implementation_complexity: string;
  typical_roi: string;
  time_to_value: string;
  cost_range: string;
  use_cases: string[];
}

export interface IndustryContext {
  industry: string;
  challenges: string[];
  trends: string[];
  sap_solutions: string[];
  success_stories: string[];
  best_practices: string[];
}

export class KnowledgeBase {
  private static instance: KnowledgeBase;
  private initialized = false;

  static getInstance(): KnowledgeBase {
    if (!KnowledgeBase.instance) {
      KnowledgeBase.instance = new KnowledgeBase();
    }
    return KnowledgeBase.instance;
  }

  async initialize() {
    if (this.initialized) {
      console.log("Knowledge base already initialized, re-populating...");
      // Force re-population to ensure data is available
      await this.populateKnowledgeBase();
      return;
    }

    try {
      await vectorDb.initialize();

      // Always populate knowledge base to ensure data is available
      console.log(
        "Populating knowledge base with SAP products and industry data..."
      );
      await this.populateKnowledgeBase();
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing knowledge base:", error);
      throw error;
    }
  }

  private async populateKnowledgeBase() {
    console.log("Populating knowledge base...");

    const chunks: EmbeddingChunk[] = [];

    // Add SAP products from database
    const sapProducts = await this.getSAPProductsFromDB();
    for (const product of sapProducts) {
      const productChunks = this.createProductChunks(product);
      chunks.push(...productChunks);
    }

    // Add industry context
    const industryContexts = this.getIndustryContexts();
    for (const context of industryContexts) {
      const contextChunks = this.createIndustryChunks(context);
      chunks.push(...contextChunks);
    }

    // Add best practices and implementation guides
    const bestPractices = this.getBestPractices();
    for (const practice of bestPractices) {
      const practiceChunks = this.createBestPracticeChunks(practice);
      chunks.push(...practiceChunks);
    }

    // Add to vector database
    await vectorDb.upsertChunks(chunks);
    console.log(`Populated knowledge base with ${chunks.length} chunks`);
  }

  private async getSAPProductsFromDB(): Promise<SAPProduct[]> {
    try {
      const { rows } = await sql.query("SELECT * FROM sap_products");
      console.log("Found SAP products in DB:", rows.length);

      return rows.map((row) => {
        // Map database fields to expected interface
        const complexity =
          row.implementation_time_max > 12
            ? "High"
            : row.implementation_time_max > 6
            ? "Medium"
            : "Low";

        const costRange = `$${Number(
          row.base_price_range_min
        ).toLocaleString()}-$${Number(
          row.base_price_range_max
        ).toLocaleString()}`;
        const timeToValue = `${row.implementation_time_min}-${row.implementation_time_max} months`;

        // Generate key features based on product category
        const keyFeatures = this.generateKeyFeatures(
          row.product_category,
          row.product_name
        );
        const benefits = this.generateBenefits(
          row.product_category,
          row.product_name
        );
        const useCases = this.generateUseCases(
          row.product_category,
          row.product_name
        );

        return {
          product_name: row.product_name,
          description: row.description,
          target_industries: row.target_industries || [],
          key_features: keyFeatures,
          benefits: benefits,
          implementation_complexity: complexity,
          typical_roi: "15-25%",
          time_to_value: timeToValue,
          cost_range: costRange,
          use_cases: useCases,
        };
      });
    } catch (error) {
      console.error("Error fetching SAP products from DB:", error);
      return [];
    }
  }

  private generateKeyFeatures(category: string, productName: string): string[] {
    const features: Record<string, string[]> = {
      ERP: [
        "Real-time financial reporting and analytics",
        "Integrated business processes across modules",
        "Advanced planning and optimization",
        "Cloud-native architecture with scalability",
      ],
      CRM: [
        "360-degree customer view and insights",
        "Advanced lead and opportunity management",
        "Marketing automation and campaign management",
        "Sales forecasting and pipeline analytics",
      ],
      Analytics: [
        "Real-time business intelligence dashboards",
        "Advanced predictive analytics and AI",
        "Self-service reporting and data visualization",
        "Integration with multiple data sources",
      ],
      Procurement: [
        "End-to-end procurement process automation",
        "Supplier relationship management",
        "Spend analysis and optimization",
        "Contract lifecycle management",
      ],
      HR: [
        "Comprehensive talent management suite",
        "Performance and goal management",
        "Learning and development tracking",
        "Advanced workforce analytics",
      ],
      "E-commerce": [
        "Omnichannel commerce capabilities",
        "Personalized customer experiences",
        "Advanced inventory management",
        "Seamless payment and checkout processes",
      ],
      "Expense Management": [
        "Automated expense processing and approval",
        "Travel booking and management",
        "Policy compliance and enforcement",
        "Real-time expense analytics and reporting",
      ],
      Workforce: [
        "External workforce management",
        "Vendor management and compliance",
        "Project-based resource allocation",
        "Advanced analytics and reporting",
      ],
    };

    return (
      features[category] || [
        "Advanced business process automation",
        "Real-time analytics and reporting",
        "Cloud-native scalability and performance",
        "Comprehensive integration capabilities",
      ]
    );
  }

  private generateBenefits(category: string, productName: string): string[] {
    const benefits: Record<string, string[]> = {
      ERP: [
        "Streamlined business operations and reduced costs",
        "Improved decision-making with real-time insights",
        "Enhanced compliance and risk management",
        "Scalable growth and digital transformation",
      ],
      CRM: [
        "Increased customer satisfaction and retention",
        "Improved sales productivity and revenue growth",
        "Better marketing ROI and campaign effectiveness",
        "Enhanced customer insights and personalization",
      ],
      Analytics: [
        "Data-driven decision making and strategic insights",
        "Improved operational efficiency and performance",
        "Enhanced competitive intelligence and market analysis",
        "Real-time visibility into business metrics",
      ],
      Procurement: [
        "Reduced procurement costs and improved efficiency",
        "Enhanced supplier relationships and compliance",
        "Better spend visibility and control",
        "Streamlined procurement processes and workflows",
      ],
      HR: [
        "Improved talent acquisition and retention",
        "Enhanced employee engagement and productivity",
        "Better workforce planning and optimization",
        "Streamlined HR processes and compliance",
      ],
      "E-commerce": [
        "Increased online sales and customer engagement",
        "Improved customer experience and satisfaction",
        "Enhanced inventory management and fulfillment",
        "Seamless omnichannel commerce capabilities",
      ],
      "Expense Management": [
        "Reduced expense processing costs and time",
        "Improved policy compliance and control",
        "Enhanced travel management and booking",
        "Better expense visibility and analytics",
      ],
      Workforce: [
        "Improved external workforce management",
        "Enhanced vendor compliance and risk management",
        "Better resource allocation and project delivery",
        "Streamlined workforce processes and analytics",
      ],
    };

    return (
      benefits[category] || [
        "Improved operational efficiency and productivity",
        "Enhanced decision-making with data insights",
        "Reduced costs and increased ROI",
        "Better compliance and risk management",
      ]
    );
  }

  private generateUseCases(category: string, productName: string): string[] {
    const useCases: Record<string, string[]> = {
      ERP: [
        "Enterprise resource planning and management",
        "Financial accounting and reporting",
        "Supply chain and inventory management",
        "Manufacturing and production planning",
      ],
      CRM: [
        "Customer relationship management and sales",
        "Marketing automation and campaign management",
        "Customer service and support",
        "Lead and opportunity management",
      ],
      Analytics: [
        "Business intelligence and reporting",
        "Predictive analytics and forecasting",
        "Performance monitoring and dashboards",
        "Data visualization and insights",
      ],
      Procurement: [
        "Procurement and sourcing management",
        "Supplier relationship management",
        "Contract and spend management",
        "Procurement analytics and optimization",
      ],
      HR: [
        "Human capital management and HR processes",
        "Talent acquisition and recruitment",
        "Performance and goal management",
        "Learning and development",
      ],
      "E-commerce": [
        "Online retail and digital commerce",
        "B2B and B2C commerce platforms",
        "Omnichannel retail operations",
        "E-commerce analytics and optimization",
      ],
      "Expense Management": [
        "Travel and expense management",
        "Corporate card and expense processing",
        "Policy compliance and approval workflows",
        "Expense analytics and reporting",
      ],
      Workforce: [
        "External workforce and vendor management",
        "Project-based resource allocation",
        "Contingent workforce management",
        "Workforce analytics and optimization",
      ],
    };

    return (
      useCases[category] || [
        "Business process automation and optimization",
        "Data-driven decision making and analytics",
        "Digital transformation and modernization",
        "Operational efficiency and cost reduction",
      ]
    );
  }

  private createProductChunks(product: SAPProduct): EmbeddingChunk[] {
    const chunks: EmbeddingChunk[] = [];

    // Helper to sanitize product_name for ASCII-only Pinecone IDs
    const safeName = product.product_name
      .toLowerCase()
      .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dash
      .replace(/^-+|-+$/g, ""); // Trim leading/trailing dashes

    // Product overview chunk
    chunks.push({
      id: `sap-product-${safeName}-overview`,
      content: `SAP ${product.product_name}: ${
        product.description
      }. This product targets industries including ${product.target_industries.join(
        ", "
      )}.`,
      metadata: {
        type: "sap_product",
        product_name: product.product_name,
        category: "overview",
        industries: product.target_industries,
      },
    });

    // Features chunk
    if (product.key_features.length > 0) {
      chunks.push({
        id: `sap-product-${safeName}-features`,
        content: `Key features of SAP ${
          product.product_name
        }: ${product.key_features.join(". ")}.`,
        metadata: {
          type: "sap_product",
          product_name: product.product_name,
          category: "features",
        },
      });
    }

    // Benefits chunk
    if (product.benefits.length > 0) {
      chunks.push({
        id: `sap-product-${safeName}-benefits`,
        content: `Benefits of SAP ${
          product.product_name
        }: ${product.benefits.join(". ")}.`,
        metadata: {
          type: "sap_product",
          product_name: product.product_name,
          category: "benefits",
        },
      });
    }

    // Implementation chunk
    chunks.push({
      id: `sap-product-${safeName}-implementation`,
      content: `SAP ${product.product_name} implementation: Complexity is ${product.implementation_complexity}, typical ROI is ${product.typical_roi}, time to value is ${product.time_to_value}, and cost range is ${product.cost_range}.`,
      metadata: {
        type: "sap_product",
        product_name: product.product_name,
        category: "implementation",
        complexity: product.implementation_complexity,
        roi: product.typical_roi,
        time_to_value: product.time_to_value,
        cost_range: product.cost_range,
      },
    });

    return chunks;
  }

  private getIndustryContexts(): IndustryContext[] {
    return [
      {
        industry: "Financial Services",
        challenges: [
          "Regulatory compliance and reporting requirements",
          "Risk management and fraud detection",
          "Customer data security and privacy",
          "Legacy system integration",
          "Real-time transaction processing",
        ],
        trends: [
          "Digital transformation and fintech disruption",
          "AI and machine learning adoption",
          "Cloud migration and hybrid architectures",
          "Open banking and API integration",
          "Sustainability and ESG reporting",
        ],
        sap_solutions: [
          "SAP for Banking",
          "SAP S/4HANA Finance",
          "SAP Analytics Cloud",
          "SAP Customer Experience",
        ],
        success_stories: [
          "Major banks achieving 40% reduction in compliance costs",
          "Insurance companies improving claims processing by 60%",
          "Investment firms reducing risk assessment time by 70%",
        ],
        best_practices: [
          "Start with core financial modules",
          "Implement robust security and compliance frameworks",
          "Focus on data quality and governance",
          "Plan for regulatory changes and updates",
        ],
      },
      {
        industry: "Manufacturing",
        challenges: [
          "Supply chain complexity and disruption",
          "Quality control and compliance",
          "Inventory optimization",
          "Production planning and scheduling",
          "Equipment maintenance and downtime",
        ],
        trends: [
          "Industry 4.0 and smart manufacturing",
          "IoT and predictive maintenance",
          "Sustainability and circular economy",
          "Supply chain resilience",
          "Digital twin technology",
        ],
        sap_solutions: [
          "SAP S/4HANA Manufacturing",
          "SAP Ariba",
          "SAP Digital Supply Chain",
          "SAP Analytics Cloud",
        ],
        success_stories: [
          "Manufacturers reducing production costs by 25%",
          "Companies improving supply chain visibility by 80%",
          "Organizations reducing inventory carrying costs by 30%",
        ],
        best_practices: [
          "Implement end-to-end supply chain visibility",
          "Focus on predictive maintenance and IoT integration",
          "Standardize processes across global operations",
          "Invest in employee training and change management",
        ],
      },
      {
        industry: "Healthcare",
        challenges: [
          "Patient data security and HIPAA compliance",
          "Interoperability between systems",
          "Revenue cycle management",
          "Clinical workflow optimization",
          "Resource allocation and staffing",
        ],
        trends: [
          "Telehealth and remote care",
          "AI-powered diagnostics and treatment",
          "Value-based care models",
          "Patient engagement and experience",
          "Population health management",
        ],
        sap_solutions: [
          "SAP for Healthcare",
          "SAP S/4HANA",
          "SAP Analytics Cloud",
          "SAP Customer Experience",
        ],
        success_stories: [
          "Hospitals improving patient outcomes by 35%",
          "Healthcare systems reducing administrative costs by 40%",
          "Organizations improving revenue cycle efficiency by 50%",
        ],
        best_practices: [
          "Prioritize patient data security and compliance",
          "Focus on interoperability and system integration",
          "Implement evidence-based clinical workflows",
          "Invest in patient engagement and experience",
        ],
      },
    ];
  }

  private createIndustryChunks(context: IndustryContext): EmbeddingChunk[] {
    const chunks: EmbeddingChunk[] = [];

    // Industry overview
    chunks.push({
      id: `industry-${context.industry
        .toLowerCase()
        .replace(/\s+/g, "-")}-overview`,
      content: `${
        context.industry
      } industry overview: Key challenges include ${context.challenges
        .slice(0, 3)
        .join(", ")}. Current trends include ${context.trends
        .slice(0, 3)
        .join(", ")}.`,
      metadata: {
        type: "industry_context",
        industry: context.industry,
        category: "overview",
      },
    });

    // Challenges
    chunks.push({
      id: `industry-${context.industry
        .toLowerCase()
        .replace(/\s+/g, "-")}-challenges`,
      content: `${context.industry} challenges: ${context.challenges.join(
        ". "
      )}.`,
      metadata: {
        type: "industry_context",
        industry: context.industry,
        category: "challenges",
      },
    });

    // Solutions
    chunks.push({
      id: `industry-${context.industry
        .toLowerCase()
        .replace(/\s+/g, "-")}-solutions`,
      content: `SAP solutions for ${
        context.industry
      }: ${context.sap_solutions.join(", ")}.`,
      metadata: {
        type: "industry_context",
        industry: context.industry,
        category: "solutions",
      },
    });

    // Best practices
    chunks.push({
      id: `industry-${context.industry
        .toLowerCase()
        .replace(/\s+/g, "-")}-best-practices`,
      content: `Best practices for ${
        context.industry
      }: ${context.best_practices.join(". ")}.`,
      metadata: {
        type: "industry_context",
        industry: context.industry,
        category: "best_practices",
      },
    });

    return chunks;
  }

  private getBestPractices() {
    return [
      {
        title: "SAP Implementation Best Practices",
        content:
          "Successful SAP implementations require careful planning, executive sponsorship, change management, and phased rollouts. Key success factors include clear business objectives, stakeholder alignment, data quality preparation, and comprehensive training programs.",
        category: "implementation",
      },
      {
        title: "ROI Optimization Strategies",
        content:
          "To maximize SAP ROI, focus on process optimization, user adoption, data quality, and continuous improvement. Measure success through key performance indicators, user satisfaction, and business process efficiency gains.",
        category: "roi",
      },
      {
        title: "Change Management for SAP",
        content:
          "Effective change management is critical for SAP success. This includes communication plans, training programs, user support, and addressing resistance to change. Success depends on leadership commitment and employee engagement.",
        category: "change_management",
      },
    ];
  }

  private createBestPracticeChunks(practice: any): EmbeddingChunk[] {
    return [
      {
        id: `best-practice-${practice.category}`,
        content: `${practice.title}: ${practice.content}`,
        metadata: {
          type: "best_practice",
          category: practice.category,
          title: practice.title,
        },
      },
    ];
  }

  async searchRelevantContext(
    query: string,
    companyIndustry?: string,
    topK: number = 15
  ): Promise<VectorSearchResult[]> {
    const filter = companyIndustry
      ? { industries: { $in: [companyIndustry] } }
      : undefined;
    return await vectorDb.search(query, topK, filter);
  }

  async getSAPProductRecommendations(
    companyIndustry: string,
    challenges: string[]
  ): Promise<VectorSearchResult[]> {
    const query = `SAP solutions for ${companyIndustry} industry addressing ${challenges.join(
      ", "
    )}`;
    return await this.searchRelevantContext(query, companyIndustry, 10);
  }

  async getIndustryInsights(industry: string): Promise<VectorSearchResult[]> {
    const query = `industry trends challenges best practices ${industry}`;
    return await this.searchRelevantContext(query, industry, 8);
  }

  async getImplementationGuidance(
    productName: string
  ): Promise<VectorSearchResult[]> {
    const query = `implementation best practices ${productName} SAP`;
    return await this.searchRelevantContext(query, undefined, 5);
  }

  async getKnowledgeBaseStatus() {
    try {
      const stats = await vectorDb.getIndexStats();
      return {
        initialized: this.initialized,
        indexName: vectorDb.getIndexName(),
        totalVectorCount: 0, // Pinecone doesn't provide this in the stats
        dimension: stats.dimension,
        metric: stats.metric,
        status: stats.status,
      };
    } catch (error) {
      console.error("Error getting knowledge base status:", error);
      return {
        initialized: this.initialized,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Add company data to knowledge base (optimized for speed)
  async addCompanyToKnowledgeBase(companyId: number) {
    try {
      console.log(`Adding company ${companyId} to knowledge base...`);

      // Fetch company data
      const { rows: companies } = await sql.query(
        `SELECT * FROM companies WHERE id = $1`,
        [companyId]
      );

      if (companies.length === 0) {
        throw new Error(`Company ${companyId} not found`);
      }

      const company = companies[0];

      // Fetch company files (limit to first 3 files to avoid slow processing)
      const { rows: files } = await sql.query(
        `SELECT * FROM company_files WHERE company_id = $1 AND content_extracted = true LIMIT 3`,
        [companyId]
      );

      // Fetch company deals
      const { rows: deals } = await sql.query(
        `SELECT * FROM deals WHERE company_id = $1`,
        [companyId]
      );

      const chunks: EmbeddingChunk[] = [];

      // Company profile chunk (optimized content)
      chunks.push({
        id: `company-${companyId}-profile`,
        content: `Company: ${company.name} | Industry: ${
          company.industry
        } | Size: ${company.company_size} | Region: ${
          company.region
        } | Challenges: ${
          company.business_challenges || "Not specified"
        } | Systems: ${company.current_systems || "Legacy"} | Budget: ${
          company.budget || "Not specified"
        } | Timeline: ${company.timeline || "Flexible"}`,
        metadata: {
          type: "company_profile",
          company_id: companyId,
          company_name: company.name,
          industry: company.industry,
          company_size: company.company_size,
          region: company.region,
          category: "profile",
        },
      });

      // Business challenges chunk (only if substantial)
      if (
        company.business_challenges &&
        company.business_challenges.length > 20
      ) {
        chunks.push({
          id: `company-${companyId}-challenges`,
          content: `Business Challenges for ${company.name}: ${company.business_challenges}`,
          metadata: {
            type: "company_profile",
            company_id: companyId,
            company_name: company.name,
            industry: company.industry,
            category: "challenges",
          },
        });
      }

      // File content chunks (limited processing)
      for (const file of files.slice(0, 2)) {
        // Only process first 2 files
        if (
          file.file_content &&
          file.content_extracted &&
          file.file_content.length > 100
        ) {
          // Only process files with substantial content
          const fileChunks = this.splitFileContentOptimized(
            file.file_content,
            file.original_name,
            companyId
          );
          chunks.push(...fileChunks.slice(0, 5)); // Limit to 5 chunks per file
        }
      }

      // Deal pipeline chunk (only if deals exist)
      if (deals.length > 0) {
        const totalValue = deals.reduce(
          (sum, deal) => sum + (Number(deal.deal_value) || 0),
          0
        );
        const avgValue = totalValue / deals.length;

        chunks.push({
          id: `company-${companyId}-pipeline`,
          content: `Deal Pipeline for ${company.name}: ${
            deals.length
          } deals, total value $${totalValue.toLocaleString()}, average $${avgValue.toLocaleString()}. Stages: ${deals
            .map((d) => d.stage)
            .join(", ")}.`,
          metadata: {
            type: "company_profile",
            company_id: companyId,
            company_name: company.name,
            industry: company.industry,
            category: "pipeline",
            deal_count: deals.length,
            total_pipeline_value: totalValue,
          },
        });
      }

      // Add to vector database (batch operation)
      if (chunks.length > 0) {
        await vectorDb.upsertChunks(chunks);
        console.log(
          `Added ${chunks.length} chunks for company ${companyId} to knowledge base`
        );
      }

      return chunks.length;
    } catch (error) {
      console.error(
        `Error adding company ${companyId} to knowledge base:`,
        error
      );
      throw error;
    }
  }

  // Optimized file content splitting (smaller chunks, less overlap)
  private splitFileContentOptimized(
    content: string,
    fileName: string,
    companyId: number
  ): EmbeddingChunk[] {
    const chunks: EmbeddingChunk[] = [];
    const maxChunkSize = 500; // Smaller chunks for faster processing
    const overlap = 100; // Less overlap

    let start = 0;
    let chunkIndex = 0;

    while (start < content.length && chunkIndex < 10) {
      // Limit to 10 chunks max
      const end = Math.min(start + maxChunkSize, content.length);
      let chunk = content.slice(start, end);

      // Simple sentence boundary detection
      if (end < content.length) {
        const lastPeriod = chunk.lastIndexOf(".");
        if (lastPeriod > start + maxChunkSize * 0.6) {
          chunk = chunk.slice(0, lastPeriod + 1);
        }
      }

      if (chunk.trim().length > 30) {
        // Smaller minimum length
        chunks.push({
          id: `company-${companyId}-file-${fileName.replace(
            /[^a-zA-Z0-9]/g,
            "-"
          )}-${chunkIndex}`,
          content: `File: ${fileName}\n\n${chunk.trim()}`,
          metadata: {
            type: "company_file",
            company_id: companyId,
            file_name: fileName,
            category: "file_content",
            chunk_index: chunkIndex,
          },
        });
        chunkIndex++;
      }

      start = end - overlap;
    }

    return chunks;
  }

  // Remove company data from knowledge base
  async removeCompanyFromKnowledgeBase(companyId: number) {
    try {
      console.log(`Removing company ${companyId} from knowledge base...`);

      // Get all chunks for this company
      const companyChunks = await this.searchRelevantContext(
        "",
        undefined,
        1000
      );
      const companyChunkIds = companyChunks
        .filter((chunk) => chunk.metadata.company_id === companyId)
        .map((chunk) => chunk.id);

      if (companyChunkIds.length > 0) {
        await vectorDb.deleteChunks(companyChunkIds);
        console.log(
          `Removed ${companyChunkIds.length} chunks for company ${companyId} from knowledge base`
        );
      }

      return companyChunkIds.length;
    } catch (error) {
      console.error(
        `Error removing company ${companyId} from knowledge base:`,
        error
      );
      throw error;
    }
  }

  // Get similar companies
  async getSimilarCompanies(
    companyId: number,
    topK: number = 5
  ): Promise<VectorSearchResult[]> {
    try {
      // Get company profile
      const { rows: companies } = await sql.query(
        `SELECT * FROM companies WHERE id = $1`,
        [companyId]
      );

      if (companies.length === 0) {
        return [];
      }

      const company = companies[0];
      const query = `Company profile: ${company.industry} industry, ${
        company.company_size
      } company, ${company.business_challenges || "business challenges"}`;

      const results = await this.searchRelevantContext(
        query,
        company.industry,
        topK
      );

      // Filter out the same company and return only company profiles
      return results.filter(
        (result) =>
          result.metadata.type === "company_profile" &&
          result.metadata.company_id !== companyId
      );
    } catch (error) {
      console.error(`Error finding similar companies for ${companyId}:`, error);
      return [];
    }
  }

  // Utility: List SAP products and industry insights in Pinecone for a given industry
  async listIndustryKnowledge(industry: string) {
    // List SAP products
    const sapProducts = await vectorDb.search(
      `SAP solutions for ${industry}`,
      10,
      { industry, type: "sap_product" }
    );
    // List industry insights
    const insights = await vectorDb.search(
      `industry trends challenges best practices ${industry}`,
      10,
      { industry, type: "industry_context" }
    );
    return { sapProducts, insights };
  }

  // Re-embed all SAP products into Pinecone with latest metadata
  async reembedAllSAPProducts() {
    const sapProducts = await this.getSAPProductsFromDB();
    const chunks: EmbeddingChunk[] = [];
    for (const product of sapProducts) {
      const productChunks = this.createProductChunks(product);
      chunks.push(...productChunks);
    }
    await vectorDb.upsertChunks(chunks);
    console.log(`Re-embedded ${chunks.length} SAP product chunks to Pinecone`);
    return chunks.length;
  }
}

export const knowledgeBase = KnowledgeBase.getInstance();
