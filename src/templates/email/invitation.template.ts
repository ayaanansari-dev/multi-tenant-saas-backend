export const invitationTemplate = (data: {
  invitedBy: string;
  tenantName: string;
  role: string;
  inviteLink: string;
}) => ({
  subject: `You've been invited to join ${data.tenantName}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome to ${data.tenantName}!</h2>
        <p>You've been invited by ${data.invitedBy} to join as a ${data.role}.</p>
        <p>Click the button below to accept your invitation and set up your account:</p>
        <p><a href="${data.inviteLink}" class="button">Accept Invitation</a></p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${data.inviteLink}</p>
        <div class="footer">
          <p>This invitation will expire in 7 days.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    Welcome to ${data.tenantName}!
    
    You've been invited by ${data.invitedBy} to join as a ${data.role}.
    
    Accept your invitation by visiting: ${data.inviteLink}
    
    This invitation will expire in 7 days.
    If you didn't expect this invitation, you can safely ignore this email.
  `,
});