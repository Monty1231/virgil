export interface DiscoveryAnswers {
  industry: string;
  pains: string[];
  currentSystems?: string[];
  budgetRange?: string;
  timelineMonths?: number;
  region?: string;
  companySize?: string;
}

export interface RecommendationItem {
  productId: number;
  productName: string;
  description?: string;
  category?: string;
  fitScore: number; // 0-100
  roiPercentage?: number; // e.g., 150 means 150%
  paybackMonths?: number; // months to break even
  implementationMonths?: number;
  businessBenefits?: string[];
  technicalRequirements?: string;
}

export interface RoiSummary {
  estimatedBenefitUsd?: number;
  estimatedCostUsd?: number;
  roiPercentage?: number;
  paybackMonths?: number;
  assumptions?: string[];
}

export interface DiscoveryResult {
  recommendations: RecommendationItem[];
  roi?: RoiSummary;
} 