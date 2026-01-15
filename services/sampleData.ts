
import { Dataset } from "../types";

export const getSampleDatasets = (): Dataset[] => {
  const now = Date.now();

  // 1. Global SaaS Sales
  const saasSales: Dataset = {
    id: 'sample-saas-sales',
    name: 'Global SaaS Sales (Sample)',
    createdAt: now,
    columns: ['Date', 'Region', 'Country', 'Product_Tier', 'Subscription_Value', 'Customer_Segment', 'Churn_Risk'],
    data: [
      { Date: '2023-01-15', Region: 'North America', Country: 'USA', Product_Tier: 'Enterprise', Subscription_Value: 12000, Customer_Segment: 'Fortune 500', Churn_Risk: 'Low' },
      { Date: '2023-01-20', Region: 'North America', Country: 'Canada', Product_Tier: 'Professional', Subscription_Value: 4500, Customer_Segment: 'SME', Churn_Risk: 'Medium' },
      { Date: '2023-02-05', Region: 'Europe', Country: 'UK', Product_Tier: 'Enterprise', Subscription_Value: 15000, Customer_Segment: 'Fortune 500', Churn_Risk: 'Low' },
      { Date: '2023-02-12', Region: 'Europe', Country: 'Germany', Product_Tier: 'Basic', Subscription_Value: 1200, Customer_Segment: 'Startup', Churn_Risk: 'High' },
      { Date: '2023-03-01', Region: 'APAC', Country: 'Singapore', Product_Tier: 'Enterprise', Subscription_Value: 22000, Customer_Segment: 'Fortune 500', Churn_Risk: 'Low' },
      { Date: '2023-03-15', Region: 'APAC', Country: 'Australia', Product_Tier: 'Professional', Subscription_Value: 5500, Customer_Segment: 'SME', Churn_Risk: 'Low' },
      { Date: '2023-04-10', Region: 'North America', Country: 'USA', Product_Tier: 'Enterprise', Subscription_Value: 12500, Customer_Segment: 'Fortune 500', Churn_Risk: 'Low' },
      { Date: '2023-05-22', Region: 'Europe', Country: 'France', Product_Tier: 'Professional', Subscription_Value: 4800, Customer_Segment: 'SME', Churn_Risk: 'Medium' },
      { Date: '2023-06-05', Region: 'LATAM', Country: 'Brazil', Product_Tier: 'Basic', Subscription_Value: 1100, Customer_Segment: 'Startup', Churn_Risk: 'High' },
    ],
    metadata: {
      Date: { description: 'Transaction date', isFilter: true, isVisible: true, type: 'date', role: 'dimension' },
      Region: { description: 'Global region level', isFilter: true, isVisible: true, type: 'string', role: 'dimension', hierarchyRole: 'level', hierarchyLinkedColumn: 'Country' },
      Country: { description: 'Specific country member', isFilter: true, isVisible: true, type: 'string', role: 'dimension', hierarchyRole: 'member', hierarchyLinkedColumn: 'Region' },
      Product_Tier: { description: 'SaaS subscription tier', isFilter: true, isVisible: true, type: 'string', role: 'dimension' },
      Subscription_Value: { description: 'Monthly Recurring Revenue (MRR)', isFilter: false, isVisible: true, type: 'number', role: 'measure' },
      Customer_Segment: { description: 'Classification of account size', isFilter: true, isVisible: true, type: 'string', role: 'dimension' },
      Churn_Risk: { description: 'Propensity of churn based on activity', isFilter: true, isVisible: true, type: 'string', role: 'dimension' },
    }
  };

  // 2. Employee Performance & Engagement
  const hrData: Dataset = {
    id: 'sample-hr-engagement',
    name: 'Employee Insight (Sample)',
    createdAt: now,
    columns: ['Employee_ID', 'Department', 'Role', 'Performance_Score', 'Engagement_Index', 'Tenure_Years', 'Remote_Status'],
    data: [
      { Employee_ID: 'E001', Department: 'Engineering', Role: 'Senior Dev', Performance_Score: 92, Engagement_Index: 8.5, Tenure_Years: 4, Remote_Status: 'Full Remote' },
      { Employee_ID: 'E002', Department: 'Sales', Role: 'Account Exec', Performance_Score: 78, Engagement_Index: 7.2, Tenure_Years: 1.5, Remote_Status: 'Hybrid' },
      { Employee_ID: 'E003', Department: 'HR', Role: 'Manager', Performance_Score: 88, Engagement_Index: 9.1, Tenure_Years: 6, Remote_Status: 'In-Office' },
      { Employee_ID: 'E004', Department: 'Engineering', Role: 'Junior Dev', Performance_Score: 85, Engagement_Index: 8.8, Tenure_Years: 0.5, Remote_Status: 'Full Remote' },
      { Employee_ID: 'E005', Department: 'Marketing', Role: 'Specialist', Performance_Score: 95, Engagement_Index: 9.5, Tenure_Years: 3, Remote_Status: 'Hybrid' },
      { Employee_ID: 'E006', Department: 'Sales', Role: 'Account Exec', Performance_Score: 65, Engagement_Index: 6.0, Tenure_Years: 2, Remote_Status: 'Hybrid' },
    ],
    metadata: {
      Employee_ID: { description: 'Unique identifier', isFilter: false, isVisible: true, type: 'string', role: 'dimension' },
      Department: { description: 'Business unit', isFilter: true, isVisible: true, type: 'string', role: 'dimension', hierarchyRole: 'level', hierarchyLinkedColumn: 'Role' },
      Role: { description: 'Job title', isFilter: true, isVisible: true, type: 'string', role: 'dimension', hierarchyRole: 'member', hierarchyLinkedColumn: 'Department' },
      Performance_Score: { description: 'Annual review score (0-100)', isFilter: false, isVisible: true, type: 'number', role: 'measure' },
      Engagement_Index: { description: 'Employee sentiment survey result', isFilter: false, isVisible: true, type: 'number', role: 'measure' },
      Tenure_Years: { description: 'Years at company', isFilter: true, isVisible: true, type: 'number', role: 'measure' },
      Remote_Status: { description: 'Work modality', isFilter: true, isVisible: true, type: 'string', role: 'dimension' },
    }
  };

  // 3. Marketing Campaign Attribution
  const marketingData: Dataset = {
    id: 'sample-marketing-attribution',
    name: 'Marketing ROI (Sample)',
    createdAt: now,
    columns: ['Campaign', 'Channel', 'Spend', 'Conversions', 'CPA', 'CLV_Est'],
    data: [
      { Campaign: 'Summer Sale 23', Channel: 'Google Search', Spend: 5000, Conversions: 450, CPA: 11.1, CLV_Est: 150 },
      { Campaign: 'Summer Sale 23', Channel: 'Facebook Ads', Spend: 3500, Conversions: 210, CPA: 16.6, CLV_Est: 120 },
      { Campaign: 'Brand Awareness', Channel: 'YouTube Video', Spend: 8000, Conversions: 50, CPA: 160, CLV_Est: 300 },
      { Campaign: 'Retargeting Q3', Channel: 'Google Display', Spend: 2000, Conversions: 180, CPA: 11.1, CLV_Est: 95 },
      { Campaign: 'Product Launch', Channel: 'Email Marketing', Spend: 500, Conversions: 300, CPA: 1.6, CLV_Est: 200 },
      { Campaign: 'Brand Awareness', Channel: 'Instagram Influencers', Spend: 4500, Conversions: 80, CPA: 56.2, CLV_Est: 250 },
    ],
    metadata: {
      Campaign: { description: 'Marketing initiative name', isFilter: true, isVisible: true, type: 'string', role: 'dimension' },
      Channel: { description: 'Platform or medium used', isFilter: true, isVisible: true, type: 'string', role: 'dimension' },
      Spend: { description: 'Total budget allocated', isFilter: false, isVisible: true, type: 'number', role: 'measure' },
      Conversions: { description: 'Successful acquisitions', isFilter: false, isVisible: true, type: 'number', role: 'measure' },
      CPA: { description: 'Cost Per Acquisition', isFilter: false, isVisible: true, type: 'number', role: 'measure' },
      CLV_Est: { description: 'Estimated Customer Lifetime Value', isFilter: false, isVisible: true, type: 'number', role: 'measure' },
    }
  };

  return [saasSales, hrData, marketingData];
};
