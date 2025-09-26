# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Principles

DePIN Autopilot follows these core security principles:

### 1. Non-Custodial Design

- **No Private Keys**: The platform NEVER stores, transmits, or has access to wallet private keys
- **No Seed Phrases**: Mnemonic phrases are never requested or stored
- **Read-Only Access**: Only requires viewing permissions for dashboards and metrics

### 2. Data Protection

- **Encryption at Rest**: Sensitive data encrypted in database
- **Encryption in Transit**: HTTPS/TLS for all API communications
- **Environment Variables**: Secrets stored in environment, never in code
- **No Logging of Secrets**: API keys and sensitive data excluded from logs

### 3. Access Control

- **API Authentication**: JWT tokens with expiration
- **Rate Limiting**: Protection against abuse
- **Input Validation**: All inputs sanitized and validated
- **CORS Configuration**: Restricted to authorized origins

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **DO NOT** create a public GitHub issue
2. Email security details to: security@depinautopilot.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond within 48 hours and will keep you updated on the fix progress.

## Security Checklist for Operators

### Initial Setup

- [ ] Change all default passwords
- [ ] Generate strong JWT secret
- [ ] Configure HTTPS in production
- [ ] Set up firewall rules
- [ ] Enable audit logging

### API Keys Management

- [ ] Store keys in `.env` file only
- [ ] Never commit `.env` to version control
- [ ] Rotate keys regularly (90 days recommended)
- [ ] Use separate keys for dev/staging/production
- [ ] Monitor key usage for anomalies

### Database Security

- [ ] Regular backups (automated)
- [ ] Encrypted backup storage
- [ ] Access restricted to application only
- [ ] No direct database exposure

### Monitoring

- [ ] Set up alerts for failed authentication attempts
- [ ] Monitor for unusual API usage patterns
- [ ] Track configuration changes
- [ ] Regular security audit logs review

## Third-Party Services

When using external services:

### DePIN Network APIs

- Only use official API endpoints
- Verify SSL certificates
- Never store credentials in code
- Use read-only permissions where possible

### Notification Services

- Discord: Use webhook URLs, not bot tokens
- Email: Use API keys, not SMTP passwords
- SMS: Implement rate limiting

## Compliance

This software is designed to help with:

- GDPR compliance (data minimization, right to deletion)
- Financial record keeping
- Audit trail maintenance

However, operators are responsible for:

- Local regulatory compliance
- Tax reporting
- Terms of service adherence for each DePIN network

## Security Updates

Stay informed about security updates:

- Watch this repository for releases
- Subscribe to security advisories
- Join our Discord for announcements

## Incident Response

In case of a security incident:

1. **Immediate Actions**:
   - Revoke compromised API keys
   - Change all passwords
   - Review access logs

2. **Investigation**:
   - Identify scope of breach
   - Determine data affected
   - Document timeline

3. **Remediation**:
   - Apply security patches
   - Update configurations
   - Notify affected users if required

4. **Post-Incident**:
   - Conduct security review
   - Update procedures
   - Share learnings (without sensitive details)

## Best Practices

### For Development

```bash
# Never commit secrets
echo ".env" >> .gitignore

# Use environment variables
const apiKey = process.env.CONNECTOR_API_KEY

# Validate all inputs
const schema = z.object({
  email: z.string().email(),
  amount: z.number().positive()
});
```

### For Production

```bash
# Use HTTPS
NODE_ENV=production

# Enable security headers
helmet({
  contentSecurityPolicy: true,
  hsts: true
})

# Rate limiting
rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})
```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [TypeScript Security Guidelines](https://www.typescriptlang.org/docs/handbook/intro.html)

---

Remember: Security is everyone's responsibility. If something doesn't feel right, speak up!
