# Dual Email Service Setup Guide

This guide explains how to configure the advanced dual email notification system for VulnScope's alert system with automatic failover and high availability.

## Overview

VulnScope now supports a **dual email service architecture** with:
- **Primary Provider** - Main email service (Resend or SMTP)
- **Secondary Provider** - Backup email service for automatic failover
- **Automatic Failover** - Seamless switching when primary fails
- **Email Queue** - Retry mechanism for failed emails
- **Delivery Tracking** - Comprehensive monitoring and statistics

## Quick Setup

### Option 1: Dual Provider Setup (Recommended)

1. **Configure Primary Provider (Resend)**
   ```bash
   EMAIL_PRIMARY_PROVIDER=resend
   RESEND_API_KEY=re_iZ9nzhdq_2xpNHMUwi4xrPATEewqd55rF
   FROM_EMAIL=triple3limited@gmail.com
   FROM_NAME=VulnScope
   ```

2. **Configure Secondary Provider (SMTP)**
   ```bash
   EMAIL_SECONDARY_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=triple3limited@gmail.com
   SMTP_PASSWORD=egqw pqve ofxc nqoy
   ```

3. **Enable Fallback and Configure Advanced Settings**
   ```bash
   EMAIL_ENABLE_FALLBACK=true
   EMAIL_MAX_RETRIES=3
   EMAIL_RETRY_DELAY_MS=5000
   ```

4. **Test Configuration**
   - Go to Settings → Alerts tab
   - Use the "Email Service Test" component
   - Click "Check Config" to verify both providers
   - Click "Send Test" to test failover mechanism

### Option 2: Single Provider Setup

1. **Resend Only**
   ```bash
   EMAIL_PRIMARY_PROVIDER=resend
   EMAIL_SECONDARY_PROVIDER=none
   RESEND_API_KEY=re_iZ9nzhdq_2xpNHMUwi4xrPATEewqd55rF
   FROM_EMAIL=triple3limited@gmail.com
   FROM_NAME=VulnScope
   ```

2. **SMTP Only**
   ```bash
   EMAIL_PRIMARY_PROVIDER=smtp
   EMAIL_SECONDARY_PROVIDER=none
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=triple3limited@gmail.com
   SMTP_PASSWORD=egqw pqve ofxc nqoy
   FROM_EMAIL=triple3limited@gmail.com
   FROM_NAME=VulnScope
   ```

## Environment Variables Reference

### Core Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `EMAIL_PRIMARY_PROVIDER` | Primary email provider | `resend`, `smtp`, or `none` | Yes |
| `EMAIL_SECONDARY_PROVIDER` | Secondary email provider | `resend`, `smtp`, or `none` | No |
| `EMAIL_ENABLE_FALLBACK` | Enable automatic failover | `true` or `false` | No |
| `FROM_EMAIL` | Sender email address | `noreply@yourdomain.com` | Yes |
| `FROM_NAME` | Sender display name | `VulnScope` | Yes |

### Advanced Configuration

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `EMAIL_MAX_RETRIES` | Maximum retry attempts | `3` | `3` |
| `EMAIL_RETRY_DELAY_MS` | Delay between retries (ms) | `5000` | `5000` |

### Resend Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `RESEND_API_KEY` | Resend API key | `re_1234567890abcdef` | If using Resend |

### SMTP Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` | If using SMTP |
| `SMTP_PORT` | SMTP server port | `587` (TLS) or `465` (SSL) | If using SMTP |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` | If using SMTP |
| `SMTP_PASSWORD` | SMTP password/app password | `your-app-password` | If using SMTP |

### Legacy Support

| Variable | Description | Example | Note |
|----------|-------------|---------|------|
| `EMAIL_PROVIDER` | Legacy single provider | `resend` or `smtp` | Maps to `EMAIL_PRIMARY_PROVIDER` |

## Common SMTP Providers

### Gmail
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Note**: Use App Passwords for Gmail. Enable 2FA and generate an app password.

### Outlook/Hotmail
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### SendGrid
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Mailgun
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-username
SMTP_PASSWORD=your-mailgun-smtp-password
```

## Testing Email Configuration

1. **Navigate to Settings**
   - Go to Dashboard → Settings
   - Click on the "Alerts" tab

2. **Check Configuration**
   - Find the "Email Service Test" component
   - Click "Check Config" to verify your setup
   - Review the configuration status

3. **Send Test Email**
   - Click "Send Test" to send a test email
   - Check your email inbox for the test message
   - Review the test results in the interface

## Troubleshooting

### Common Issues

#### "Email service not configured"
- Check that `EMAIL_PROVIDER` is set to `resend` or `smtp`
- Verify all required environment variables are set
- Restart your application after changing environment variables

#### "Resend API key missing"
- Verify `RESEND_API_KEY` is set correctly
- Check that the API key is valid and active
- Ensure the API key has email sending permissions

#### "SMTP configuration incomplete"
- Verify all SMTP variables are set: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- Check that the SMTP credentials are correct
- Test SMTP connection with a separate tool

#### "Failed to send test email"
- Check your email service provider's logs
- Verify the recipient email address is valid
- Check for rate limiting or quota issues
- Review firewall/network restrictions

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=email-service
```

This will provide detailed logs about email sending attempts.

## Email Templates

VulnScope includes professional email templates for:
- **Vulnerability Alerts**: Rich HTML emails with vulnerability details
- **Test Emails**: Simple confirmation emails

Templates include:
- Responsive design for mobile and desktop
- Severity-based color coding
- Vulnerability details and recommendations
- Direct links to vulnerability pages
- Unsubscribe information

## Security Considerations

1. **Environment Variables**
   - Never commit email credentials to version control
   - Use secure environment variable management
   - Rotate API keys and passwords regularly

2. **Email Content**
   - All emails are sent from your configured domain
   - No sensitive data is included in email content
   - Links point to your VulnScope instance

3. **Rate Limiting**
   - Email service includes built-in rate limiting
   - Cooldown periods prevent spam
   - Respects email service provider limits

## Production Deployment

### Environment Setup
1. Set all required environment variables
2. Test email configuration thoroughly
3. Monitor email delivery rates
4. Set up email service monitoring

### Monitoring
- Track email delivery success rates
- Monitor bounce and complaint rates
- Set up alerts for email service failures
- Review email service provider dashboards

### Scaling
- Consider email service provider quotas
- Implement email queuing for high volume
- Use dedicated email domains for better deliverability
- Monitor reputation and sender scores

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review your email service provider's documentation
3. Test with the built-in email test component
4. Check application logs for detailed error messages

For additional help, refer to:
- [Resend Documentation](https://resend.com/docs)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- Your SMTP provider's documentation
