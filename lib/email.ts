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
  clientCompany?: string;
  services?: Array<{ name: string; description?: string; priceDisplay?: string }>;
}

export async function sendOnboardingEmail({
  to,
  firstName,
  onboardLink,
  companyName = 'ALBS',
  clientCompany,
  services = [],
}: SendOnboardingEmailParams) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Resend not configured' };

  const displayName = firstName && firstName.trim() ? firstName : 'there';
  const servicesHtml = services.length > 0
    ? services.map(s => `
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
            <span style="color: #1e40af; font-size: 16px;">✦</span>
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">${s.name}</p>
            ${s.description ? `<p style="margin: 4px 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">${s.description}</p>` : ''}
          </td>
          ${s.priceDisplay ? `
          <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">
            <span style="color: #059669; font-weight: 600; font-size: 14px;">${s.priceDisplay}</span>
          </td>` : ''}
        </tr>
      `).join('')
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 36px 40px; text-align: center;">
              <p style="color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 10px;">Welcome to</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">All Lines Business Solutions</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">

              <!-- Greeting -->
              <p style="color: #1f2937; font-size: 17px; line-height: 1.7; margin: 0 0 28px;">
                Dear ${displayName}${clientCompany ? ', owner of ' + clientCompany : ''},
              </p>

              <!-- Opening -->
              <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
                On behalf of everyone at <strong>All Lines Business Solutions (ALBS)</strong>, thank you for placing your trust in us. We are committed to delivering exceptional service and look forward to helping you achieve your business goals.
              </p>

              <!-- Assigned Services -->
              ${services.length > 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; overflow: hidden; margin: 28px 0; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 16px 20px; background-color: #1e3a8a;">
                    <p style="color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin: 0;">Your Assigned Services</p>
                  </td>
                </tr>
                ${servicesHtml}
              </table>
              ` : ''}

              <!-- What Happens Next -->
              <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px; font-weight: 600;">
                What Happens Next
              </p>
              <ol style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0 0 28px; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Complete your client profile using the link below — this helps us serve you better.</li>
                <li style="margin-bottom: 8px;">Our team will review your information and begin your service delivery.</li>
                <li style="margin-bottom: 8px;">You will receive a confirmation once your onboarding is complete.</li>
                <li>We will reach out with any questions or to schedule next steps.</li>
              </ol>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${onboardLink}" style="display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">
                      Complete Your Profile →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 14px;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0; word-break: break-all;">${onboardLink}</p>
                  </td>
                </tr>
              </table>

              <!-- Questions -->
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
                If you have any questions before then, please don't hesitate to reach out:
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                <strong>Email:</strong> <a href="mailto:support@simplifyingbusinesses.com" style="color: #2563eb;">support@simplifyingbusinesses.com</a><br>
                <strong>Phone:</strong> (561) 589-8900
              </p>

            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding: 0 40px 36px;">
              <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
                We appreciate your business and look forward to working with you.
              </p>
              <p style="color: #1f2937; font-size: 15px; margin: 0;">
                Warm regards,<br>
                <strong>Franklin Bryant IV</strong><br>
                <span style="color: #6b7280; font-size: 13px;">Chief Operating Officer<br>All Lines Business Solutions</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0; text-align: center; line-height: 1.6;">
                © ${new Date().getFullYear()} All Lines Business Solutions • Punta Gorda, FL<br>
                <a href="mailto:support@simplifyingbusinesses.com" style="color: #9ca3af;">support@simplifyingbusinesses.com</a> • (561) 589-8900
              </p>
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
      from: 'onboarding@simplifyingbusinesses.com',
      to: [to],
      reply_to: 'onboarding@simplifyingbusinesses.com',
      subject: `Welcome to ALBS${clientCompany ? ' — ' + clientCompany : ''}`,
      html,
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

export async function sendContractEmail({
  to,
  clientName,
  contractUrl,
  serviceName,
  totalFee,
  depositAmount,
}: {
  to: string;
  clientName: string;
  contractUrl: string;
  serviceName: string;
  totalFee: number;
  depositAmount: number;
}) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Resend not configured' };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="content-width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 36px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Your ALBS Service Agreement</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #1f2937; font-size: 17px; line-height: 1.7; margin: 0 0 24px;">Dear ${clientName},</p>
              <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
                Your service agreement for <strong>${serviceName}</strong> is ready for your review and signature.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; overflow: hidden; margin: 24px 0; border: 1px solid #e2e8f0;">
                <tr><td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;"><span style="color: #6b7280; font-size: 13px;">Service</span><br><strong style="color: #1f2937;">${serviceName}</strong></td></tr>
                <tr><td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;"><span style="color: #6b7280; font-size: 13px;">Total Fee</span><br><strong style="color: #1f2937;">$${(totalFee / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td></tr>
                <tr><td style="padding: 12px 20px;"><span style="color: #6b7280; font-size: 13px;">Deposit Due at Signing</span><br><strong style="color: #1e3a8a;">$${(depositAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td></tr>
              </table>
              <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 8px;"><strong>Next steps:</strong></p>
              <ol style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0 0 28px; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Review your service agreement</li>
                <li style="margin-bottom: 8px;">Sign electronically by typing your name</li>
                <li>Submit your deposit payment</li>
              </ol>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${contractUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 15px;">
                      Review &amp; Sign Agreement →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">If you have any questions, please contact us:</p>
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                <strong>Email:</strong> <a href="mailto:support@simplifyingbusinesses.com" style="color: #2563eb;">support@simplifyingbusinesses.com</a><br>
                <strong>Phone:</strong> (561) 589-8900
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0; text-align: center; line-height: 1.6;">
                © ${new Date().getFullYear()} All Lines Business Solutions • Punta Gorda, FL<br>
                <a href="mailto:support@simplifyingbusinesses.com" style="color: #9ca3af;">support@simplifyingbusinesses.com</a> • (561) 589-8900
              </p>
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
      from: 'onboarding@simplifyingbusinesses.com',
      to: [to],
      reply_to: 'support@simplifyingbusinesses.com',
      subject: 'Your ALBS Service Agreement — Action Required',
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
