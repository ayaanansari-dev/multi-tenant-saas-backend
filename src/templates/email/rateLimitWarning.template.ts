export const rateLimitWarningTemplate = (data: {
  apiKeyId: string;
  currentUsage: number;
  limit: number;
  resetAt: Date;
}) => ({
  subject: `Rate Limit Warning: ${Math.round((data.currentUsage / data.limit) * 100)}% Used`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .stats { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Rate Limit Warning</h2>
        <p>Your API key is approaching its rate limit.</p>
        
        <div class="stats">
          <strong>Current Usage:</strong> ${data.currentUsage} / ${data.limit} requests<br>
          <strong>Usage Percentage:</strong> ${Math.round((data.currentUsage / data.limit) * 100)}%<br>
          <strong>Resets At:</strong> ${data.resetAt.toLocaleString()}
        </div>
        
        <div class="warning">
          <strong>⚠️ Action Required:</strong>
          <p>Consider upgrading your plan or reducing request frequency to avoid service interruptions.</p>
        </div>
        
        <p>Rate limits reset at ${data.resetAt.toLocaleString()}.</p>
        
        <div class="footer">
          <p>This is an automated notification. You will receive at most one warning per hour.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    Rate Limit Warning
    
    Your API key is approaching its rate limit.
    
    Current Usage: ${data.currentUsage} / ${data.limit} requests
    Usage Percentage: ${Math.round((data.currentUsage / data.limit) * 100)}%
    Resets At: ${data.resetAt.toLocaleString()}
    
    ACTION REQUIRED: Consider upgrading your plan or reducing request frequency to avoid service interruptions.
    
    Rate limits reset at ${data.resetAt.toLocaleString()}.
    
    This is an automated notification. You will receive at most one warning per hour.
  `,
});