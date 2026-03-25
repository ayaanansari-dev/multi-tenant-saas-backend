export const keyRotatedTemplate = (data: {
  keyName: string;
  rotatedAt: Date;
  oldKeyPrefix: string;
}) => ({
  subject: `API Key Rotated: ${data.keyName}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>API Key Rotation Notification</h2>
        <p>Your API key "${data.keyName}" has been rotated on ${data.rotatedAt.toLocaleString()}.</p>
        
        <div class="alert">
          <strong>⚠️ Important:</strong>
          <p>The old key (prefix: ${data.oldKeyPrefix}) will remain active for 15 minutes.</p>
          <p>Please update your applications to use the new key before the old key expires.</p>
        </div>
        
        <p>If you did not request this rotation, please contact your administrator immediately.</p>
        
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    API Key Rotation Notification
    
    Your API key "${data.keyName}" has been rotated on ${data.rotatedAt.toLocaleString()}.
    
    IMPORTANT: The old key (prefix: ${data.oldKeyPrefix}) will remain active for 15 minutes.
    Please update your applications to use the new key before the old key expires.
    
    If you did not request this rotation, please contact your administrator immediately.
    
    This is an automated notification. Please do not reply to this email.
  `,
});