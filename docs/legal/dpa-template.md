# Data Processing Agreement (DPA) Template

**For use with:** Plane A B2B/Institutional API clients
**Owner:** Legal / DPO
**Last reviewed:** 2026-02-21

---

## DATA PROCESSING AGREEMENT

This Data Processing Agreement ("DPA") forms part of the Master Services Agreement
(the "Agreement") between:

**Data Controller:** [Client Name] ("Controller")
**Data Processor:** RemitScout Ltd ("Processor")

**Effective Date:** [Date]

---

### 1. Definitions

- **Personal Data:** Any information relating to an identified or identifiable natural person
  as defined in GDPR Article 4(1).
- **Processing:** Any operation performed on Personal Data as defined in GDPR Article 4(2).
- **Sub-Processor:** Any third party engaged by the Processor to process Personal Data.
- **Data Subject:** The individual to whom the Personal Data relates.
- **Supervisory Authority:** The relevant data protection authority.

---

### 2. Scope and Purpose of Processing

| Category | Details |
|----------|---------|
| **Subject matter** | Provision of remittance comparison API services |
| **Duration** | Term of the Agreement plus data retention period |
| **Nature of processing** | Collection, storage, retrieval, aggregation, anonymization |
| **Purpose** | Delivering real-time remittance rate comparisons and market indices |
| **Categories of data subjects** | API end-users, Controller's customers |
| **Categories of personal data** | API keys, IP addresses, query parameters (corridor, amount), usage logs |

---

### 3. Processor Obligations

The Processor shall:

a) Process Personal Data only on documented instructions from the Controller (Article 28(3)(a)).

b) Ensure that persons authorized to process Personal Data have committed to confidentiality
   (Article 28(3)(b)).

c) Implement appropriate technical and organizational security measures, including:
   - Encryption at rest (AES-256 via AWS KMS CMK) and in transit (TLS 1.2+)
   - Network isolation (VPC, security groups, private subnets)
   - Access controls (IAM roles, JWT authentication, API key rotation)
   - Audit logging with 90-day retention
   - WAF protection with bot control and rate limiting

d) Not engage another processor without prior written authorization (Article 28(2)).
   See [Third-Party Processors](./third-party-processors.md) for current sub-processor list.

e) Assist the Controller in responding to data subject requests (Article 28(3)(e)).

f) Assist the Controller in ensuring compliance with Articles 32-36 (security, breach
   notification, DPIA, prior consultation).

g) At the choice of the Controller, delete or return all Personal Data after the end of
   the provision of services (Article 28(3)(g)).

h) Make available all information necessary to demonstrate compliance and allow for audits
   (Article 28(3)(h)).

---

### 4. Sub-Processors

4.1 The Controller authorizes the use of the sub-processors listed in the
[Third-Party Processors Registry](./third-party-processors.md).

4.2 The Processor shall notify the Controller at least 30 days before adding or replacing
a sub-processor.

4.3 The Processor shall ensure sub-processors are bound by equivalent data protection
obligations.

---

### 5. International Data Transfers

5.1 Personal Data is primarily processed in AWS us-east-1 (N. Virginia, USA).

5.2 For transfers outside the EEA, the Processor relies on:
- EU Standard Contractual Clauses (SCCs) as annexed to this DPA
- AWS's compliance with the EU-US Data Privacy Framework (where applicable)

---

### 6. Data Retention and Deletion

| Data Category | Retention Period | Deletion Method |
|--------------|-----------------|-----------------|
| API access logs | 90 days | Automatic S3 lifecycle expiration |
| Query logs | 90 days | Automatic S3 lifecycle expiration |
| Aggregated/anonymized data | 2 years | S3 lifecycle (Glacier -> Deep Archive -> delete) |
| Audit logs | 1 year (active), archived to Glacier at 90 days | S3 lifecycle policy |
| API keys | Account lifetime + 30 days | Secrets Manager deletion |

Upon termination, the Processor shall delete all Personal Data within 30 days unless
retention is required by applicable law.

---

### 7. Data Breach Notification

7.1 The Processor shall notify the Controller without undue delay (and in any event within
48 hours) after becoming aware of a Personal Data breach.

7.2 The notification shall include:
- Nature of the breach
- Categories and approximate number of data subjects affected
- Likely consequences
- Measures taken or proposed to address the breach

See [Incident Response Plan](../security/incident-response-plan.md) for internal procedures.

---

### 8. Data Subject Rights

The Processor shall assist the Controller in fulfilling obligations to respond to data
subject requests, including:
- Right of access (Article 15)
- Right to rectification (Article 16)
- Right to erasure (Article 17)
- Right to restriction of processing (Article 18)
- Right to data portability (Article 20)
- Right to object (Article 21)

The Processor provides GDPR data export and deletion endpoints via the API.

---

### 9. Audit Rights

9.1 The Processor shall make available all information necessary to demonstrate compliance.

9.2 The Controller may conduct audits (or appoint a third-party auditor) with 30 days'
written notice, no more than once per year, during business hours.

9.3 The Processor may satisfy audit obligations by providing:
- SOC 2 Type II report (when available)
- AWS compliance certifications
- Penetration test results (redacted)
- Evidence of security controls

---

### 10. Liability and Indemnification

Liability under this DPA is subject to the limitations set forth in the Agreement.

---

### 11. Term and Termination

This DPA shall remain in effect for the duration of the Agreement. Data processing
obligations survive termination until all Personal Data is deleted.

---

### Signatures

| | Controller | Processor |
|---|-----------|-----------|
| **Name** | _________________ | _________________ |
| **Title** | _________________ | _________________ |
| **Date** | _________________ | _________________ |
| **Signature** | _________________ | _________________ |

---

## Annex A: Standard Contractual Clauses

*[Attach EU SCCs (Commission Implementing Decision 2021/914) as applicable]*

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-02-21 | Initial template | Engineering / Legal |
