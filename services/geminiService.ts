
import { GoogleGenAI, Type } from "@google/genai";
import { Dataset, WidgetConfig, AIInsight, Language, ColumnMetadata, ClarifyingQuestion, BusinessQuestion, DataPoint, ChatResponse, DataIssue } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const profileFullData = (dataset: Dataset) => {
  const profile: any = {
    totalRows: dataset.data.length,
    columnStats: {} as Record<string, any>
  };

  // Optimization: Profiling logic with sampling for very large datasets
  const profilingStep = dataset.data.length > 5000 ? Math.ceil(dataset.data.length / 5000) : 1;
  const sampleData = dataset.data.filter((_, i) => i % profilingStep === 0);

  dataset.columns.forEach(col => {
    const meta = dataset.metadata[col];
    const values = sampleData.map(d => d[col]).filter(v => v !== null && v !== undefined);
    
    if (meta.type === 'number') {
      const nums = values.map(Number);
      profile.columnStats[col] = {
        min: Math.min(...nums),
        max: Math.max(...nums),
        avg: nums.reduce((a, b) => a + b, 0) / (nums.length || 1),
        sum: nums.reduce((a, b) => a + b, 0)
      };
    } else {
      const counts: Record<string, number> = {};
      values.forEach(v => { counts[String(v)] = (counts[String(v)] || 0) + 1; });
      const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      profile.columnStats[col] = {
        uniqueCount: sortedEntries.length,
        topValues: sortedEntries.slice(0, 5).map(([val, count]) => `${val} (${count})`)
      };
    }
  });

  return profile;
};

export const analyzeDataset = async (dataset: Dataset, lang: Language): Promise<{ insights: AIInsight[], suggestedWidgets: WidgetConfig[], strategy: BusinessQuestion[] }> => {
  const fullProfile = profileFullData(dataset);
  const langInstruction = lang === 'he' ? "Generate all response strictly in Hebrew." : "Generate all response strictly in English.";

  const prompt = `
    Analyze this dataset profile and generate:
    1. 'strategy': 3 strategic business questions and answers.
    2. 'insights': 4 deep data insights with severity (info, positive, warning).
    3. 'widgets': 6 recommended chart configurations.
    
    DATA PROFILE: ${JSON.stringify(fullProfile)}
    ${langInstruction}
    Return JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategy: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  question: { type: Type.STRING }, 
                  answer: { type: Type.STRING }, 
                  importance: { type: Type.STRING } 
                }, 
                required: ['question', 'answer'] 
              } 
            },
            insights: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  id: { type: Type.STRING }, 
                  title: { type: Type.STRING }, 
                  content: { type: Type.STRING }, 
                  severity: { type: Type.STRING, enum: ['info', 'positive', 'warning'] }, 
                  linkedWidgetId: { type: Type.STRING } 
                }, 
                required: ['id', 'title', 'content', 'severity'] 
              } 
            },
            widgets: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  id: { type: Type.STRING }, 
                  title: { type: Type.STRING }, 
                  type: { type: Type.STRING, enum: ['bar', 'line', 'area', 'pie', 'scatter', 'radar'] }, 
                  xAxis: { type: Type.STRING }, 
                  yAxis: { type: Type.STRING }, 
                  description: { type: Type.STRING } 
                }, 
                required: ['id', 'title', 'type', 'xAxis', 'yAxis'] 
              } 
            }
          },
          required: ['strategy', 'insights', 'widgets']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      strategy: result.strategy || [],
      insights: result.insights || [],
      suggestedWidgets: result.widgets || []
    };
  } catch (error) {
    console.error("Gemini analyzeDataset Error:", error);
    // Return empty state rather than crashing
    return { insights: [], suggestedWidgets: [], strategy: [] };
  }
};

export const chatWithData = async (dataset: Dataset, message: string, history: { role: string, content: string }[], lang: Language): Promise<ChatResponse> => {
  const fullProfile = profileFullData(dataset);
  const langInstruction = lang === 'he' ? "Respond strictly in Hebrew." : "Respond strictly in English.";

  const chatPrompt = `
    Context: You are Nexus AI Analytics Assistant. 
    User Question: ${message}
    Data profile: ${JSON.stringify(fullProfile)}
    ${langInstruction}
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: chatPrompt,
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            newWidget: { 
              type: Type.OBJECT, 
              properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['bar', 'line', 'area', 'pie', 'scatter', 'radar'] },
                xAxis: { type: Type.STRING },
                yAxis: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          required: ['text']
        }
      }
    });

    const result = JSON.parse(response.text || '{"text": "I could not process that request."}');
    if (result.newWidget) result.newWidget.id = Math.random().toString(36).substr(2, 9);
    return result;
  } catch (error) {
    console.error("Gemini chatWithData Error:", error);
    return { text: "There was an issue connecting to my strategic brain. Please try again." };
  }
};

// Fix: Updated interpretMetadata to return relationships and suggestedVisualizations as expected by DataUpload.tsx
export const interpretMetadata = async (
  columns: string[], 
  sampleData: any[],
  lang: Language
): Promise<{ 
  metadata: Record<string, Partial<ColumnMetadata>>, 
  strategicSummary: string,
  dataIssues: DataIssue[],
  relationships: { from: string, to: string, description: string }[],
  suggestedVisualizations: { title: string, type: string, reason: string }[]
}> => {
  const langInstruction = lang === 'he' ? "Generate all response strictly in Hebrew." : "Generate all response strictly in English.";

  const prompt = `
    Interpret these columns: ${columns.join(', ')}
    Sample Data: ${JSON.stringify(sampleData)}

    Identify:
    1. 'strategicSummary': A brief summary of what this data represents.
    2. 'columnMappings': Descriptions and roles (dimension/measure) for each column.
    3. 'dataIssues': Any potential issues like missing values or outliers.
    4. 'relationships': Key relationships between columns (e.g. hierarchy, correlation).
    5. 'suggestedVisualizations': Best ways to visualize this specific data.
    
    ${langInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 10000 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategicSummary: { type: Type.STRING },
            columnMappings: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  columnName: { type: Type.STRING }, 
                  description: { type: Type.STRING }, 
                  role: { type: Type.STRING, enum: ['dimension', 'measure'] } 
                },
                required: ['columnName', 'description', 'role']
              } 
            },
            dataIssues: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  column: { type: Type.STRING }, 
                  type: { type: Type.STRING }, 
                  description: { type: Type.STRING }, 
                  fixable: { type: Type.BOOLEAN } 
                },
                required: ['column', 'type', 'description', 'fixable']
              } 
            },
            relationships: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  from: { type: Type.STRING },
                  to: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ['from', 'to', 'description']
              }
            },
            suggestedVisualizations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['bar', 'line', 'area', 'pie', 'scatter', 'radar'] },
                  reason: { type: Type.STRING }
                },
                required: ['title', 'type', 'reason']
              }
            }
          },
          required: ['strategicSummary', 'columnMappings', 'dataIssues', 'relationships', 'suggestedVisualizations']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const metadata: Record<string, Partial<ColumnMetadata>> = {};
    parsed.columnMappings?.forEach((m: any) => {
      metadata[m.columnName] = { description: m.description, role: m.role, isVisible: true, isFilter: m.role === 'dimension' };
    });

    return { 
      metadata, 
      strategicSummary: parsed.strategicSummary || "",
      dataIssues: parsed.dataIssues || [],
      relationships: parsed.relationships || [],
      suggestedVisualizations: parsed.suggestedVisualizations || []
    };
  } catch (error) {
    console.error("Gemini interpretMetadata Error:", error);
    return { metadata: {}, strategicSummary: "", dataIssues: [], relationships: [], suggestedVisualizations: [] };
  }
};
