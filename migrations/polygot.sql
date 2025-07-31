--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: polygot_owner
--

CREATE TABLE public.api_keys (
    email text NOT NULL,
    api_key text NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.api_keys OWNER TO polygot_owner;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: polygot_owner
--

CREATE TABLE public.user_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO polygot_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: polygot_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    profile_image text
);


ALTER TABLE public.users OWNER TO polygot_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: polygot_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO polygot_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: polygot_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: polygot_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: polygot_owner
--

COPY public.api_keys (email, api_key, password) FROM stdin;
sharmavipul01002@gmail.com	plg1aVEz6iYHcgf3elrfZrE6hINOCmXh	Vipu2004@
vipul3589@gmail.com	plgosAJwLmvG2QUJPerfEBxBy3RBYYeu	Vipu2004@
vipultest691@gmail.com	plgi6X6Gijo4GbHPST4GxgyKF6ZCPUI3	Vipu2004@
godsplanhk@gmail.com	plgTr0MExgf7lMzZvih0WKIUl4lyZ9QH	Itsmehk@123
parththerockstar77@gmail.com	plgDROTVYNx3k4vzjNH8tQLLEk8x1hgr	Hansraj@07
iamkriti2005@gmail.com	plgoBOjgoIqda5Vwt5XjiJz1v4E5Egmf	123456789Aa
sayhitoveer@gmail.com	plglR5MuySqSJtEPyVlNbaEPTaHeYAAd	Atharva@2021
edtwaliki@gmail.com	plgryN180yLpMtdy9KivCgnvgXmzxJy1	Vipu2004@
shubhmahajan16@gmail.com	plgpEYXBa53dQ7JOmfjqV3WjlZIAzuI9	Vipulkabaap07
iamamrit27@gmail.com	plgRXgBl0SRJbFn9JQjiTG25DSjM3KYo	_1IAmAmrit1_
parth.gupt07@gmail.com	plgGD8pnOgjPuONqxXOxJxE9PMHuxfs1	Hansraj@07
work.kamalveer@gmail.com	plg5L7EyjhIXqCj4iS7sNWKQD3zpBdxP	Kamal$tark92%
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: polygot_owner
--

COPY public.user_sessions (sid, sess, expire) FROM stdin;
BAQnBinMibBB6TEdG8YvEJQqVilOuohX	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-05T13:35:48.191Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":2}}	2025-07-05 13:35:49
1tjkhxZdeTfABRehFvloRXjTGIXUeWWK	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-06T03:03:24.009Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":7}}	2025-07-06 03:07:56
Mp4aVNcfjod0IOkDNxGKUsPgcarXkgfI	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-05T12:44:50.104Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":3}}	2025-07-05 12:44:51
TFekm4nCLnjg1Fkpw5oqRX6YlDj7byBe	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-05T14:26:25.680Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":2}}	2025-07-05 14:26:26
XkRsM3VLfPMUviXi-hMXbz7H3kjrUUux	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-05T12:53:38.882Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":4}}	2025-07-05 12:53:39
pOtNON-PZ3x0QG6CAPwq6osAFvtLLRgD	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-06T10:49:01.919Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":2}}	2025-07-06 10:49:02
d_tjbPr2RVPio3eijORII1onoB4SXi_f	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-05T16:13:13.154Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":3}}	2025-07-05 16:13:14
TtlB5wJqvHZ77Sh2K15i6qLl7MGlDB68	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-05T12:47:19.689Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":7}}	2025-07-05 12:54:28
8LfDk3dJiRnkvKQCN_etI40J9eknZxEl	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-05T12:54:16.675Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":8}}	2025-07-05 12:55:04
iFdk4GQLFQaLdLjAo7XnbOZNmI8U4GBF	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-05T13:27:27.459Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":9}}	2025-07-05 13:27:28
v8_SEr6aOOtOiy4E4KV-hgc-z5Z6rOX8	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-05T13:28:15.855Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":9}}	2025-07-05 13:28:56
3DwCMdMcQOo3YK7rAZZUaTUB6386xBn7	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-06T17:44:07.742Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":2}}	2025-07-06 17:46:59
dbFmVmzmryVHPbr21A05IdlGGkomnY2E	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-05T21:29:25.817Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":10}}	2025-07-05 21:30:58
XMt3Fegs1YJrLiyua4YVXav8I31x5nTq	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-06T11:23:17.739Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":2}}	2025-07-06 11:23:18
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: polygot_owner
--

COPY public.users (id, email, name, profile_image) FROM stdin;
2	sharmavipul01002@gmail.com	VIPUL SHARMA	https://lh3.googleusercontent.com/a/ACg8ocIOg2s8i1u4iKtWXd0N7loRIWDxDPZFpHG21kJYqaqJV9T0eTPj=s96-c
3	vipul3589@gmail.com	VIPUL SHARMA	https://lh3.googleusercontent.com/a/ACg8ocKP5oh2R_09h5fYW8VwjS3GH2a7IdIJnmL4B9jEQuk0JRd6sam3=s96-c
4	parth.gupt07@gmail.com	PARTH GUPTA	https://lh3.googleusercontent.com/a/ACg8ocJuvZMytupQqZPZEhLyKJH-PwCRl0vMqT3YpVKAheyExgHXqNQ=s96-c
5	vipulplays@gmail.com	Fuck you BITCH	https://lh3.googleusercontent.com/a/ACg8ocI-tM0sePuUIzTaP-FON0Dl3b7ICrcjjtmbHeR1bX1oyuV8IdEs=s96-c
6	vipultest691@gmail.com	Vipul Sharma	https://lh3.googleusercontent.com/a/ACg8ocIRfEajdLcU1pJWmzlgWW68Sy-kh9gDBcVu9yE4VV9C13klKw=s96-c
7	godsplanhk@gmail.com	Hare Krishna Raj	https://lh3.googleusercontent.com/a/ACg8ocIwDLaIini2DQOIKuw0JroLcT9jOeOfFy1Xlx3TzSlzFg5Whrqm=s96-c
8	parththerockstar77@gmail.com	Parth Gupta	https://lh3.googleusercontent.com/a/ACg8ocJsVZu6qcPUGrdnbDA8TgQS7uHugwvv5rGHJRDHWGh8b1i9cxn2=s96-c
9	iamkriti2005@gmail.com	Kriti Upadhyay	https://lh3.googleusercontent.com/a/ACg8ocJ_zJEKVMBuPMcs1YbcCqFvpqlFMLNCZUHz8ZWckm2hBlaHj4g=s96-c
10	sayhitoveer@gmail.com	Veer Sharma	https://lh3.googleusercontent.com/a/ACg8ocKEcGkaabOylrHE9LanFdP0oKGhHH60wkzEjdsZcp0szeXLspc=s96-c
11	shubhmahajan16@gmail.com	Shubh Mahajan	https://lh3.googleusercontent.com/a/ACg8ocLBbJnneLbIqnpRJE8MLPHiXAxgrm7MYZ5yqu-6b7tkX1GaYA=s96-c
12	edtwaliki@gmail.com	edt.waliki.123	https://lh3.googleusercontent.com/a/ACg8ocKDv0Lpy4EGlz2ZK8MEIPlujlpdSQedOxdwPJt5Sm22pA1tpg=s96-c
13	iamamrit27@gmail.com	Amrit Rai	https://lh3.googleusercontent.com/a/ACg8ocJC_s1dVYb-X2IK2nyowMdVzhio2Xb0toMZ5Q2WslybfS9UWnJVKQ=s96-c
14	mnkr12345@gmail.com	No Host	https://lh3.googleusercontent.com/a/ACg8ocINaLWhgbQffE2r6PxNaBZZhB3XdE-2J9voKmppd0vbYdfl5JBx=s96-c
15	brooksoulking008@gmail.com	Brook Soul	https://lh3.googleusercontent.com/a/ACg8ocKv0CQI8U5UGW9NjJi1aHcAidaboDIq3a7lOFz8v3AayH1XO6M=s96-c
16	bilal.bakr.elsherif@gmail.com	Bilal Bakr	https://lh3.googleusercontent.com/a/ACg8ocLb09b4Ng_RdhchOIn0pEMXZcqz3qlVyckFECEXXm5aFLO66L-T=s96-c
17	karansingh5112002@gmail.com	karan singh	https://lh3.googleusercontent.com/a/ACg8ocJ2Audz6ksvzP0uUjkZDix8gSteiNeS6LuEcivG3EFbZD-Yhg=s96-c
18	work.kamalveer@gmail.com	Kamalveer Singh	https://lh3.googleusercontent.com/a/ACg8ocIVbajH65sx1JBtO-q22_iK0bwZq3J8Nxf24cIYbWzYUVJ2UjU=s96-c
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: polygot_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 18, true);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: polygot_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (email);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: polygot_owner
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: polygot_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: polygot_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

