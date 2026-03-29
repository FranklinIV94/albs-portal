import { Resend } from 'resend';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

interface SendOnboardingEmailParams {
  to: string;
  firstName: string;
  onboardLink: string;
  companyName?: string;
}

export async function sendOnboardingEmail({
  to,
  firstName,
  onboardLink,
  companyName = 'ALBS',
}: SendOnboardingEmailParams) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Resend not configured' };
  try {
    const data = await resend.emails.send({
      from: 'onboarding@simplifyingbusinesses.com',
      to: [to],
      reply_to: 'onboarding@simplifyingbusinesses.com',
      subject: 'Complete Your Profile - Invitation',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Complete Your Profile</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #1f2937; font-size: 16px; margin: 0 0 20px 0;">
                Hi ${firstName},
              </p>
              
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                We've prepared your expert profile and would like you to verify your availability. 
                It only takes a minute to complete.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${onboardLink}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                      Complete Your Profile →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 13px; margin: 0;">
                Or copy this link: <span style="color: #2563eb; word-break: break-all;">${onboardLink}</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${companyName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('Resend error:', error);
    return { success: false, error: error.message };
  }
}

interface BookingConfirmationParams {
  to: string;
  firstName: string;
  date: string;
  time: string;
  timezone: string;
  notes?: string;
}

export async function sendBookingConfirmationEmail({
  to,
  firstName,
  date,
  time,
  timezone,
  notes,
}: BookingConfirmationParams) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Resend not configured' };
  try {
    const data = await resend.emails.send({
      from: 'onboarding@simplifyingbusinesses.com',
      to: [to],
      reply_to: 'onboarding@simplifyingbusinesses.com',
      subject: '📅 Consultation Confirmed - ' + date,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">📅 Consultation Confirmed!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #1f2937; font-size: 16px; margin: 0 0 20px 0;">
                Hi ${firstName},
              </p>
              
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                Your consultation has been scheduled. Here are the details:
              </p>
              
              <!-- Booking Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280; font-size: 13px;">📆 Date</strong>
                    <p style="color: #1f2937; font-size: 16px; margin: 5px 0 0 0;">${date}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280; font-size: 13px;">🕐 Time</strong>
                    <p style="color: #1f2937; font-size: 16px; margin: 5px 0 0 0;">${time} (${timezone})</p>
                  </td>
                </tr>
                ${notes ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #6b7280; font-size: 13px;">📝 Notes</strong>
                    <p style="color: #1f2937; font-size: 14px; margin: 5px 0 0 0;">${notes}</p>
                  </td>
                </tr>
                ` : ''}
              </table>
              
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
                A calendar invite will be sent to your email shortly. We look forward to speaking with you!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ALBS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('Resend error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendInvoiceEmail({
  to,
  clientName,
  invoiceNumber,
  lineItems,
  subtotal,
  taxRate,
  taxAmount,
  total,
  dueDate,
  paymentUrl,
  notes,
}: {
  to: string;
  clientName: string;
  invoiceNumber: string;
  lineItems: Array<{description: string; quantity: number; unitPrice: number; total: number}>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  dueDate: string;
  paymentUrl?: string;
  notes?: string;
}) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Resend not configured' };
  const lineItemsHtml = lineItems.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">$${(item.unitPrice / 100).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">$${(item.total / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">INVOICE</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0; font-size: 14px;">${invoiceNumber}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #6b7280; font-size: 14px;">
                <strong style="color: #1f2937;">Invoice Date:</strong> ${new Date().toLocaleDateString()}<br><br>
                <strong style="color: #1f2937;">Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}<br><br>
                <strong style="color: #1f2937;">Amount Due:</strong> <span style="color: #3b82f6; font-size: 20px; font-weight: 700;">$${(total / 100).toFixed(2)}</span>
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 600;">Description</th>
                    <th style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px; font-weight: 600;">Qty</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 12px; font-weight: 600;">Unit Price</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 12px; font-weight: 600;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemsHtml}
                </tbody>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                  <td width="70%" style="text-align: right; color: #6b7280; padding: 8px 0;">Subtotal:</td>
                  <td width="30%" style="text-align: right; color: #1f2937; padding: 8px 0;">$${(subtotal / 100).toFixed(2)}</td>
                </tr>
                <tr>
                  <td width="70%" style="text-align: right; color: #6b7280; padding: 8px 0;">Tax (${(taxRate / 100).toFixed(2)}%):</td>
                  <td width="30%" style="text-align: right; color: #1f2937; padding: 8px 0;">$${(taxAmount / 100).toFixed(2)}</td>
                </tr>
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td width="70%" style="text-align: right; color: #1f2937; font-weight: 700; padding: 12px 0; font-size: 16px;">Total Due:</td>
                  <td width="30%" style="text-align: right; color: #3b82f6; font-weight: 700; padding: 12px 0; font-size: 16px;">$${(total / 100).toFixed(2)}</td>
                </tr>
              </table>
              ${notes ? `<p style="color: #6b7280; font-size: 14px; margin-top: 20px;"><strong>Notes:</strong> ${notes}</p>` : ''}
              ${paymentUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Pay Now →</a>
                  </td>
                </tr>
              </table>
              ` : ''}
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">Questions? Reply to this email or contact support@simplifyingbusinesses.com</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">All Lines Business Solutions • Punta Gorda, FL<br>support@simplifyingbusinesses.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const data = await resend.emails.send({
      from: 'invoices@simplifyingbusinesses.com',
      to: [to],
      reply_to: 'support@simplifyingbusinesses.com',
      subject: `Invoice ${invoiceNumber} - $${(total / 100).toFixed(2)} Due ${new Date(dueDate).toLocaleDateString()}`,
      html,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('Resend error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendConfirmationEmail({
  to,
  firstName,
  companyName = 'ALBS',
}: {
  to: string;
  firstName: string;
  companyName?: string;
}) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Resend not configured' };
  try {
    const data = await resend.emails.send({
      from: 'onboarding@simplifyingbusinesses.com',
      to: [to],
      reply_to: 'onboarding@simplifyingbusinesses.com',
      subject: 'Profile Complete - Thank You!',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">✓ You're All Set!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <p style="color: #1f2937; font-size: 16px; margin: 0 0 10px 0;">
                Hi ${firstName},
              </p>
              
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0;">
                Thank you for completing your profile. We'll be in touch soon!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${companyName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('Resend error:', error);
    return { success: false, error: error.message };
  }
}
