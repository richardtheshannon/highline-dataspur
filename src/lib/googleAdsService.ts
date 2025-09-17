import { GoogleAdsApi, Customer } from 'google-ads-api';

export interface GoogleAdsCredentials {
  client_id: string;
  client_secret: string;
  developer_token: string;
  refresh_token?: string;
  customer_id?: string;
}

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
  startDate: string;
  endDate: string;
}

export class GoogleAdsService {
  private client: GoogleAdsApi;
  private customer?: Customer;
  private credentials: GoogleAdsCredentials;

  constructor(credentials: GoogleAdsCredentials) {
    this.credentials = credentials;
    this.client = new GoogleAdsApi({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      developer_token: credentials.developer_token,
    });

    if (credentials.customer_id && credentials.refresh_token) {
      // Remove any dashes from customer ID (Google Ads expects format without dashes)
      const cleanCustomerId = credentials.customer_id.replace(/-/g, '');

      console.log('Initializing Google Ads Customer with:', {
        customer_id: cleanCustomerId,
        has_refresh_token: !!credentials.refresh_token
      });

      this.customer = this.client.Customer({
        customer_id: cleanCustomerId,
        refresh_token: credentials.refresh_token,
      });
    } else {
      console.warn('Missing customer_id or refresh_token for Google Ads initialization');
    }
  }

  async testConnection(): Promise<{ success: boolean; details: string; data?: any }> {
    try {
      if (!this.customer) {
        throw new Error('Customer not initialized. Please provide customer_id and refresh_token.');
      }

      // Try to fetch customer info to test connection
      const customerInfo = await this.customer.query(`
        SELECT 
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone
        FROM customer
        LIMIT 1
      `);

      if (customerInfo && customerInfo.length > 0 && customerInfo[0].customer) {
        const customer = customerInfo[0].customer;
        return {
          success: true,
          details: `Successfully connected to Google Ads account: ${customer.descriptive_name} (${customer.id})`,
          data: {
            customerId: customer.id,
            accountName: customer.descriptive_name,
            currency: customer.currency_code,
            timeZone: customer.time_zone
          }
        };
      }

      throw new Error('No customer data returned');
    } catch (error: any) {
      console.error('Google Ads connection test failed:', error);
      return {
        success: false,
        details: error.message || 'Failed to connect to Google Ads API'
      };
    }
  }

  async getCampaigns(): Promise<GoogleAdsCampaign[]> {
    try {
      if (!this.customer) {
        throw new Error('Customer not initialized. Please provide customer_id and refresh_token.');
      }

      console.log('Attempting to fetch campaigns with customer:', this.customer.credentials?.customer_id);

      // Query campaigns with performance metrics
      // Only fetch ENABLED campaigns, using DURING LAST_30_DAYS to avoid date range issues
      const campaigns = await this.customer.query(`
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.start_date,
          campaign.end_date,
          campaign_budget.amount_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.cost_micros,
          metrics.ctr,
          metrics.average_cpc
        FROM campaign
        WHERE
          campaign.status = 'ENABLED'
          AND segments.date DURING LAST_30_DAYS
        ORDER BY campaign.name
      `);

      console.log(`Found ${campaigns?.length || 0} campaigns`);

      if (!campaigns || campaigns.length === 0) {
        console.log('No campaigns found, returning empty array');
        return [];
      }

      return campaigns.map((row: any) => {
        const campaign = row.campaign;
        const metrics = row.metrics;
        const budget = row.campaign_budget;

        // Convert micros to actual currency values
        const cost = metrics.cost_micros ? metrics.cost_micros / 1000000 : 0;
        const budgetAmount = budget?.amount_micros ? budget.amount_micros / 1000000 : 0;
        const avgCpc = metrics.average_cpc ? metrics.average_cpc / 1000000 : 0;

        // Calculate conversion rate
        const conversionRate = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;

        // Convert numeric status to string
        const statusMap: { [key: number]: string } = {
          1: 'unknown',
          2: 'enabled',
          3: 'paused',
          4: 'removed'
        };
        const statusString = typeof campaign.status === 'number'
          ? statusMap[campaign.status] || 'unknown'
          : String(campaign.status).toLowerCase();

        return {
          id: campaign.id.toString(),
          name: campaign.name,
          status: statusString,
          budget: Math.round(budgetAmount),
          spend: Math.round(cost * 100) / 100,
          impressions: parseInt(metrics.impressions) || 0,
          clicks: parseInt(metrics.clicks) || 0,
          conversions: parseFloat(metrics.conversions) || 0,
          ctr: parseFloat(metrics.ctr) || 0,
          cpc: Math.round(avgCpc * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          startDate: campaign.start_date || new Date().toISOString().split('T')[0],
          endDate: campaign.end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
      });

    } catch (error: any) {
      console.error('Failed to fetch Google Ads campaigns:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        errors: error?.errors,
        stack: error?.stack
      });

      // Extract meaningful error message
      let errorMessage = 'Unknown error';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors[0].message || error.errors[0].errorCode?.message || 'API error';
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      throw new Error(`Failed to fetch campaigns: ${errorMessage}`);
    }
  }

  async getCustomerAccounts(managerCustomerId?: string): Promise<any[]> {
    try {
      // If we have a manager account, we can list sub-accounts
      if (managerCustomerId) {
        const refreshToken = this.credentials.refresh_token;
        if (!refreshToken) {
          throw new Error('Refresh token not available for manager account access');
        }

        const managerCustomer = this.client.Customer({
          customer_id: managerCustomerId,
          refresh_token: refreshToken,
        });

        const accounts = await managerCustomer.query(`
          SELECT 
            customer_client.id,
            customer_client.descriptive_name,
            customer_client.currency_code,
            customer_client.level
          FROM customer_client
          WHERE customer_client.level <= 1
        `);

        return accounts.map((row: any) => ({
          id: row.customer_client.id.toString(),
          name: row.customer_client.descriptive_name,
          currency: row.customer_client.currency_code,
          level: row.customer_client.level
        }));
      }

      return [];
    } catch (error: any) {
      console.error('Failed to fetch customer accounts:', error);
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
  }

  async getDailyMetrics(campaignIds: string[], startDate: Date, endDate: Date): Promise<Array<{
    campaignId: string;
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    ctr: number;
    averageCpc: number;
    conversionRate: number;
  }>> {
    try {
      if (!this.customer) {
        throw new Error('Customer not initialized. Please provide customer_id and refresh_token.');
      }

      console.log(`Fetching daily metrics for ${campaignIds.length} campaigns from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

      // Format dates for Google Ads API (YYYY-MM-DD)
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Check if we have campaign IDs
      if (campaignIds.length === 0) {
        console.log('No campaign IDs provided for daily metrics fetch');
        return [];
      }

      // Query daily metrics for specific campaigns and date range
      // Use IN clause instead of OR for better SQL compatibility
      const campaignIdList = campaignIds.map(id => `'${id}'`).join(', ');

      const dailyMetrics = await this.customer.query(`
        SELECT
          campaign.id,
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.cost_micros,
          metrics.ctr,
          metrics.average_cpc
        FROM campaign
        WHERE
          campaign.id IN (${campaignIdList})
          AND segments.date >= '${startDateStr}'
          AND segments.date <= '${endDateStr}'
        ORDER BY campaign.id, segments.date
      `);

      console.log(`Found ${dailyMetrics?.length || 0} daily metric records`);

      if (!dailyMetrics || dailyMetrics.length === 0) {
        return [];
      }

      return dailyMetrics.map((row: any) => {
        const campaign = row.campaign;
        const metrics = row.metrics;
        const date = row.segments.date;

        // Convert micros to actual currency values
        const cost = metrics.cost_micros ? metrics.cost_micros / 1000000 : 0;
        const avgCpc = metrics.average_cpc ? metrics.average_cpc / 1000000 : 0;

        // Calculate conversion rate
        const conversionRate = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;

        return {
          campaignId: campaign.id.toString(),
          date: date,
          impressions: parseInt(metrics.impressions) || 0,
          clicks: parseInt(metrics.clicks) || 0,
          conversions: parseFloat(metrics.conversions) || 0,
          cost: Math.round(cost * 100) / 100,
          ctr: parseFloat(metrics.ctr) || 0,
          averageCpc: Math.round(avgCpc * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100
        };
      });

    } catch (error: any) {
      console.error('Failed to fetch daily Google Ads metrics:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        errors: error?.errors
      });

      // Extract meaningful error message
      let errorMessage = 'Unknown error';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors[0].message || error.errors[0].errorCode?.message || 'API error';
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      throw new Error(`Failed to fetch daily metrics: ${errorMessage}`);
    }
  }
}