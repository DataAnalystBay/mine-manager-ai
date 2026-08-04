# Mine Manager AI - Customer Pilot Onboarding

## 1. Purpose

This document defines the standard onboarding workflow for a controlled
Mine Manager AI Version 1.0 customer pilot.

The onboarding process ensures that the customer, pilot sponsor,
administrators, users, data owners, and Mine Manager AI delivery team
understand the pilot scope, responsibilities, timeline, data
requirements, technical requirements, and success criteria.

## 2. Pilot Objective

The objective of the pilot is to demonstrate that Mine Manager AI can:

- Receive validated mine operational data
- Calculate and display operational KPIs
- Present executive-level operational information
- Generate AI executive insights
- Generate predictive operational intelligence
- Support executive action tracking
- Generate management reports
- Provide controlled user access
- Maintain audit and system-health records
- Support repeatable daily and weekly management workflows

## 3. Pilot Deployment Principle

Mine Manager AI Version 1.0 is a decision-support and executive
reporting platform.

During the pilot, it must not directly control:

- Mobile mining equipment
- Dispatch systems
- Processing plant control systems
- SCADA systems
- Safety-critical systems
- Autonomous equipment
- Production control logic

All operational decisions remain the responsibility of authorized
customer personnel.

## 4. Recommended Pilot Duration

The recommended pilot duration is four to eight weeks.

A typical pilot includes:

- Week 0: Preparation and onboarding
- Week 1: Installation and configuration
- Week 2: Data validation and user training
- Weeks 3 to 6: Controlled operational use
- Final week: Acceptance review and next-step decision

The actual duration may be adjusted based on customer data readiness,
technical requirements, and user availability.

## 5. Recommended Pilot Team

### Customer Team

The customer should nominate:

- Executive Sponsor
- Pilot Manager
- System Administrator
- Data Owner
- Operational KPI Owner
- General Manager or Mine Manager
- Technical Services or Planning representative
- Operations representative
- Maintenance representative where applicable
- Safety representative
- Information Technology representative

### Mine Manager AI Team

The Mine Manager AI delivery team should nominate:

- Pilot Delivery Lead
- Technical Deployment Lead
- Product Support Contact
- Data Validation Contact
- Training Contact
- Commercial Contact

## 6. Roles and Responsibilities

### Executive Sponsor

Responsible for:

- Approving the pilot objective
- Supporting customer participation
- Resolving major organizational barriers
- Reviewing pilot outcomes
- Approving the final pilot decision

### Customer Pilot Manager

Responsible for:

- Coordinating customer activities
- Confirming pilot users
- Coordinating data collection
- Scheduling meetings
- Tracking customer actions
- Escalating issues internally

### Customer System Administrator

Responsible for:

- Supporting deployment access
- Managing customer user accounts
- Reviewing access permissions
- Supporting customer configuration
- Coordinating backup and security requirements

### Customer Data Owner

Responsible for:

- Providing operational data
- Confirming data definitions
- Confirming source-system ownership
- Validating uploaded values
- Approving column mapping
- Resolving data-quality issues

### Mine Manager AI Pilot Delivery Lead

Responsible for:

- Managing pilot delivery
- Confirming scope
- Tracking progress
- Coordinating technical activities
- Coordinating user training
- Managing risks and issues
- Preparing pilot review materials

### Mine Manager AI Technical Lead

Responsible for:

- Deploying the application
- Configuring environment variables
- Applying database migrations
- Supporting HTTPS and CORS configuration
- Verifying system health
- Verifying deployment readiness
- Supporting backup and restore testing

## 7. Pilot Onboarding Phases

## Phase 1 - Pilot Qualification

### Objective

Confirm that the customer and mine are suitable for a Version 1.0
pilot.

### Required Activities

- Identify customer organization
- Identify pilot mine or operation
- Identify executive sponsor
- Identify pilot manager
- Confirm pilot problem statement
- Confirm expected business value
- Confirm customer data availability
- Confirm customer technology environment
- Confirm pilot duration
- Confirm expected user group
- Confirm confidentiality requirements
- Confirm commercial or pilot agreement status

### Exit Criteria

- Pilot opportunity is approved
- Executive sponsor is identified
- Pilot mine is confirmed
- High-level scope is agreed
- Required data is expected to be available

## Phase 2 - Scope Confirmation

### Objective

Define exactly what the pilot will and will not include.

### In-Scope Version 1.0 Capabilities

- User authentication
- Role-based user access
- Company and mine configuration
- Production data upload
- Fleet data upload
- Plant data upload
- Safety data upload
- Executive dashboard
- Mine Health information
- AI executive insights
- Predictive intelligence
- Executive actions
- Executive reports
- Audit Trail
- System Health
- Security Configuration Center
- PDF and Excel exports

### Out-of-Scope Unless Separately Approved

- Direct SAP integration
- Direct PI System integration
- Direct SCADA integration
- Direct dispatch-system integration
- Real-time equipment control
- Autonomous mining control
- Mobile application
- Custom ERP integration
- Custom hardware installation
- Safety-critical decision automation
- Replacement of existing statutory reporting systems

### Exit Criteria

- In-scope capabilities are documented
- Out-of-scope items are documented
- Pilot users are identified
- Pilot data sources are identified
- Success criteria are agreed

## Phase 3 - Configuration Collection

### Objective

Collect the information required to configure the pilot environment.

### Required Information

- Company name
- Mine name
- Mine location
- Company logo
- Primary and secondary colors
- Customer timezone
- Preferred language
- Shift pattern
- Reporting calendar
- KPI targets
- KPI warning thresholds
- KPI critical thresholds
- User names and email addresses
- User roles
- Data owners
- Support contacts

### Output

The completed document:

`PILOT_CONFIGURATION_FORM.md`

### Exit Criteria

- Required company details are complete
- Required mine details are complete
- KPI configuration is approved
- Initial users are approved
- Customer support contacts are identified

## Phase 4 - Data Readiness

### Objective

Confirm that customer data can be uploaded and interpreted correctly.

### Required Data Areas

- Production
- Fleet
- Plant
- Safety

### Required Activities

- Provide Excel templates
- Review customer source files
- Map customer columns to Mine Manager AI fields
- Confirm units of measure
- Confirm date format
- Confirm mine-name values
- Validate sample records
- Test invalid records
- Test duplicate records
- Separate customer data from demo data

### Exit Criteria

- At least one valid file is available for each agreed data area
- Column mappings are approved
- Data definitions are approved
- Sample upload succeeds
- KPI results are validated by the customer data owner

## Phase 5 - Technical Deployment

### Objective

Deploy and configure the pilot environment.

### Required Activities

- Deploy PostgreSQL
- Deploy backend
- Deploy frontend
- Configure environment variables
- Configure database connection
- Configure secret key
- Configure CORS
- Configure HTTPS
- Disable debug mode
- Configure logging
- Create logs directory
- Apply Alembic migrations
- Verify static-file access
- Verify upload directory
- Run System Health checks
- Run Security Configuration Center checks

### Exit Criteria

- Application is available
- Login works
- Database connection works
- Required tables exist
- No blocking deployment-readiness failures remain
- HTTPS is available for external pilot use

## Phase 6 - Customer Configuration

### Objective

Configure Mine Manager AI for the pilot customer.

### Required Activities

- Configure company
- Configure mine
- Upload logo
- Configure branding colors
- Configure timezone
- Configure language
- Configure shifts
- Configure KPI targets
- Configure alert thresholds
- Create users
- Assign roles
- Verify permissions

### Exit Criteria

- Customer branding is displayed correctly
- Mine configuration is correct
- KPI targets are correct
- Required users can log in
- Role permissions are verified

## Phase 7 - User Training

### Objective

Prepare customer users for controlled pilot operation.

### Administrator Training

- User Management
- Company and mine configuration
- KPI configuration
- Shift configuration
- System Health
- Security Configuration Center
- Audit Trail
- Backup and restore responsibilities

### Executive User Training

- Executive dashboard
- Mine Health
- KPI cards
- AI executive insights
- Predictive intelligence
- Executive actions
- Executive reports

### Data User Training

- Template requirements
- File naming
- Upload process
- Validation errors
- Duplicate handling
- Upload history
- Data correction process

### Exit Criteria

- Required users attended training
- Users can log in
- Administrator can create and manage a user
- Data user can upload a valid file
- Executive user can review dashboard information
- Training questions are documented

## Phase 8 - Controlled Pilot Launch

### Objective

Begin monitored customer use.

### Required Activities

- Confirm pilot start date
- Confirm support contacts
- Confirm issue-reporting channel
- Confirm daily data process
- Confirm weekly review schedule
- Confirm backup schedule
- Record known issues
- Confirm escalation path
- Activate customer pilot users

### Recommended Operating Rhythm

Daily:

- Upload agreed operational reports
- Review validation results
- Review dashboard
- Review AI insights
- Review priority actions
- Record issues

Weekly:

- Review KPI accuracy
- Review user adoption
- Review system availability
- Review support issues
- Review outstanding actions
- Review pilot success measures

## Phase 9 - Pilot Review

### Objective

Evaluate pilot performance and agree next actions.

### Required Review Areas

- Technical stability
- Data quality
- KPI accuracy
- User adoption
- Executive usefulness
- Reporting usefulness
- AI insight relevance
- Predictive-intelligence usefulness
- Security and access
- Support effectiveness
- Business value
- Customer feedback

### Possible Outcomes

- Proceed to commercial deployment
- Extend the pilot
- Approve a limited production deployment
- Require additional configuration
- Require customer-specific development
- Suspend the pilot
- Close the pilot

## Phase 10 - Final Sign-Off

### Required Sign-Off Roles

- Customer Executive Sponsor
- Customer Pilot Manager
- Customer System Administrator
- Mine Manager AI Pilot Delivery Lead

### Final Sign-Off Confirms

- Acceptance testing was completed
- Critical defects were resolved or formally accepted
- Known limitations were documented
- Customer feedback was recorded
- Data handling responsibilities were confirmed
- Backup responsibilities were confirmed
- Commercial next steps were agreed

## 8. Standard Pilot Meetings

### Pilot Kickoff

Recommended duration: 60 minutes

Agenda:

- Introductions
- Pilot objective
- Scope
- Roles
- Timeline
- Data requirements
- Technical requirements
- Success criteria
- Risks and issues
- Next actions

### Technical Readiness Meeting

Recommended duration: 45 minutes

Agenda:

- Hosting environment
- Database
- Network access
- HTTPS
- CORS
- Security
- User access
- Backup
- Support

### Data Readiness Meeting

Recommended duration: 60 minutes

Agenda:

- Source files
- Data owners
- Column mapping
- Units
- Date formats
- KPI definitions
- Missing data
- Historical data
- Upload testing

### Weekly Pilot Review

Recommended duration: 30 to 45 minutes

Agenda:

- Pilot status
- KPI validation
- User activity
- Issues
- Risks
- Support requests
- Success measures
- Next-week priorities

### Final Pilot Review

Recommended duration: 60 minutes

Agenda:

- Pilot outcomes
- Success criteria
- User feedback
- Technical results
- Business value
- Known issues
- Commercial options
- Final decision

## 9. Pilot Risks

Common pilot risks include:

- Customer data is unavailable
- Customer data definitions are inconsistent
- Historical data is incomplete
- KPI formulas differ between departments
- Customer users are unavailable
- Technical environment is delayed
- HTTPS or network approval is delayed
- Customer expectations exceed Version 1.0 scope
- Demo data is confused with customer data
- Customer ownership is unclear
- Support issues are not reported promptly

Each risk should have:

- Owner
- Impact
- Probability
- Mitigation
- Due date
- Status

## 10. Change Control

Any requested change should be classified as:

- Configuration change
- Data-mapping change
- Defect correction
- Training requirement
- Pilot-scope change
- Future product enhancement
- Customer-specific development

Scope changes must be approved before implementation.

Customer-specific development should not be added informally during the
pilot.

## 11. Pilot Support

Support requests should include:

- Customer name
- Mine name
- User name
- Date and time
- Page or feature
- Description
- Expected result
- Actual result
- Screenshot where available
- Error message
- Business impact
- Urgency

Critical security incidents must follow the incident-response process.

## 12. Completion Checklist

The onboarding process is complete when:

- [ ] Pilot sponsor is confirmed
- [ ] Pilot manager is confirmed
- [ ] Scope is approved
- [ ] Configuration form is complete
- [ ] Success criteria are approved
- [ ] Data owners are identified
- [ ] Sample data is available
- [ ] Deployment environment is available
- [ ] Users are identified
- [ ] Support contacts are identified
- [ ] Pilot meetings are scheduled
- [ ] Pilot launch approval is received