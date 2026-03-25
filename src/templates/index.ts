import { invitationTemplate } from './email/invitation.template';
import { keyRotatedTemplate } from './email/keyRotated.template';
import { rateLimitWarningTemplate } from './email/rateLimitWarning.template';

export const emailTemplates = {
  invitation: invitationTemplate,
  keyRotated: keyRotatedTemplate,
  rateLimitWarning: rateLimitWarningTemplate,
};