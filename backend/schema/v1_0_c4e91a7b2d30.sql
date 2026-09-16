-- Mine Manager AI V1.0 consolidated PostgreSQL schema baseline.
--
-- Contract revision: c4e91a7b2d30
-- Purpose: empty new installations only.
--
-- This file contains schema only. It intentionally contains no tenant,
-- customer, user, credential, demo, or environment-specific data.
-- The guarded bootstrap command verifies database emptiness before executing
-- this artifact and verifies the complete schema before stamping Alembic.

CREATE TABLE public.companies (
    id serial NOT NULL,
    company_name character varying(255) NOT NULL,
    mine_name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT companies_pkey PRIMARY KEY (id)
);

CREATE TABLE public.company_settings (
    id serial NOT NULL,
    company_name character varying(255) NOT NULL,
    company_name_en character varying(255),
    company_name_mn character varying(255),
    logo_url text,
    primary_color character varying(20) DEFAULT '#16A34A'::character varying,
    secondary_color character varying(20) DEFAULT '#1E293B'::character varying,
    timezone character varying(100) DEFAULT 'Asia/Ulaanbaatar'::character varying,
    language character varying(50) DEFAULT 'English'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT company_settings_pkey PRIMARY KEY (id)
);

CREATE TABLE public.mine_settings (
    id serial NOT NULL,
    company_id integer,
    mine_name character varying(255) NOT NULL,
    mine_name_en character varying(255),
    mine_name_mn character varying(255),
    site_code character varying(50),
    location character varying(255),
    mine_type character varying(100),
    shift_pattern character varying(100),
    operating_hours character varying(100),
    calendar_type character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT mine_settings_pkey PRIMARY KEY (id),
    CONSTRAINT mine_settings_company_id_fkey
        FOREIGN KEY (company_id)
        REFERENCES public.company_settings(id)
        ON DELETE CASCADE
);

CREATE TABLE public.users (
    id serial NOT NULL,
    company_id integer NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    role character varying(100) DEFAULT 'Viewer'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_company_id_fkey
        FOREIGN KEY (company_id)
        REFERENCES public.companies(id)
);

CREATE UNIQUE INDEX ix_users_email ON public.users (email);
CREATE INDEX ix_users_company_id ON public.users (company_id);

CREATE TABLE public.kpi_targets (
    id serial NOT NULL,
    mine_id integer,
    kpi_name character varying(255) NOT NULL,
    kpi_code character varying(100),
    kpi_category character varying(100),
    target_value numeric(18,2),
    unit character varying(50),
    warning_threshold numeric(18,2),
    critical_threshold numeric(18,2),
    direction character varying(50) DEFAULT 'higher_is_better'::character varying,
    is_executive boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT kpi_targets_pkey PRIMARY KEY (id),
    CONSTRAINT kpi_targets_mine_id_fkey
        FOREIGN KEY (mine_id)
        REFERENCES public.mine_settings(id)
        ON DELETE CASCADE
);

CREATE TABLE public.alert_thresholds (
    id serial NOT NULL,
    mine_id integer,
    alert_name character varying(255) NOT NULL,
    kpi_name character varying(255),
    warning_value numeric(18,2),
    critical_value numeric(18,2),
    unit character varying(50),
    alert_level character varying(50) DEFAULT 'medium'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT alert_thresholds_pkey PRIMARY KEY (id),
    CONSTRAINT alert_thresholds_mine_id_fkey
        FOREIGN KEY (mine_id)
        REFERENCES public.mine_settings(id)
        ON DELETE CASCADE
);

CREATE TABLE public.shift_patterns (
    id serial NOT NULL,
    mine_id integer,
    shift_name character varying(100) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    shift_type character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shift_patterns_pkey PRIMARY KEY (id),
    CONSTRAINT shift_patterns_mine_id_fkey
        FOREIGN KEY (mine_id)
        REFERENCES public.mine_settings(id)
        ON DELETE CASCADE
);

CREATE TABLE public.production_daily (
    id serial NOT NULL,
    report_date date NOT NULL,
    ore_plan numeric,
    ore_actual numeric,
    waste_plan numeric,
    waste_actual numeric,
    product_coal numeric,
    ash_pct numeric,
    moisture_pct numeric,
    calorific_value numeric,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    mine_name character varying(100) NOT NULL,
    company_id integer NOT NULL,
    mine_id integer NOT NULL,
    CONSTRAINT production_daily_pkey PRIMARY KEY (id),
    CONSTRAINT uq_production_daily_tenant_date
        UNIQUE (company_id, mine_id, report_date),
    CONSTRAINT fk_production_daily_company_id
        FOREIGN KEY (company_id)
        REFERENCES public.company_settings(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_production_daily_mine_id
        FOREIGN KEY (mine_id)
        REFERENCES public.mine_settings(id)
        ON DELETE RESTRICT
);

CREATE INDEX ix_production_daily_company_id ON public.production_daily (company_id);
CREATE INDEX ix_production_daily_mine_id ON public.production_daily (mine_id);
CREATE INDEX ix_production_daily_tenant_date
    ON public.production_daily (company_id, mine_id, report_date);

CREATE TABLE public.fleet_daily (
    id serial NOT NULL,
    report_date date NOT NULL,
    mine_name character varying(100),
    availability numeric,
    utilization numeric,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company_id integer NOT NULL,
    mine_id integer NOT NULL,
    CONSTRAINT fleet_daily_pkey PRIMARY KEY (id),
    CONSTRAINT uq_fleet_daily_tenant_date
        UNIQUE (company_id, mine_id, report_date),
    CONSTRAINT fk_fleet_daily_company_id
        FOREIGN KEY (company_id)
        REFERENCES public.company_settings(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_fleet_daily_mine_id
        FOREIGN KEY (mine_id)
        REFERENCES public.mine_settings(id)
        ON DELETE RESTRICT
);

CREATE INDEX ix_fleet_daily_company_id ON public.fleet_daily (company_id);
CREATE INDEX ix_fleet_daily_mine_id ON public.fleet_daily (mine_id);
CREATE INDEX ix_fleet_daily_tenant_date
    ON public.fleet_daily (company_id, mine_id, report_date);

CREATE TABLE public.plant_daily (
    id serial NOT NULL,
    report_date date NOT NULL,
    mine_name character varying(100) NOT NULL,
    throughput_plan numeric,
    throughput_actual numeric,
    recovery numeric,
    availability numeric,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company_id integer NOT NULL,
    mine_id integer NOT NULL,
    CONSTRAINT plant_daily_pkey PRIMARY KEY (id),
    CONSTRAINT uq_plant_daily_tenant_date
        UNIQUE (company_id, mine_id, report_date),
    CONSTRAINT fk_plant_daily_company_id
        FOREIGN KEY (company_id)
        REFERENCES public.company_settings(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_plant_daily_mine_id
        FOREIGN KEY (mine_id)
        REFERENCES public.mine_settings(id)
        ON DELETE RESTRICT
);

CREATE INDEX ix_plant_daily_company_id ON public.plant_daily (company_id);
CREATE INDEX ix_plant_daily_mine_id ON public.plant_daily (mine_id);
CREATE INDEX ix_plant_daily_tenant_date
    ON public.plant_daily (company_id, mine_id, report_date);

CREATE TABLE public.safety_daily (
    id serial NOT NULL,
    report_date date NOT NULL,
    mine_name character varying(100) NOT NULL,
    incidents integer DEFAULT 0,
    near_misses integer DEFAULT 0,
    critical_risks integer DEFAULT 0,
    safety_score numeric DEFAULT 100,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company_id integer NOT NULL,
    mine_id integer NOT NULL,
    CONSTRAINT safety_daily_pkey PRIMARY KEY (id),
    CONSTRAINT uq_safety_daily_tenant_date
        UNIQUE (company_id, mine_id, report_date),
    CONSTRAINT fk_safety_daily_company_id
        FOREIGN KEY (company_id)
        REFERENCES public.company_settings(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_safety_daily_mine_id
        FOREIGN KEY (mine_id)
        REFERENCES public.mine_settings(id)
        ON DELETE RESTRICT
);

CREATE INDEX ix_safety_daily_company_id ON public.safety_daily (company_id);
CREATE INDEX ix_safety_daily_mine_id ON public.safety_daily (mine_id);
CREATE INDEX ix_safety_daily_tenant_date
    ON public.safety_daily (company_id, mine_id, report_date);

CREATE TABLE public.upload_logs (
    id serial NOT NULL,
    report_type character varying(50) NOT NULL,
    file_name character varying(255) NOT NULL,
    uploaded_by character varying(100),
    status character varying(50) DEFAULT 'Success'::character varying,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company_id integer,
    mine_id integer,
    CONSTRAINT upload_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX ix_upload_logs_company_id ON public.upload_logs (company_id);
CREATE INDEX ix_upload_logs_mine_id ON public.upload_logs (mine_id);
CREATE INDEX ix_upload_logs_tenant ON public.upload_logs (company_id, mine_id);

CREATE TABLE public.report_history (
    id serial NOT NULL,
    report_key character varying(100) NOT NULL,
    report_name character varying(255) NOT NULL,
    report_format character varying(20) NOT NULL,
    filename character varying(500) NOT NULL,
    file_size_bytes bigint,
    generated_by character varying(255),
    company_name character varying(255),
    mine_name character varying(255),
    status character varying(50) DEFAULT 'completed'::character varying NOT NULL,
    error_message text,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id integer NOT NULL,
    mine_id integer NOT NULL,
    CONSTRAINT report_history_pkey PRIMARY KEY (id),
    CONSTRAINT fk_report_history_company_id
        FOREIGN KEY (company_id)
        REFERENCES public.company_settings(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_report_history_mine_id
        FOREIGN KEY (mine_id)
        REFERENCES public.mine_settings(id)
        ON DELETE RESTRICT
);

CREATE INDEX ix_public_report_history_id ON public.report_history (id);
CREATE INDEX ix_public_report_history_report_key ON public.report_history (report_key);
CREATE INDEX ix_public_report_history_report_format ON public.report_history (report_format);
CREATE INDEX ix_public_report_history_status ON public.report_history (status);
CREATE INDEX ix_public_report_history_generated_at ON public.report_history (generated_at);
CREATE INDEX ix_report_history_company_id ON public.report_history (company_id);
CREATE INDEX ix_report_history_mine_id ON public.report_history (mine_id);
CREATE INDEX ix_report_history_tenant ON public.report_history (company_id, mine_id);
CREATE INDEX ix_report_history_tenant_generated_at
    ON public.report_history (company_id, mine_id, generated_at);

CREATE TABLE public.executive_actions (
    id serial NOT NULL,
    action_key character varying(255) NOT NULL,
    kpi_key character varying(100) NOT NULL,
    kpi_name character varying(255),
    linked_cause character varying(50),
    title character varying(500) NOT NULL,
    description text,
    priority character varying(50) DEFAULT 'medium'::character varying NOT NULL,
    owner character varying(255),
    timing character varying(255),
    expected_benefit text,
    status character varying(50) DEFAULT 'open'::character varying NOT NULL,
    due_date date,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id integer NOT NULL,
    mine_id integer NOT NULL,
    source character varying(50),
    category character varying(100),
    CONSTRAINT executive_actions_pkey PRIMARY KEY (id),
    CONSTRAINT uq_executive_actions_tenant_action_key
        UNIQUE (company_id, mine_id, action_key),
    CONSTRAINT fk_executive_actions_company_id
        FOREIGN KEY (company_id)
        REFERENCES public.company_settings(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_executive_actions_mine_id
        FOREIGN KEY (mine_id)
        REFERENCES public.mine_settings(id)
        ON DELETE RESTRICT
);

CREATE INDEX ix_executive_actions_id ON public.executive_actions (id);
CREATE INDEX ix_executive_actions_action_key ON public.executive_actions (action_key);
CREATE INDEX ix_executive_actions_kpi_key ON public.executive_actions (kpi_key);
CREATE INDEX ix_executive_actions_status ON public.executive_actions (status);
CREATE INDEX ix_executive_actions_company_id ON public.executive_actions (company_id);
CREATE INDEX ix_executive_actions_mine_id ON public.executive_actions (mine_id);
CREATE INDEX ix_executive_actions_tenant
    ON public.executive_actions (company_id, mine_id);
CREATE INDEX ix_executive_actions_tenant_status
    ON public.executive_actions (company_id, mine_id, status);

CREATE TABLE public.audit_logs (
    id serial NOT NULL,
    company_id integer NOT NULL,
    actor_user_id integer,
    actor_name character varying(255),
    actor_email character varying(255),
    action character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id integer,
    entity_name character varying(255),
    description text,
    status character varying(50) DEFAULT 'SUCCESS'::character varying NOT NULL,
    ip_address character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
    CONSTRAINT audit_logs_company_id_fkey
        FOREIGN KEY (company_id)
        REFERENCES public.companies(id)
        ON DELETE CASCADE,
    CONSTRAINT audit_logs_actor_user_id_fkey
        FOREIGN KEY (actor_user_id)
        REFERENCES public.users(id)
        ON DELETE SET NULL
);

CREATE INDEX ix_public_audit_logs_id ON public.audit_logs (id);
CREATE INDEX ix_public_audit_logs_company_id ON public.audit_logs (company_id);
CREATE INDEX ix_public_audit_logs_actor_user_id ON public.audit_logs (actor_user_id);
CREATE INDEX ix_public_audit_logs_action ON public.audit_logs (action);
