# Dual Email Service Configuration Examples

This document provides comprehensive configuration examples for the dual email service system.

## Environment Variables Reference

### Core Configuration

```bash
# Primary Email Provider (resend, smtp, or none)
EMAIL_PRIMARY_PROVIDER=resend

# Secondary Email Provider (resend, smtp, or none) - for failover
EMAIL_SECONDARY_PROVIDER=smtp

# Enable automatic failover to secondary provider
EMAIL_ENABLE_FALLBACK=true

# Email retry configuration
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY_MS=5000

# Email sender configuration
FROM_EMAIL=triple3limited@gmail.com
FROM_NAME=VulnScope
```

### Resend Configuration

```bash
# Get your API key from https://resend.com
RESEND_API_KEY=re_iZ9nzhdq_2xpNHMUwi4xrPATEewqd55rF
```

### SMTP Configuration

```bash
# Gmail SMTP settings (use App Password for Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=triple3limited@gmail.com
SMTP_PASSWORD=egqw pqve ofxc nqoy
```

---

## Configuration Examples

### Example 1: Dual Provider Setup (Recommended)

**Use Case**: Maximum reliability with automatic failover

```bash
# Primary: Resend (fast, reliable)
EMAIL_PRIMARY_PROVIDER=resend
RESEND_API_KEY=re_your_resend_key

# Secondary: SMTP (backup)
EMAIL_SECONDARY_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Enable failover
EMAIL_ENABLE_FALLBACK=true
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY_MS=5000

# Sender info
FROM_EMAIL=your-email@gmail.com
FROM_NAME=VulnScope
```

**Benefits**:
- ✅ Primary provider (Resend) for speed and reliability
- ✅ Automatic failover to SMTP if Resend fails
- ✅ Email queue with retry mechanism
- ✅ Comprehensive delivery tracking

### Example 2: Resend Only

**Use Case**: Simple setup with Resend service

```bash
EMAIL_PRIMARY_PROVIDER=resend
EMAIL_SECONDARY_PROVIDER=none
EMAIL_ENABLE_FALLBACK=false
RESEND_API_KEY=re_your_resend_key
FROM_EMAIL=your-email@yourdomain.com
FROM_NAME=VulnScope
```

**Benefits**:
- ✅ Simple configuration
- ✅ Fast delivery
- ✅ Good deliverability
- ❌ No failover protection

### Example 3: SMTP Only

**Use Case**: Using existing email infrastructure

```bash
EMAIL_PRIMARY_PROVIDER=smtp
EMAIL_SECONDARY_PROVIDER=none
EMAIL_ENABLE_FALLBACK=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=VulnScope
```

**Benefits**:
- ✅ Uses existing email server
- ✅ No additional service costs
- ❌ No failover protection
- ❌ Potential deliverability issues

### Example 4: Gmail SMTP Configuration

**Use Case**: Using Gmail as email provider

```bash
EMAIL_PRIMARY_PROVIDER=smtp
EMAIL_SECONDARY_PROVIDER=none
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=VulnScope
```

**Setup Steps**:
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password: Google Account → Security → App passwords
3. Use the 16-character app password (not your regular password)

### Example 5: Outlook SMTP Configuration

**Use Case**: Using Outlook/Hotmail as email provider

```bash
EMAIL_PRIMARY_PROVIDER=smtp
EMAIL_SECONDARY_PROVIDER=none
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
FROM_EMAIL=your-email@outlook.com
FROM_NAME=VulnScope
```

### Example 6: SendGrid SMTP Configuration

**Use Case**: Using SendGrid as email provider

```bash
EMAIL_PRIMARY_PROVIDER=smtp
EMAIL_SECONDARY_PROVIDER=none
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=VulnScope
```

### Example 7: Mailgun SMTP Configuration

**Use Case**: Using Mailgun as email provider

```bash
EMAIL_PRIMARY_PROVIDER=smtp
EMAIL_SECONDARY_PROVIDER=none
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-username
SMTP_PASSWORD=your-mailgun-smtp-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=VulnScope
```

### Example 8: Dual SMTP Configuration

**Use Case**: Using two different SMTP providers for redundancy

```bash
# Primary: Gmail SMTP
EMAIL_PRIMARY_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=primary@gmail.com
SMTP_PASSWORD=primary-app-password

# Secondary: Outlook SMTP
EMAIL_SECONDARY_PROVIDER=smtp
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=secondary@outlook.com
SMTP_PASSWORD=secondary-password

# Enable failover
EMAIL_ENABLE_FALLBACK=true
FROM_EMAIL=primary@gmail.com
FROM_NAME=VulnScope
```

**Note**: This configuration requires separate SMTP credentials for each provider.

---

## Testing Your Configuration

### 1. Check Configuration Status

```bash
# Navigate to Settings → Alerts tab
# Click "Check Config" in the Email Service Test component
```

### 2. Send Test Email

```bash
# Click "Send Test" in the Email Service Test component
# Check your email inbox for the test message
```

### 3. Run Comprehensive Test

```bash
# Run the dual email system test script
npm run test:email
```

### 4. Monitor Delivery Statistics

The system tracks delivery statistics for both providers:
- Success/failure counts
- Last used timestamps
- Queue status
- Retry attempts

---

## Troubleshooting

### Common Issues

#### "Email service not configured"
- Check that at least one provider is configured
- Verify environment variables are set correctly
- Restart the application after changing environment variables

#### "Primary provider failed, trying secondary"
- This is normal behavior when failover is enabled
- Check primary provider configuration
- Verify secondary provider is working

#### "Both providers failed"
- Check network connectivity
- Verify credentials are correct
- Check email service provider status
- Review firewall/security settings

#### "Email queued for retry"
- Emails are automatically queued when both providers fail
- Queue is processed every 10 seconds
- Check queue status in the test component

### Debug Mode

Enable detailed logging:

```bash
DEBUG=email-service
```

This will provide detailed logs about:
- Provider initialization
- Email sending attempts
- Failover decisions
- Queue processing
- Error details

---

## Performance Optimization

### Recommended Settings

```bash
# For high-volume applications
EMAIL_MAX_RETRIES=5
EMAIL_RETRY_DELAY_MS=3000

# For low-volume applications
EMAIL_MAX_RETRIES=2
EMAIL_RETRY_DELAY_MS=10000
```

### Monitoring

Monitor these metrics:
- Delivery success rates
- Provider performance
- Queue size and processing time
- Failover frequency
- Error rates

---

## Security Considerations

1. **Environment Variables**
   - Never commit credentials to version control
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

---

## Migration from Single Provider

If you're upgrading from a single provider setup:

1. **Backup Current Configuration**
   ```bash
   # Save your current EMAIL_PROVIDER setting
   EMAIL_PROVIDER=resend  # or smtp
   ```

2. **Update to Dual Provider**
   ```bash
   # Set primary provider (same as your current provider)
   EMAIL_PRIMARY_PROVIDER=resend
   
   # Add secondary provider
   EMAIL_SECONDARY_PROVIDER=smtp
   
   # Enable failover
   EMAIL_ENABLE_FALLBACK=true
   ```

3. **Test Configuration**
   - Run the test script
   - Verify both providers work
   - Test failover mechanism

4. **Remove Legacy Variables**
   ```bash
   # You can remove EMAIL_PROVIDER after migration
   # EMAIL_PROVIDER=resend  # Remove this line
   ```

The system maintains backward compatibility with the legacy `EMAIL_PROVIDER` variable.
