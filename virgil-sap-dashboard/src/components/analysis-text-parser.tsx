import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface AnalysisTextParserProps {
  analysisText: string;
}

export function AnalysisTextParser({ analysisText }: AnalysisTextParserProps) {
  // Parse the dense analysis text into sections
  const parseAnalysisText = (text: string) => {
    const sections: Record<string, string> = {};
    
    // Extract Executive Summary
    const execMatch = text.match(/EXECUTIVE SUMMARY\s*\n\s*(.*?)(?=\n\s*[A-Z\s]+:|\n\s*[A-Z\s]+\n|$)/s);
    if (execMatch) {
      sections.executiveSummary = execMatch[1].trim();
    }

    // Extract Business Challenges
    const challengesMatch = text.match(/BUSINESS CHALLENGES ADDRESSED\s*\n\s*(.*?)(?=\n\s*[A-Z\s]+:|\n\s*[A-Z\s]+\n|$)/s);
    if (challengesMatch) {
      sections.businessChallenges = challengesMatch[1].trim();
    }

    // Extract Solution Overview
    const solutionMatch = text.match(/SOLUTION OVERVIEW\s*\n\s*(.*?)(?=\n\s*[A-Z\s]+:|\n\s*[A-Z\s]+\n|$)/s);
    if (solutionMatch) {
      sections.solutionOverview = solutionMatch[1].trim();
    }

    // Extract Business Impact & ROI
    const impactMatch = text.match(/BUSINESS IMPACT & ROI\s*\n\s*(.*?)(?=\n\s*[A-Z\s]+:|\n\s*[A-Z\s]+\n|$)/s);
    if (impactMatch) {
      sections.businessImpact = impactMatch[1].trim();
    }

    // Extract Implementation Strategy
    const implementationMatch = text.match(/IMPLEMENTATION STRATEGY\s*\n\s*(.*?)(?=\n\s*[A-Z\s]+:|\n\s*[A-Z\s]+\n|$)/s);
    if (implementationMatch) {
      sections.implementationStrategy = implementationMatch[1].trim();
    }

    // Extract Competitive Advantages
    const competitiveMatch = text.match(/COMPETITIVE ADVANTAGES\s*\n\s*(.*?)(?=\n\s*[A-Z\s]+:|\n\s*[A-Z\s]+\n|$)/s);
    if (competitiveMatch) {
      sections.competitiveAdvantages = competitiveMatch[1].trim();
    }

    // Extract Conclusion
    const conclusionMatch = text.match(/CONCLUSION\s*\n\s*(.*?)(?=\n\s*[A-Z\s]+:|\n\s*[A-Z\s]+\n|$)/s);
    if (conclusionMatch) {
      sections.conclusion = conclusionMatch[1].trim();
    }

    return sections;
  };

  const sections = parseAnalysisText(analysisText);

  const formatBulletPoints = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•')) {
        return (
          <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded mb-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <span className="text-sm text-gray-700">{trimmed.substring(1).trim()}</span>
          </div>
        );
      }
      return <p key={index} className="text-gray-700 mb-2">{trimmed}</p>;
    });
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {sections.executiveSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {sections.executiveSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Business Challenges */}
      {sections.businessChallenges && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚠️ Business Challenges Addressed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {sections.businessChallenges}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Solution Overview */}
      {sections.solutionOverview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🛠️ Solution Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formatBulletPoints(sections.solutionOverview)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Impact & ROI */}
      {sections.businessImpact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Business Impact & ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formatBulletPoints(sections.businessImpact)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Implementation Strategy */}
      {sections.implementationStrategy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 Implementation Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formatBulletPoints(sections.implementationStrategy)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitive Advantages */}
      {sections.competitiveAdvantages && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Competitive Advantages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {sections.competitiveAdvantages}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conclusion */}
      {sections.conclusion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✅ Conclusion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {sections.conclusion}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 