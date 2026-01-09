import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { cache, CACHE_TTL } from '../config/redis.js';
import {
  CodeAnalysisRequest,
  AnalysisResult,
  AnalyzedIssue,
  FileAnalysis,
  ReviewSettings,
} from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

// Language detection based on file extension
const LANGUAGE_MAP: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',
  '.cs': 'csharp',
  '.cpp': 'cpp',
  '.c': 'c',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
};

export function detectLanguage(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf('.'));
  return LANGUAGE_MAP[ext] ?? 'unknown';
}

// Build the analysis prompt
function buildAnalysisPrompt(request: CodeAnalysisRequest): string {
  const { files, prContext, settings } = request;

  const categoriesText = settings.enabledCategories.join(', ');
  const filesContent = files
    .map((f) => `### File: ${f.filename} (${f.language})\n\`\`\`diff\n${f.patch}\n\`\`\``)
    .join('\n\n');

  return `You are an expert code reviewer. Analyze the following pull request changes and provide detailed feedback.

## Pull Request Context
- Title: ${prContext.title}
- Author: ${prContext.author}
- Description: ${prContext.description ?? 'No description provided'}

## Review Guidelines
- Focus on: ${categoriesText}
- Minimum severity to report: ${settings.severityThreshold}
- Be specific and actionable in your feedback
- Provide code suggestions when possible

## Files to Review
${filesContent}

## Response Format
Provide your analysis in the following JSON format:
{
  "summary": "A brief overall summary of the code quality and main findings",
  "issues": [
    {
      "filePath": "path/to/file.ts",
      "lineStart": 10,
      "lineEnd": 15,
      "severity": "critical|warning|info",
      "category": "security|performance|style|bug|best_practice|other",
      "title": "Brief issue title",
      "description": "Detailed explanation of the issue",
      "suggestion": "How to fix the issue with code example if applicable",
      "codeSnippet": "The problematic code snippet"
    }
  ]
}

Important:
- Only include issues that are present in the changed code (diff)
- Be precise with line numbers based on the diff context
- Prioritize critical issues over minor style suggestions
- Consider the overall context when reviewing
- Don't flag issues that are outside the scope of the changes`;
}

// Parse AI response into structured format
function parseAnalysisResponse(response: string): { summary: string; issues: AnalyzedIssue[] } {
  try {
    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('No JSON found in AI response');
      return { summary: 'Unable to parse AI response', issues: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      summary?: string;
      issues?: AnalyzedIssue[];
    };

    return {
      summary: parsed.summary ?? 'No summary provided',
      issues: parsed.issues ?? [],
    };
  } catch (error) {
    logger.error('Failed to parse AI response:', error);
    return { summary: 'Failed to parse AI analysis', issues: [] };
  }
}

// Main analysis function
export async function analyzeCode(request: CodeAnalysisRequest): Promise<AnalysisResult> {
  const startTime = Date.now();

  // Filter files based on settings
  const filteredFiles = filterFiles(request.files, request.settings);
  
  if (filteredFiles.length === 0) {
    return {
      summary: 'No files to analyze after applying filters',
      issues: [],
      metrics: {
        filesAnalyzed: 0,
        linesAnalyzed: 0,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  // Check cache
  const cacheKey = cache.generateKey(
    'analysis',
    hashFiles(filteredFiles),
    JSON.stringify(request.settings)
  );
  
  const cached = await cache.get<AnalysisResult>(cacheKey);
  if (cached) {
    logger.debug('Returning cached analysis result');
    return cached;
  }

  // Build prompt
  const prompt = buildAnalysisPrompt({
    ...request,
    files: filteredFiles,
  });

  try {
    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new AppError('No text response from AI');
    }

    const { summary, issues } = parseAnalysisResponse(textContent.text);

    // Calculate metrics
    const linesAnalyzed = filteredFiles.reduce(
      (acc, f) => acc + (f.patch?.split('\n').length ?? 0),
      0
    );

    const result: AnalysisResult = {
      summary,
      issues: filterIssuesBySeverity(issues, request.settings.severityThreshold),
      metrics: {
        filesAnalyzed: filteredFiles.length,
        linesAnalyzed,
        processingTimeMs: Date.now() - startTime,
      },
    };

    // Cache result
    await cache.set(cacheKey, result, CACHE_TTL.REVIEW_RESULT);

    return result;
  } catch (error) {
    logger.error('AI analysis failed:', error);
    throw new AppError('Failed to analyze code');
  }
}

// Filter files based on settings
function filterFiles(
  files: FileAnalysis[],
  settings: ReviewSettings
): FileAnalysis[] {
  return files.filter((file) => {
    // Check ignored files
    if (settings.ignoredFiles.includes(file.filename)) {
      return false;
    }

    // Check ignored patterns
    for (const pattern of settings.ignoredPatterns) {
      if (new RegExp(pattern).test(file.filename)) {
        return false;
      }
    }

    // Check language settings
    const langSettings = settings.languageSettings[file.language];
    if (langSettings && !langSettings.enabled) {
      return false;
    }

    // Check file size (estimate based on patch size)
    const patchSize = file.patch?.length ?? 0;
    const maxSize = langSettings?.maxFileSize ?? 100000;
    if (patchSize > maxSize) {
      return false;
    }

    return true;
  });
}

// Filter issues by severity threshold
function filterIssuesBySeverity(
  issues: AnalyzedIssue[],
  threshold: string
): AnalyzedIssue[] {
  const severityOrder = ['critical', 'warning', 'info'];
  const thresholdIndex = severityOrder.indexOf(threshold);

  return issues.filter((issue) => {
    const issueIndex = severityOrder.indexOf(issue.severity);
    return issueIndex <= thresholdIndex;
  });
}

// Simple hash for cache key
function hashFiles(files: FileAnalysis[]): string {
  const content = files.map((f) => `${f.filename}:${f.patch}`).join('|');
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Analyze a single file (for testing/debugging)
export async function analyzeSingleFile(
  filename: string,
  content: string,
  settings: Partial<ReviewSettings> = {}
): Promise<AnalyzedIssue[]> {
  const language = detectLanguage(filename);
  const defaultSettings: ReviewSettings = {
    enabledCategories: ['security', 'performance', 'style', 'bug', 'best_practice'],
    severityThreshold: 'info',
    ignoredFiles: [],
    ignoredPatterns: [],
    customRules: [],
    languageSettings: {},
    ...settings,
  };

  const result = await analyzeCode({
    files: [{ filename, patch: content, language }],
    language,
    prContext: {
      title: 'Single file analysis',
      description: null,
      author: 'system',
    },
    settings: defaultSettings,
  });

  return result.issues;
}
