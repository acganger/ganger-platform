-- Converted from MySQL to PostgreSQL
-- Legacy Ganger Platform Data Migration
-- Generated on 2025-07-14 21:49:00

BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create mapping table for old IDs to new UUIDs
CREATE TABLE IF NOT EXISTS legacy_id_mapping (
    table_name TEXT NOT NULL,
    legacy_id INTEGER NOT NULL,
    new_uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
    PRIMARY KEY (table_name, legacy_id)
);

-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 14, 2025 at 09:43 PM
-- Server version: 10.5.26-MariaDB-cll-lve
-- PHP Version: 8.3.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: "gangerne_apihub"
--

DELIMITER $$
--
-- Procedures
--
$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table "staff_approvals"
--

CREATE TABLE "staff_approvals" (
  "id" int(11) NOT NULL,
  "ticket_id" int(11) NOT NULL,
  "approver_email" VARCHAR(200) NOT NULL,
  "action" enum('Approved','Denied') NOT NULL,
  "comments" TEXT DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT current_timestamp()
)   ;

-- --------------------------------------------------------

--
-- Table structure for table "staff_file_uploads"
--

CREATE TABLE "staff_file_uploads" (
  "id" int(11) NOT NULL,
  "ticket_id" int(11) NOT NULL,
  "filename" VARCHAR(255) NOT NULL,
  "original_filename" VARCHAR(255) NOT NULL,
  "file_size" int(11) NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "upload_path" VARCHAR(500) NOT NULL,
  "uploaded_by" VARCHAR(255) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  "archived_at" TIMESTAMP NULL DEFAULT NULL
)   ;

-- --------------------------------------------------------

--
-- Table structure for table "staff_job_queue"
--

CREATE TABLE "staff_job_queue" (
  "id" int(11) NOT NULL,
  "handler" VARCHAR(100) NOT NULL,
  "payload" TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid("payload")),
  "priority" int(11) DEFAULT 0,
  "retry_count" int(11) DEFAULT 0,
  "status" enum('pending','running','complete','failed') DEFAULT 'pending',
  "created_at" TIMESTAMP DEFAULT current_timestamp()
)   ;

--
-- Dumping data for table "staff_job_queue"
--

INSERT INTO "staff_job_queue" ("id", "handler", "payload", "priority", "retry_count", "status", "created_at") VALUES
(1, 'NotifyNewTicket', '{\"ticket_id\":\"1\",\"priority\":\"Medium\"}', 0, 1, 'failed', '2025-05-02 20:44:52'),
(2, 'NotifyNewTicket', '{\"ticket_id\": 1, \"priority\": \"High\"}', 0, 1, 'failed', '2025-05-03 00:18:44'),
(3, 'NotifyNewTicket', '{\"ticket_id\":\"69\",\"priority\":null}', 0, 0, 'pending', '2025-05-05 11:14:26'),
(4, 'NotifyNewTicket', '{\"ticket_id\":\"70\",\"priority\":null}', 0, 0, 'pending', '2025-05-05 15:04:24'),
(5, 'NotifyNewTicket', '{\"ticket_id\":\"71\",\"priority\":\"\"}', 0, 0, 'pending', '2025-05-06 12:16:06'),
(6, 'NotifyNewTicket', '{\"ticket_id\":\"72\",\"priority\":null}', 0, 0, 'pending', '2025-05-06 14:15:55'),
(7, 'NotifyNewTicket', '{\"ticket_id\":\"73\",\"priority\":\"\"}', 0, 0, 'pending', '2025-05-07 00:00:43'),
(8, 'NotifyNewTicket', '{\"ticket_id\":122,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"anand@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-03 04:32:56'),
(9, 'NotifyNewTicket', '{\"ticket_id\":127,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"anand@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-03 22:43:22'),
(10, 'NotifyNewTicket', '{\"ticket_id\":129,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"sunil@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-03 23:53:20'),
(11, 'NotifyNewTicket', '{\"ticket_id\":130,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"personnel@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-04 12:09:16'),
(12, 'NotifyNewTicket', '{\"ticket_id\":131,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"mclean@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-04 13:04:38'),
(13, 'NotifyNewTicket', '{\"ticket_id\":132,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"ops@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-04 15:06:46'),
(14, 'NotifyNewTicket', '{\"ticket_id\":133,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"ops@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-04 15:07:25'),
(15, 'NotifyNewTicket', '{\"ticket_id\":134,\"form_type\":\"change_of_availability\",\"priority\":null,\"submitter_email\":\"ops@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-04 15:08:51'),
(16, 'NotifyNewTicket', '{\"ticket_id\":135,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"sam@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-04 20:04:15'),
(17, 'NotifyNewTicket', '{\"ticket_id\":136,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"sam@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-04 20:05:58'),
(18, 'NotifyNewTicket', '{\"ticket_id\":137,\"form_type\":\"support_ticket\",\"priority\":\"Not Urgent + Important\",\"submitter_email\":\"mccarver@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-05 12:19:20'),
(19, 'NotifyNewTicket', '{\"ticket_id\":138,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"personnel@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-05 13:46:52'),
(20, 'NotifyNewTicket', '{\"ticket_id\":139,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"sam@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-05 13:57:29'),
(21, 'NotifyNewTicket', '{\"ticket_id\":140,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"jordan@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-05 14:59:18'),
(22, 'NotifyNewTicket', '{\"ticket_id\":141,\"form_type\":\"support_ticket\",\"priority\":\"Urgent + Important\",\"submitter_email\":\"jessie@gangerdermatology.com\"}', 1, 0, 'pending', '2025-06-05 16:49:31'),
(23, 'NotifyNewTicket', '{\"ticket_id\":142,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"dionne@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-05 17:22:17'),
(24, 'NotifyNewTicket', '{\"ticket_id\":143,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"compliance@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-05 17:59:17'),
(25, 'NotifyNewTicket', '{\"ticket_id\":144,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"compliance@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-05 18:01:37'),
(26, 'NotifyNewTicket', '{\"ticket_id\":145,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"peppard@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-06 16:43:54'),
(27, 'NotifyNewTicket', '{\"ticket_id\":146,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"peppard@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-06 16:48:57'),
(28, 'NotifyNewTicket', '{\"ticket_id\":147,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"orlandi@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-07 16:23:00'),
(29, 'NotifyNewTicket', '{\"ticket_id\":148,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"dionne@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-09 18:09:35'),
(30, 'NotifyNewTicket', '{\"ticket_id\":149,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"traction@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-09 20:01:43'),
(31, 'NotifyNewTicket', '{\"ticket_id\":150,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"personnel@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-10 12:08:23'),
(32, 'NotifyNewTicket', '{\"ticket_id\":151,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"hailey@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-10 15:45:17'),
(33, 'NotifyNewTicket', '{\"ticket_id\":152,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"hailey@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-10 15:48:42'),
(34, 'NotifyNewTicket', '{\"ticket_id\":153,\"form_type\":\"support_ticket\",\"priority\":\"Urgent + Important\",\"submitter_email\":\"fisher@gangerdermatology.com\"}', 1, 0, 'pending', '2025-06-11 14:52:40'),
(35, 'NotifyNewTicket', '{\"ticket_id\":154,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"personnel@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-11 15:22:08'),
(36, 'NotifyNewTicket', '{\"ticket_id\":155,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"smith@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-11 15:25:35'),
(37, 'NotifyNewTicket', '{\"ticket_id\":156,\"form_type\":\"support_ticket\",\"priority\":\"Not Urgent + Important\",\"submitter_email\":\"mccarver@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-12 14:49:39'),
(38, 'NotifyNewTicket', '{\"ticket_id\":157,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"personnel@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-13 12:20:22'),
(39, 'NotifyNewTicket', '{\"ticket_id\":158,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"personnel@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-13 12:26:44'),
(40, 'NotifyNewTicket', '{\"ticket_id\":159,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"orlandi@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-13 13:55:31'),
(41, 'NotifyNewTicket', '{\"ticket_id\":160,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"smith@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-13 16:53:18'),
(42, 'NotifyNewTicket', '{\"ticket_id\":161,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"sam@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-16 14:08:43'),
(43, 'NotifyNewTicket', '{\"ticket_id\":162,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"sam@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-16 14:21:26'),
(44, 'NotifyNewTicket', '{\"ticket_id\":163,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"gutowsky@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-16 17:13:37'),
(45, 'NotifyNewTicket', '{\"ticket_id\":164,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"chiravuri@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-16 20:21:16'),
(46, 'NotifyNewTicket', '{\"ticket_id\":165,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"peppard@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-17 13:29:15'),
(47, 'NotifyNewTicket', '{\"ticket_id\":166,\"form_type\":\"meeting_request\",\"priority\":null,\"submitter_email\":\"peppard@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-17 13:44:02'),
(48, 'NotifyNewTicket', '{\"ticket_id\":168,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"personnel@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-17 19:12:29'),
(49, 'NotifyNewTicket', '{\"ticket_id\":169,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"campbell@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-18 16:57:22'),
(50, 'NotifyNewTicket', '{\"ticket_id\":170,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"mckenzie@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-18 18:44:02'),
(51, 'NotifyNewTicket', '{\"ticket_id\":171,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"mckenzie@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-18 18:44:53'),
(52, 'NotifyNewTicket', '{\"ticket_id\":172,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"sunil@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-18 21:37:45'),
(53, 'NotifyNewTicket', '{\"ticket_id\":173,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"personnel@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-19 14:14:56'),
(54, 'NotifyNewTicket', '{\"ticket_id\":174,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"jordan@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-19 14:24:12'),
(55, 'NotifyNewTicket', '{\"ticket_id\":175,\"form_type\":\"support_ticket\",\"priority\":\"Not Urgent + Important\",\"submitter_email\":\"mccarver@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-19 19:36:08'),
(56, 'NotifyNewTicket', '{\"ticket_id\":176,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"sam@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-19 21:09:06'),
(57, 'NotifyNewTicket', '{\"ticket_id\":177,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"jen@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-20 12:06:42'),
(58, 'NotifyNewTicket', '{\"ticket_id\":178,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"younas@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-20 15:47:13'),
(59, 'NotifyNewTicket', '{\"ticket_id\":179,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"younas@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-20 17:28:53'),
(60, 'NotifyNewTicket', '{\"ticket_id\":180,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"jordan@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-20 18:10:42'),
(61, 'NotifyNewTicket', '{\"ticket_id\":181,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"personnel@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-20 21:11:17'),
(62, 'NotifyNewTicket', '{\"ticket_id\":182,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"kempainen@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-21 21:56:55'),
(63, 'NotifyNewTicket', '{\"ticket_id\":183,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"kempainen@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-21 22:17:20'),
(64, 'NotifyNewTicket', '{\"ticket_id\":184,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"topic@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-23 11:52:46'),
(65, 'NotifyNewTicket', '{\"ticket_id\":185,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"brissette@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-23 13:53:38'),
(66, 'NotifyNewTicket', '{\"ticket_id\":186,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"personnel@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-23 14:01:22'),
(67, 'NotifyNewTicket', '{\"ticket_id\":187,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"personnel@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-24 14:52:50'),
(68, 'NotifyNewTicket', '{\"ticket_id\":188,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"sam@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-25 19:35:51'),
(69, 'NotifyNewTicket', '{\"ticket_id\":189,\"form_type\":\"support_ticket\",\"priority\":\"Urgent + Important\",\"submitter_email\":\"smith@gangerdermatology.com\"}', 1, 0, 'pending', '2025-06-26 14:57:56'),
(70, 'NotifyNewTicket', '{\"ticket_id\":190,\"form_type\":\"support_ticket\",\"priority\":\"Not Urgent + Not Important\",\"submitter_email\":\"sam@gangerdermatology.com\"}', 4, 0, 'pending', '2025-06-27 18:16:13'),
(71, 'NotifyNewTicket', '{\"ticket_id\":191,\"form_type\":\"support_ticket\",\"priority\":\"Not Urgent + Important\",\"submitter_email\":\"mclean@gangerdermatology.com\"}', 3, 0, 'pending', '2025-06-30 20:18:38'),
(72, 'NotifyNewTicket', '{\"ticket_id\":192,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"personnel@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-01 17:07:49'),
(73, 'NotifyNewTicket', '{\"ticket_id\":193,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"topic@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-02 11:31:51'),
(74, 'NotifyNewTicket', '{\"ticket_id\":194,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"traction@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-02 15:51:09'),
(75, 'NotifyNewTicket', '{\"ticket_id\":195,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"brissette@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-02 21:41:58'),
(76, 'NotifyNewTicket', '{\"ticket_id\":196,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"topic@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-03 12:38:16'),
(77, 'NotifyNewTicket', '{\"ticket_id\":197,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"dionne@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-03 19:10:09'),
(78, 'NotifyNewTicket', '{\"ticket_id\":198,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"mehdi@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-03 21:20:34'),
(79, 'NotifyNewTicket', '{\"ticket_id\":199,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"kempainen@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-07 18:07:05'),
(80, 'NotifyNewTicket', '{\"ticket_id\":200,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"topic@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-08 01:12:55'),
(81, 'NotifyNewTicket', '{\"ticket_id\":201,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"topic@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-08 01:13:43'),
(82, 'NotifyNewTicket', '{\"ticket_id\":202,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"topic@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-08 01:14:44'),
(83, 'NotifyNewTicket', '{\"ticket_id\":203,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"topic@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-08 01:15:29'),
(84, 'NotifyNewTicket', '{\"ticket_id\":204,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"jordan@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-11 19:19:51'),
(85, 'NotifyNewTicket', '{\"ticket_id\":205,\"form_type\":\"punch_fix\",\"priority\":null,\"submitter_email\":\"jordan@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-14 13:38:47'),
(86, 'NotifyNewTicket', '{\"ticket_id\":206,\"form_type\":\"time_off_request\",\"priority\":null,\"submitter_email\":\"kempainen@gangerdermatology.com\"}', 3, 0, 'pending', '2025-07-14 19:23:12');

-- --------------------------------------------------------

--
-- Table structure for table "staff_login_attempts"
--

CREATE TABLE "staff_login_attempts" (
  "id" int(11) NOT NULL,
  "ip_address" VARCHAR(45) NOT NULL,
  "email" VARCHAR(255) DEFAULT NULL,
  "success" tinyint(1) NOT NULL DEFAULT 0,
  "user_agent" VARCHAR(255) DEFAULT NULL,
  "locked_until" TIMESTAMP NULL DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT current_timestamp()
)   ;

--
-- Dumping data for table "staff_login_attempts"
--

INSERT INTO "staff_login_attempts" ("id", "ip_address", "email", "success", "user_agent", "locked_until", "created_at") VALUES
(1, '50.238.160.230', 'anand@gangerdermatology.com', 1, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', NULL, '2025-05-30 13:42:47'),
(2, '50.238.161.46', 'office@gangerdermatology.com', 1, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15', NULL, '2025-05-30 14:18:38'),
(3, '97.156.180.168', 'personnel@gangerdermatology.com', 1, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Mobile/15E148 Safari/604.1', NULL, '2025-05-30 15:26:32'),
(4, '50.238.160.230', 'sunil@gangerdermatology.com', 1, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', NULL, '2025-05-30 15:48:42'),
(5, '50.216.114.162', 'jessie@gangerdermatology.com', 1, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', NULL, '2025-05-30 15:52:44'),
(6, '50.238.160.230', 'anand@gangerdermatology.com', 1, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', NULL, '2025-05-30 15:58:41'),
(7, '50.238.160.230', 'anand@gangerdermatology.com', 1, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', NULL, '2025-05-30 16:57:42'),
(8, '50.238.160.230', 'anand@gangerdermatology.com', 1, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', NULL, '2025-05-30 18:09:37'),
(9, '50.238.160.230', 'anand@gangerdermatology.com', 1, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', NULL, '2025-05-30 18:53:30'),
(10, '50.238.160.230', 'anand@gangerdermatology.com', 1, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', NULL, '2025-05-30 22:24:36'),
(11, '50.238.160.230', 'anand@gangerdermatology.com', 1, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', NULL, '2025-05-31 01:44:53'),
(12, '50.238.160.230', 'anand@gangerdermatology.com', 1, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', NULL, '2025-05-31 03:30:35');

-- --------------------------------------------------------

--
-- Table structure for table "staff_notifications"
--

CREATE TABLE "staff_notifications" (
  "id" int(11) NOT NULL,
  "ticket_id" int(11) NOT NULL,
  "channel" enum('email','slack') NOT NULL,
  "recipient" VARCHAR(200) NOT NULL,
  "payload" TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid("payload")),
  "sent_at" TIMESTAMP DEFAULT current_timestamp(),
  "status" enum('sent','failed') DEFAULT 'sent',
  "error_message" TEXT DEFAULT NULL
)   ;

-- --------------------------------------------------------

--
-- Table structure for table "staff_pending_hires"
--

CREATE TABLE "staff_pending_hires" (
  "id" int(11) NOT NULL,
  "first_name" VARCHAR(100) NOT NULL,
  "last_name" VARCHAR(100) NOT NULL,
  "personal_email" VARCHAR(255) NOT NULL,
  "personal_mobile" VARCHAR(50) DEFAULT NULL,
  "generated_username" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT current_timestamp()
)   ;

-- --------------------------------------------------------

--
-- Table structure for table "staff_tickets"
--

CREATE TABLE "staff_tickets" (
  "id" int(11) NOT NULL,
  "submitter_email" VARCHAR(200) NOT NULL,
  "form_type" VARCHAR(50) NOT NULL,
  "status" enum('Pending Approval','Open','In Progress','Stalled','Approved','Denied','Completed') NOT NULL DEFAULT 'Pending Approval',
  "priority" VARCHAR(50) DEFAULT NULL,
  "location" VARCHAR(100) DEFAULT NULL,
  "assigned_to_email" VARCHAR(200) DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT current_timestamp(),
  "updated_at" TIMESTAMP DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  "payload" TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid("payload")),
  "action_taken_at" TIMESTAMP DEFAULT NULL,
  "completed_by" VARCHAR(255) DEFAULT NULL,
  "request_type_virtual" VARCHAR(100) GENERATED ALWAYS AS (json_unquote(json_extract("payload",'$.request_type'))) VIRTUAL
)   ;

--
-- Dumping data for table "staff_tickets"
--

INSERT INTO "staff_tickets" ("id", "submitter_email", "form_type", "status", "priority", "location", "assigned_to_email", "created_at", "updated_at", "payload", "action_taken_at", "completed_by") VALUES
(2, 'dayla@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Wixom', NULL, '2024-08-19 14:44:31', '2025-05-21 23:31:02', '{\"priority\":\"Urgent + Important\",\"details\":\"The issue is when we send KGM''s video visit link it appears on the patients end as KLM''s video visit link. We resent the link and double checked to make sure it said Michels, which it did. Patient said it said waiting for host to join, yet when we joined both KGM and KLM''s video zoom \\\"rooms\\\" it only showed us (host) in the room and not the patient.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Dayla Balistreri\",\"request_type\":\"Admin Issue\"}', NULL, NULL),
(3, 'mccarver@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Wixom', NULL, '2024-09-19 09:01:09', '2025-05-21 23:31:02', '{\"priority\":\"Not Urgent + Important\",\"details\":\"This is not the first request for this problem, but our video visit\\/consult room door will not close fully. It is difficult to get it to close at all (i.e. wedging it a tiny bit closed into the frame) and is a possible HIPAA issue. I know Tom had looked at it once a year-ish ago, but it was never fixed. Please address.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Krista McCarver\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(4, 'miyuki@gangerdermatology.com', 'support_ticket', 'Completed', 'Not Urgent + Important', 'Wixom', NULL, '2024-10-03 13:18:20', '2025-05-21 23:31:02', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Our Wixom check machine (Digital Check - TS240) is not working. I have tried uninstalling\\/installing and unplugging\\/plugging the cables multiple of times. The machine is still showing a red glow, and this error message: \\\"Fail (Check that unit is powered on. Check usb and power cable connections.)\",\"photos\":\"https:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6037850996411449698\\/Screen shot of checking machine.JPG\",\"location\":\"Wixom\",\"submitter_name\":\"Miyuki Yoshinaga\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(5, 'erica@gangerdermatology.com', 'support_ticket', 'Completed', 'Not Urgent + Important', 'Wixom', NULL, '2024-10-10 10:49:07', '2025-05-21 23:31:03', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Check path printers - esp room 3 & 4 do not print or print very delayed, depending on the day\\/how the printer is feeling\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Erica Gavalier\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(6, 'leah@gangerdermatology.com', 'support_ticket', 'Completed', 'Urgent + Not Important', 'Plymouth', NULL, '2024-10-10 15:46:54', '2025-05-21 23:31:03', '{\"priority\":\"Urgent + Not Important\",\"details\":\"Computer is out dated, Slack is no longer supported which means I can not access parm to email patients.  Also printers will not connect to computer, so I am unable to print from my computer\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Leah Harris\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(7, 'erica@gangerdermatology.com', 'support_ticket', 'Completed', 'Urgent + Important', 'Wixom', NULL, '2024-10-14 15:35:30', '2025-05-21 23:31:03', '{\"priority\":\"Urgent + Important\",\"details\":\"Phones in MA hub, front desk, and phones cubby in hallway will not connect until the end of the phone call. Sometimes they just go silent, sometimes they ring then play a loud noise, and sometimes they do connect. Only about a third of the time the phone calls go through. Started sometime week of 10\\/7 and has just gotten worse.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Erica Gavalier\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(8, 'terri@gangerdermatology.com', 'support_ticket', 'Completed', 'Urgent + Important', 'Ann Arbor', NULL, '2024-10-24 13:22:28', '2025-05-21 23:31:03', '{\"priority\":\"Urgent + Important\",\"details\":\"The Dymo in the Aesthetic hub is not working to print patient labels for check out slips.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Terri Squires\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(9, 'eliza@gangerdermatology.com', 'support_ticket', 'Completed', 'Not Urgent + Important', 'Ann Arbor', NULL, '2024-10-25 12:11:42', '2025-05-21 23:31:04', '{\"priority\":\"Not Urgent + Important\",\"details\":\"The middle computer in the MA hub stopped working on 10\\/16\\/24 due to a person possibly kicking or displacing a wire from the PC. The monitor appears that there is a issue with the source due to not being able to display anything besides in the top left corner saying \\\"Display Port\\\". This appears when I push the button on the back to turn the monitor on.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Eliza Draper\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(10, 'ariela@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Plymouth', NULL, '2024-11-22 15:17:40', '2025-05-21 23:31:04', '{\"priority\":\"Urgent + Important\",\"details\":\"My work phone, extention 384,  has been on reboot for the last 5 hours and it is still not working.\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Ariela Ligori\",\"request_type\":\"Admin Issue\"}', NULL, NULL),
(11, 'ariela@gangerdermatology.com', 'support_ticket', 'Completed', 'Urgent + Important', 'Plymouth', NULL, '2024-11-25 09:10:39', '2025-05-28 12:54:49', '{\"priority\":\"Urgent + Important\",\"details\":\"\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Ariela Ligori\",\"request_type\":\"IT (network, computer, software)\"}', '2025-05-28 12:54:49', NULL),
(12, 'ariela@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Plymouth', NULL, '2024-11-25 14:25:03', '2025-05-21 23:31:04', '{\"priority\":\"Urgent + Important\",\"details\":\"Phone is not working.\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Ariela Ligori\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(13, 'erica@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Wixom', NULL, '2024-11-26 09:03:15', '2025-05-21 23:31:04', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Screen in room 3 that was recently removed left holes in the wall. When removed, the workers did fill in the holes, but they are white and will need to be sanded\\/painted.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Erica Gavalier\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(14, 'lara@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2024-11-27 09:53:43', '2025-05-21 23:31:05', '{\"priority\":\"Urgent + Important\",\"details\":\"GFI in Aesthetic room 3 (room closest to the kitchen) on the left of sink popped out with screws and other pieces as I was [plugging something in- outlet is not in use\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Lara Demirjian\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(15, 'lara@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2024-12-02 13:19:21', '2025-05-21 23:31:05', '{\"priority\":\"Urgent + Important\",\"details\":\"Ceiling fan was working just fine last week- now it is not functioning, or it turns on for 1 min and stops. Because its winter and the office is heated, when the laser is on in a closed room it gets unbearably boiling hot. The ceiling fan usually saves the day, but it is not functioning currently. Not sure if anyone messed with it over the weekend as it apparent our rooms were occupied after we left for the holiday.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Lara Demirjian\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(16, 'terri@gangerdermatology.com', 'support_ticket', 'Completed', 'Urgent + Important', 'Ann Arbor', NULL, '2024-12-03 10:45:46', '2025-05-22 14:19:47', '{\"priority\":\"Urgent + Important\",\"details\":\"Cooling fan in room does not work. It is 78 degrees in the room.\\r\\nI tried to turn it on multiple times. I starts and then shuts off immediately.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Terri Squires\",\"request_type\":\"Building Maintenance (Indoor)\"}', '2025-05-22 14:19:47', NULL),
(17, 'lara@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Wixom', NULL, '2024-12-05 12:39:22', '2025-05-21 23:31:05', '{\"priority\":\"Urgent + Important\",\"details\":\"In room 8, the outlet for the laser (in back right corner of the room behind the zimmer) is not strong enough for the laser- it makes the laser read \\\"low energy\\\" and does not let me use the laser.\\r\\n\\r\\nsecondly, the patient chair\\/table\\/bed in room 8 constantly swings, and its not safe if someone isnt careful getting on it. could be a safety hazard. the locking handle beneath the chair has been loose for awhile- and even when locked, loosens up almost immediately and the patient suddenly swings.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Lara Demirjian\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(18, 'sarahn@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Plymouth', NULL, '2024-12-06 11:18:26', '2025-05-21 23:31:05', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Yesterday and today we have had issues with printing from our path printer in the HUB. We have not be able to use it to print from either ipads or the desktop. It will not show up as an active printer at times. We have tried unplugging it, resetting it, and unplugging the ethernet cable but have been unsuccessful in printing anything from it.\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Sarah Noonan\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(19, 'terri@gangerdermatology.com', 'support_ticket', 'Completed', 'Not Urgent + Important', 'Ann Arbor', NULL, '2025-01-09 12:25:44', '2025-05-21 23:31:06', '{\"priority\":\"Not Urgent + Important\",\"details\":\"When Aesthetics is using the ipad to play music, it turns off the music in Plymouth. If it is on in Ann Arbor, Plymouth can not hear it and vise versa. We do not have music 90% of the time.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Terri Squires\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(20, 'dayla@gangerdermatology.com', 'support_ticket', 'Completed', 'Urgent + Important', 'Wixom', NULL, '2025-01-17 11:16:25', '2025-05-21 23:31:06', '{\"type\":\"\",\"priority\":\"Urgent + Important\",\"details\":\"We received stainless steel sanitary napkin receptacles for all 3 bathrooms. It states in the installation instructions to drill 2 holes and insert plastic anchors (not supplied) to hang the dispenser(s) up. Will need assistance with this please.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Dayla Balistreri\",\"request_type\":\"General Support\"}', NULL, NULL),
(21, 'leah@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Plymouth', NULL, '2025-01-28 09:43:33', '2025-05-21 23:31:06', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Can Plymouth get some kind of shelves to display products on, similar to the one Ann Arbor has just not as big. I think it would help patients know what products we carry, especially medical patients who wait in the lobby! I''m going to add a photo of some open space we could use.\",\"photos\":\"https:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6138846110509607435\\/IMG_4900.jpeg\\nhttps:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6138846110509607435\\/IMG_4901.jpeg\\nhttps:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6138846110509607435\\/IMG_4902.jpeg\",\"location\":\"Plymouth\",\"submitter_name\":\"Leah Harris\",\"request_type\":\"Information Request\"}', NULL, NULL),
(22, 'erica@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Wixom', NULL, '2025-01-30 11:19:17', '2025-05-21 23:31:06', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Exam chair in room 6 has a hole, needs to at least be patched. Fuzz does come out of it and it gets pulled on when pts sit in the chair. AF had mentioned the chair may be under warranty too so maybe it can be fixed that way.\",\"photos\":\"https:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6140631566418060701\\/IMG_7014.jpeg\\nhttps:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6140631566418060701\\/IMG_7014_1945.jpeg\",\"location\":\"Wixom\",\"submitter_name\":\"Erica Gavalier\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(23, 'sarahv@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-01-31 13:12:03', '2025-05-21 23:31:07', '{\"priority\":\"Urgent + Important\",\"details\":\"Ambir scanner at Terminal 1 for A2 is not scanning. We have tried cleaning and calibrating using the AmbirScan app but it says calibration failed after every attempt.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Sarah VanInwagen\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(24, 'sarahv@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-02-04 09:01:38', '2025-05-21 23:31:07', '{\"priority\":\"Urgent + Important\",\"details\":\"Ambir machine at Terminal 1 says it needs to calibrate but keeps failing. Tried cleaning and calibrating but it still says won''t work (see previous request). Also, P-touch editor on same computer won''t print. It does the first time after rebooting the computer but any afterwards it says \\\"The machine is operating\\\" and it won''t print.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Sarah VanInwagen\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(25, 'emily@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-02-05 13:56:23', '2025-05-21 23:31:07', '{\"priority\":\"Urgent + Important\",\"details\":\"Toilet in the patient bathroom near lobby is not flushing properly. Flushing very slow. I tried plunging, letting it refill with water. Re-flushing and it has little to no water pressure. We will be closing the bathroom to avoid overflowing\\/ more issues. This is urgent and needs to be fixed ASAP.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Emily Richardson\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(26, 'dayla@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Wixom', NULL, '2025-02-12 10:22:30', '2025-05-21 23:31:07', '{\"priority\":\"Urgent + Important\",\"details\":\"Card scanner (used to scan in pts IDs and insurance cards) is scanning in photo images dark (almost black) and we are unable to view them correctly to pull out any necessary information.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Dayla Balistreri\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(27, 'sarahn@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Plymouth', NULL, '2025-02-18 09:59:48', '2025-05-21 23:31:07', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Computer in the MA HUB closest to the front desk\\/autoclave cannot download any PDFs or documents or print to any computer.\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Sarah Noonan\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(28, 'sarahn@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Plymouth', NULL, '2025-02-20 16:11:49', '2025-05-21 23:31:08', '{\"priority\":\"Urgent + Important\",\"details\":\"PATH Printer in the HUB is not printing. I have tried to print from multiple devices including different ipads and different computers on different accounts and patient charts in EMA. I have reset it multiple times, and it will still not print any PATH report.\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Sarah Noonan\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(29, 'sarahv@gangerdermatology.com', 'support_ticket', 'Completed', 'Not Urgent + Important', 'Ann Arbor', NULL, '2025-02-25 12:32:19', '2025-05-21 23:31:08', '{\"priority\":\"Not Urgent + Important\",\"details\":\"The patient restroom near the main entrance is getting stuck. Last week the door was stuck and patients weren''t able to use the restroom. I was able to unjam the lock by twisting the door handle up and down several times. Today, we noticed this was occuring again but I could not get the door opened like last time. It was firmly stuck and had to use a penny to twist the lock to open the door. After fixing it today, it felt like the handle was catching and while still functional could likely get stuck again.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Sarah VanInwagen\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(30, 'sarahn@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Plymouth', NULL, '2025-02-26 08:54:28', '2025-05-21 23:31:08', '{\"priority\":\"Urgent + Important\",\"details\":\"PATH printer in the MA HUB is still not working or printing anything. We have tried unplugging it and resetting it multiple times but nothing will print to it. We have been printing using the front desk printer. I submitted a support ticket over a week ago and it has still not been addressed.\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Sarah Noonan\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(31, 'sarahn@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Plymouth', NULL, '2025-02-26 08:56:00', '2025-05-21 23:31:08', '{\"priority\":\"Urgent + Important\",\"details\":\"The computer in the MA HUB closest to the PATH printer is full in storage so I cannot download anything nor print to any printer. This leaves the MAs with one computer in the HUB that can print to any printer. I submitted a support ticket over a week ago that has not been addressed.\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Sarah Noonan\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(32, 'mccarver@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Wixom', NULL, '2025-02-26 09:26:10', '2025-05-21 23:31:08', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Kyocera printer in MA hub is still not functional. It has not been able to be used in many months, probably over a year. I know Jesse tried to fix at one point, KTK may have as well. Looking to get it fixed so it is usable.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Krista McCarver\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(33, 'dayla@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Wixom', NULL, '2025-03-03 15:52:46', '2025-05-21 23:31:08', '{\"type\":\"\",\"priority\":\"Urgent + Important\",\"details\":\"2 lights are burned out\\/dim in the main lobby.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Dayla Balistreri\",\"request_type\":\"General Support\"}', NULL, NULL),
(34, 'lara@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Wixom', NULL, '2025-03-05 09:45:30', '2025-05-21 23:31:09', '{\"priority\":\"Urgent + Important\",\"details\":\"1. Repair or replace aesthetic treatment chair in WX. It is a hazard and keeps twisting, hazard for patients (esp old ones). No matter how many times it is tightened.\\r\\n2. Hang sharps container and install glove dispenser near overhead cabinet. \\r\\n3. Drop overhead cabinet 1 foot.\\r\\n4. Move hand sanitizer above light switch.\\r\\n5. 2 outlets on NW corner of room need to be activated\\/functional.\\r\\n6. Repaint room to light color.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Lara Demirjian\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(35, 'terri@gangerdermatology.com', 'support_ticket', 'Completed', 'Not Urgent + Important', 'Ann Arbor', NULL, '2025-03-05 09:48:25', '2025-05-21 23:31:09', '{\"priority\":\"Not Urgent + Important\",\"details\":\"We would like to move forward in placing the small refrigerator in the closet in the Aesthetic wing. Please have an electrical outlet in the closet.\\r\\nThank you\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Terri Squires\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(36, 'ops@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-03-05 11:02:26', '2025-05-21 23:31:09', '{\"priority\":\"Urgent + Important\",\"details\":\"Please install the locks for the new cabinet in the lobby. Terri will move the products out of the black cabinet into the new cabinet once it can be used.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Kathy Keeley\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(37, 'lara@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Wixom', NULL, '2025-03-11 12:03:29', '2025-05-21 23:31:09', '{\"priority\":\"Urgent + Important\",\"details\":\"Aesthetic Ipad in WX is on but screen is black. Cant use it and cant troubleshoot. Nothing happened to it leading up to this\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Lara Demirjian\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(38, 'shelby2@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Plymouth', NULL, '2025-03-12 10:22:39', '2025-05-21 23:31:09', '{\"priority\":\"Not Urgent + Important\",\"details\":\"There needs to be hand soap in each exam room, even the surgery room does not have hand soap and they''ve been using a sample of cetaphil. Some viruses like warts are not killed by alcohol so soap is needed.\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Shelby Sabol\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(39, 'john@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-03-13 11:04:41', '2025-05-21 23:31:10', '{\"priority\":\"Urgent + Important\",\"details\":\"We have not been getting parm and epic login verification code emails to our office email. Pt emails with photos have recently been sent to spam.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"John Santinga\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(40, 'terri@gangerdermatology.com', 'support_ticket', 'Completed', 'Not Urgent + Not Important', 'Ann Arbor', NULL, '2025-03-13 13:26:49', '2025-05-21 23:31:10', '{\"priority\":\"Not Urgent + Not Important\",\"details\":\"I have a few things stacked next to my desk for pick up. They are to be taken to AC''s house for review. Two big totes, one cardboard box, two black chairs, one flat panel.\\r\\n\\r\\nThank you!!!\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Terri Squires\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(41, 'iacco@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Plymouth', NULL, '2025-03-13 16:09:19', '2025-05-21 23:31:10', '{\"priority\":\"Not Urgent + Important\",\"details\":\"2 nails\\/screws poking through the skylight in room 1. We don''t want water issues. Could have been there the whole time, but haven''t noticed before.  (submitted by KTK)\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Megan Iacco\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(42, 'juice@gangerdermatology.com', 'support_ticket', 'Completed', 'Urgent + Important', 'Plymouth', NULL, '2025-03-17 12:07:54', '2025-05-21 23:31:10', '{\"priority\":\"Urgent + Important\",\"details\":\"Chronic bad odor coming from the maintenance\\/utility room in Plymouth.  Odor seems worse and coming out into the hallway.  I see no standing water or dead animals to blame.  Wondering if gas\\/sewer folks need to be contacted.\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Jill Aman\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(43, 'emily@gangerdermatology.com', 'support_ticket', 'Completed', 'Urgent + Important', 'Ann Arbor', NULL, '2025-03-18 10:42:56', '2025-05-21 23:31:10', '{\"priority\":\"Urgent + Important\",\"details\":\"Toilet is constantly running. Patients are unable to flush. Doesn''t fill the bowl with water as it should. No sure how to proceed cause I''m not a plumber.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Emily Richardson\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(44, 'juice@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Ann Arbor', NULL, '2025-03-18 14:00:20', '2025-05-21 23:31:11', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Looking to have a mirror hung in exam room 7 in Ann Arbor, where we do our PDT treatments.  Often patients are asked to apply sunscreen to their face\\/scalp prior to heading to checkout; a mirror would be most helpful!  \\r\\n\\r\\nUnsure if there are extra mirrors or if one needs to be ordered (this part not so helpful, sorry!)\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Jill Aman\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(45, 'sarahn@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Plymouth', NULL, '2025-03-18 15:38:23', '2025-05-21 23:31:11', '{\"priority\":\"Urgent + Important\",\"details\":\"Third support ticket I am filling out as my first two have not been addressed for the same issue. The path printer in the HUB (white xerox) is only printing from one ipad and MI''s computer. All other ipads and computers are unable to print to this printer. We have tried to restart printer multiple times without success.\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Sarah Noonan\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(46, 'sarahn@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Plymouth', NULL, '2025-03-18 15:40:06', '2025-05-21 23:31:11', '{\"priority\":\"Urgent + Important\",\"details\":\"Third support ticket I am filling out as my first two have not been addressed for the same issue. The computer closest to the Path printer in the MA hub (nearest the autoclave) will not download any files so I cannot add anything to a patient chart from the email, send any lab slips, print to any printer (separate issue). I have restarted the computer and tried to clear storage space from the computer how I know how to but nothing has worked and this has still not been addressed.\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Sarah Noonan\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(47, 'juice@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Wixom', NULL, '2025-03-21 15:31:36', '2025-05-21 23:31:11', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Repeat ticket for Wixom provider suite.  As you know they would like it repainted where patches were done.  Also requesting shelfs on back wall (direct from entry) come down; looking to hang coat hooks there for their jackets.\\r\\n\\r\\nProviders out Tuesday- Friday next week for Spring break.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Jill Aman\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(48, 'ops@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Ann Arbor', NULL, '2025-03-24 12:09:49', '2025-05-21 23:31:11', '{\"priority\":\"Not Urgent + Important\",\"details\":\"The chair on the left side of the parlor needs an upholstery spot cleaning.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Kathy Keeley\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(49, 'selina@gangerdermatology.com', 'support_ticket', 'Completed', 'Urgent + Important', 'Plymouth', NULL, '2025-03-24 14:29:15', '2025-05-22 14:18:02', '{\"priority\":\"Urgent + Important\",\"details\":\"The doorknob for one of our closets is broken which means that it is not only harder to open the closet, but also slower, making it harder to room patients in a timely manner.\",\"photos\":\"\",\"location\":\"Plymouth\",\"submitter_name\":\"Selina Al-Shaer\",\"request_type\":\"Building Maintenance (Indoor)\"}', '2025-05-22 14:18:02', NULL),
(50, 'selina@gangerdermatology.com', 'support_ticket', 'Completed', 'Urgent + Important', 'Plymouth', NULL, '2025-03-25 17:22:39', '2025-05-21 23:31:12', '{\"priority\":\"Urgent + Important\",\"details\":\"The knob on the doorhandle is broken and we have tried to unscrew it multiple times and screw it back in, but it is not working.\",\"photos\":\"https:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6187469592612192866\\/image.jpg\",\"location\":\"Plymouth\",\"submitter_name\":\"Selina Al-Shaer\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(51, 'sarahv@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Ann Arbor', NULL, '2025-03-31 18:30:35', '2025-05-21 23:31:12', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Ants are getting to the coffee station at A2 as well as the lunchroom and Terri''s aethetic rooms. I tried to clean up the coffee station as much as I could and put ant powder down on the floor by the coffee station. I didn''t see where the other ants were in the other locations to address them there.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Sarah VanInwagen\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(52, 'sarahv@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Any/All', NULL, '2025-04-01 17:41:40', '2025-05-21 23:31:12', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Shopify doesn''t appear to allow us to be able to create a new gift card for patient when purchasing. We usually go to Products which opens up Gift Cards. There used to be a plus sign button\\/tab that we would click on to create a new gift card. I cannot find this or anything like this anywhere now.\",\"photos\":\"\",\"location\":\"Any\\/All\",\"submitter_name\":\"Sarah VanInwagen\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(53, 'sarahv@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-04-01 20:08:51', '2025-05-21 23:31:13', '{\"priority\":\"Urgent + Important\",\"details\":\"The PNC scanner is not working. From what I understand, the last batch entered had an error. This might be able to be deleted then to have the last batch''s rescanned but I didn''t want to risk deleting them without having the physical checks. I''m not sure if they are still in the provider cash metal bin though. I have informed Ayesha of this and she is going to try to fix it on 4\\/2\\/25 but wanted to submit a ticket since I cannot follow up on this. Any check received cannot be uploaded at A2 until this is fixed.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Sarah VanInwagen\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(54, 'jordan@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-04-03 12:54:48', '2025-05-21 23:31:13', '{\"priority\":\"Urgent + Important\",\"details\":\"Kuerig in the lobby is leaking from underneath. The water valve is not leaking so im unsure what is causing the water under the machine. I did place a towel under the machine to soak up the water that is leaking.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Jordan Stark\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(55, 'madiw@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-04-03 16:01:39', '2025-05-21 23:31:13', '{\"priority\":\"Urgent + Important\",\"details\":\"Aesthetic desk for computer will be delivered to a2 Wednesday 04\\/09, we will need a computer to help with work efficiency, discussed during our aesthetic meeting with AC\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Madison Williams\",\"request_type\":\"IT (network, computer, software)\"}', NULL, NULL),
(56, 'madiw@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-04-09 09:29:30', '2025-05-21 23:31:13', '{\"priority\":\"Urgent + Important\",\"details\":\"ceiling fan\\/ac cracked and seems to be popping out of the ceiling\",\"photos\":\"https:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6200145680329989044\\/image.jpg\\nhttps:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6200145680329989044\\/image_4963.jpg\\nhttps:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6200145680329989044\\/image_2024.jpg\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Madison Williams\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(57, 'srikruthi@gangerdermatology.com', 'support_ticket', 'Completed', 'Not Urgent + Important', 'Ann Arbor', NULL, '2025-04-15 11:16:00', '2025-05-21 23:31:13', '{\"priority\":\"Not Urgent + Important\",\"details\":\"The patient chair in room 3 is making a really obnoxious sound every time we have to change the settings. Additionally, the mirror on the wall in room 4 is tilted and patients have been pointing it out and trying to fix it for us. Thank you!!\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Srikruthi Chiravuri\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(58, 'miyuki@gangerdermatology.com', 'support_ticket', 'Completed', 'Not Urgent + Important', 'Wixom', NULL, '2025-04-17 16:54:39', '2025-05-22 01:54:18', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Some of our staff has been locked out in the hallway to the warehouse because the door handle on the door in the patient''s lobby, tends to lock by itself. If we can have that door handle replaced\\/fix, our office would appreciate it! Thank you!\",\"photos\":\"https:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6207324786414608729\\/IMG_8891.jpg\",\"location\":\"Wixom\",\"submitter_name\":\"Miyuki Yoshinaga\",\"request_type\":\"Building Maintenance (Indoor)\"}', '2025-05-22 01:54:18', NULL),
(59, 'anyssa@gangerdermatology.com', 'support_ticket', 'Approved', 'Not Urgent + Important', 'Ann Arbor', NULL, '2025-04-17 18:38:31', '2025-05-22 14:38:24', '{\"priority\":\"Not Urgent + Important\",\"details\":\"Ipad cannot keep a charge and is glitching. Updated ipad to the latest software and is still not keeping a charge and slowing down.\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Anyssa Cooper-Rowe\",\"request_type\":\"IT (network, computer, software)\"}', '2025-05-22 14:38:24', NULL),
(60, 'shelby2@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Not Important', 'Wixom', NULL, '2025-04-18 07:56:41', '2025-05-21 23:31:14', '{\"priority\":\"Urgent + Not Important\",\"details\":\"The paper roll holder on the chair in room 3 is not tight enough, I tried just tightening the screw but it didn''t help. the roll keeps falling off the chair when trying to pull the paper over the chair.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Shelby Sabol\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(61, 'miyuki@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Wixom', NULL, '2025-04-21 12:21:12', '2025-05-21 23:31:14', '{\"priority\":\"Not Urgent + Important\",\"details\":\"There are two lights in the lobby that needs to be fixed. One of the light in the lobby is not as lit up as the other lights. And the other light leading to the other room, has burned out.\",\"photos\":\"https:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6210616726413612754\\/IMG_8911.jpg\",\"location\":\"Wixom\",\"submitter_name\":\"Miyuki Yoshinaga\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(62, 'ops@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-04-21 12:26:23', '2025-05-21 23:31:14', '{\"priority\":\"Urgent + Important\",\"details\":\"Room 8 chair needs to be balanced appropriately.\",\"photos\":\"https:\\/\\/www.jotform.com\\/uploads\\/Ganger_anand\\/210354534990052\\/6210619824626662431\\/IMG_2324.jpeg\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Kathy Keeley\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(63, 'anyssa@gangerdermatology.com', 'support_ticket', 'Completed', 'Urgent + Important', 'Ann Arbor', NULL, '2025-04-22 16:21:28', '2025-05-22 14:15:43', '{\"priority\":\"Urgent + Important\",\"details\":\"Vacuum does not work\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Anyssa Cooper-Rowe\",\"request_type\":\"Building Maintenance (Indoor)\"}', '2025-05-22 14:15:43', NULL),
(64, 'shelby2@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Wixom', NULL, '2025-04-30 08:59:27', '2025-05-21 23:31:15', '{\"priority\":\"Urgent + Important\",\"details\":\"the outlet behind our autoclave has not been working, I''m not sure if the breaker blew for that one outlet or not. currently were using the outlet below it, but that outlet occasionally gets used for other things so the top one needs to be fixed.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Shelby Sabol\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(65, 'shelby2@gangerdermatology.com', 'support_ticket', 'Completed', 'Not Urgent + Not Important', 'Wixom', NULL, '2025-04-30 09:00:29', '2025-05-22 14:15:28', '{\"priority\":\"Not Urgent + Not Important\",\"details\":\"can you replace the large whiteboard in the hub with the whiteboard from room 1?\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Shelby Sabol\",\"request_type\":\"Building Maintenance (Indoor)\"}', '2025-05-22 14:15:28', NULL),
(66, 'shelby2@gangerdermatology.com', 'support_ticket', 'Completed', 'Not Urgent + Not Important', 'Wixom', NULL, '2025-04-30 09:01:58', '2025-05-22 01:53:16', '{\"priority\":\"Not Urgent + Not Important\",\"details\":\"we need a shelf installed above the sink in the hub, our paper towels and stuff keep getting contaminated from the organisol water in the sink when instruments are being cleaned.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Shelby Sabol\",\"request_type\":\"Building Maintenance (Indoor)\"}', '2025-05-22 01:53:16', NULL),
(67, 'compliance@gangerdermatology.com', 'support_ticket', 'Completed', 'Not Urgent + Important', 'Ann Arbor', NULL, '2025-05-02 08:31:46', '2025-05-21 23:31:15', '{\"priority\":\"Not Urgent + Important\",\"details\":\"The faucet in the Mohs lab corner is flowing VERY slowly, with no hot water. Thank you!\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Erin Turri\",\"request_type\":\"Building Maintenance (Indoor)\"}', '2025-05-21 04:33:58', NULL),
(68, 'rondina@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Wixom', NULL, '2024-12-09 09:20:17', '2025-05-21 23:31:15', '{\"priority\":\"Urgent + Important\",\"details\":\"The interactive screen was removed in room 3 (I''m sad because patients really liked it) and the wall is damaged and needs to be fixed.  If we don''t have the screen there we need to get some artwork or something to break up the large plain wall.\",\"photos\":\"\",\"location\":\"Wixom\",\"submitter_name\":\"Angela Ferrell\",\"request_type\":\"Building Maintenance (Indoor)\"}', NULL, NULL),
(69, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-05-05 11:14:26', '2025-05-05 11:14:26', '{\"submitter_name\":\"Jody GD (HR)\",\"submitter_email\":\"personnel@gangerdermatology.com\",\"personal_email\":\"jobs@gangerdermatology.com\",\"date\":\"2025-05-05\",\"in_time\":\"09:00\",\"out_time\":\"\",\"comments\":\"first day!\"}', NULL, NULL),
(70, 'personnel@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-05 15:04:24', '2025-05-19 12:35:25', '{\"submitter_name\":\"Jody GD (HR)\",\"submitter_email\":\"personnel@gangerdermatology.com\",\"personal_email\":\"jobs@gangerdermatology.com\",\"start_date\":\"\",\"end_date\":\"\",\"requesting_pto\":\"\",\"reason\":\"\",\"comments\":\"Megan Brissette - 1st day, got her hooked up to Deputy!\",\"attachments\":\"\",\"date\":\"2025-05-05\",\"in_time\":\"09:00\",\"out_time\":\"\"}', '2025-05-19 12:35:25', NULL),
(71, 'office@gangerdermatology.com', 'support_ticket', 'Completed', NULL, NULL, NULL, '2025-05-06 12:16:06', '2025-05-22 16:54:36', '{\"submitter_name\":\"Ganger Dermatology (Ganger Dermatology)\",\"submitter_email\":\"office@gangerdermatology.com\",\"personal_email\":\"anand@gangerdermatology.com\",\"location\":\"\",\"request_type\":\"IT (network, computer, software)\",\"priority\":\"\",\"details\":\"The computer at the front desk right when you walk in has not been turning on the past two days. We have attempted to unplug and re-plug cords but has had no success. \",\"photos\":\"\"}', '2025-05-22 16:54:36', NULL),
(72, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-05-06 14:15:55', '2025-05-06 14:15:55', '{\"submitter_name\":\"Jody GD (HR)\",\"submitter_email\":\"personnel@gangerdermatology.com\",\"personal_email\":\"jobs@gangerdermatology.com\",\"date\":\"2025-05-05\",\"in_time\":\"\",\"out_time\":\"16:45\",\"comments\":\"\"}', NULL, NULL),
(73, 'anand@gangerdermatology.com', 'support_ticket', 'Completed', NULL, NULL, NULL, '2025-05-07 00:00:43', '2025-05-21 23:31:15', '{\"submitter_name\":\"A.C. Ganger\",\"submitter_email\":\"anand@gangerdermatology.com\",\"personal_email\":\"payments@gangerdermatology.com\",\"location\":\"Wixom\",\"request_type\":\"General Support\",\"priority\":\"\",\"details\":\"test\",\"photos\":\"\"}', NULL, NULL),
(74, 'anand@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-05-19 22:25:30', '2025-05-19 22:25:30', '{\"employee_name\":\"A.C. Ganger\",\"date\":\"\",\"in_time\":\"13:25\",\"out_time\":\"\",\"comments\":\"this is a test\",\"submitter_name\":\"A.C. Ganger\"}', NULL, NULL),
(75, 'anand@gangerdermatology.com', 'support_ticket', 'Completed', 'Urgent + Important', 'Ann Arbor', NULL, '2025-05-19 22:30:58', '2025-05-21 04:33:51', '{\"location\":\"Ann Arbor\",\"request_type\":\"Property Maintenance (Outdoor)\",\"priority\":\"Urgent + Important\",\"details\":\"this is a test\",\"photos\":\"\",\"submitter_name\":\"A.C. Ganger\"}', '2025-05-21 04:33:51', NULL),
(76, 'anand@gangerdermatology.com', 'time_off_request', 'Approved', NULL, NULL, NULL, '2025-05-19 22:31:53', '2025-05-22 15:36:23', '{\"start_date\":\"2025-05-20\",\"end_date\":\"2025-05-20\",\"requesting_pto\":\"No\",\"reason\":\"this is a test\",\"comments\":\"this is a test\",\"submitter_name\":\"A.C. Ganger\"}', '2025-05-22 15:36:23', NULL),
(77, 'anand@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-05-19 22:37:40', '2025-05-19 22:37:40', '{\"employee_name\":\"A.C. Ganger\",\"date\":\"2025-05-18\",\"in_time\":\"23:37\",\"out_time\":\"\",\"comments\":\"this is a test\",\"employee_email\":\"anand@gangerdermatology.com\",\"submitter_name\":\"A.C. Ganger\"}', NULL, NULL),
(78, 'anand@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-05-19 22:51:59', '2025-05-19 22:51:59', '{\"employee_name\":\"A.C. Ganger\",\"date\":\"2025-05-15\",\"in_time\":\"\",\"out_time\":\"22:53\",\"comments\":\"this is a test\",\"submitter_name\":\"A.C. Ganger\"}', NULL, 'A.C. Ganger'),
(79, 'personnel@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-20 10:25:07', '2025-05-27 09:47:31', '{\"employee_name\":\"Jody GD (HR)\",\"date\":\"2025-05-20\",\"in_time\":\"09:00\",\"out_time\":\"\",\"comments\":\"Started onboarding a new hire and forgot to punch in!!\",\"submitter_name\":\"Jody GD (HR)\"}', '2025-05-27 09:47:31', 'Jody GD (HR)'),
(80, 'campbell@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-20 10:25:10', '2025-05-27 09:59:09', '{\"employee_name\":\"Annie Campbell\",\"date\":\"2025-05-20\",\"in_time\":\"09:00\",\"out_time\":\"\",\"comments\":\"First day at Ganger. Got into deputy later into my shift.\",\"submitter_name\":\"Annie Campbell\"}', '2025-05-27 09:59:09', 'Annie Campbell'),
(81, 'mclean@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-20 15:37:49', '2025-05-27 09:59:02', '{\"employee_name\":\"Aubrey McLean\",\"date\":\"2025-05-20\",\"in_time\":\"09:30\",\"out_time\":\"\",\"comments\":\"first day - added to deputy\",\"submitter_name\":\"Aubrey McLean\"}', '2025-05-27 09:59:02', 'Aubrey McLean'),
(82, 'mclean@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-21 08:22:18', '2025-05-27 09:58:58', '{\"employee_name\":\"Aubrey McLean\",\"date\":\"2025-05-21\",\"in_time\":\"08:00\",\"out_time\":\"\",\"comments\":\"forgot to clock in\",\"submitter_name\":\"Aubrey McLean\"}', '2025-05-27 09:58:58', 'Aubrey McLean'),
(83, 'office@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-21 10:54:15', '2025-05-27 09:58:50', '{\"employee_name\":\"Ganger Dermatology\",\"date\":\"2025-05-19\",\"in_time\":\"08:00\",\"out_time\":\"\",\"comments\":\"Cesar - Forgot to clock in \",\"submitter_name\":\"Ganger Dermatology\"}', '2025-05-27 09:58:50', 'Ganger Dermatology'),
(84, 'office@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-21 10:55:02', '2025-05-27 09:58:44', '{\"employee_name\":\"Ganger Dermatology\",\"date\":\"2025-05-20\",\"in_time\":\"08:00\",\"out_time\":\"\",\"comments\":\"Cesar - Forgot to clock in \",\"submitter_name\":\"Ganger Dermatology\"}', '2025-05-27 09:58:44', 'Ganger Dermatology'),
(85, 'personnel@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-21 11:53:52', '2025-05-27 09:58:42', '{\"employee_name\":\"Jody GD (HR)\",\"date\":\"2025-05-15\",\"in_time\":\"09:30\",\"out_time\":\"16:30\",\"comments\":\"JILLIAN DIONNE --- was not added to Deputy yet, so here are her hours for 5\\/15\\/25. Thanks! \",\"submitter_name\":\"Jody GD (HR)\"}', '2025-05-27 09:58:42', 'Jody GD (HR)'),
(86, 'personnel@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-21 11:54:39', '2025-05-27 09:58:40', '{\"employee_name\":\"Jody GD (HR)\",\"date\":\"2025-05-19\",\"in_time\":\"09:00\",\"out_time\":\"14:45\",\"comments\":\"JILLIAN DIONNE --- was not added to Deputy yet, so here are her hours for 5\\/19\\/25. Thanks! \",\"submitter_name\":\"Jody GD (HR)\"}', '2025-05-27 09:58:40', 'Jody GD (HR)'),
(87, 'kempainen@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-21 13:39:40', '2025-05-27 09:58:38', '{\"employee_name\":\"Isabella Kempainen\",\"date\":\"2025-05-21\",\"in_time\":\"09:30\",\"out_time\":\"\",\"comments\":\"First day- just got logged into Deputy.\",\"submitter_name\":\"Isabella Kempainen\"}', '2025-05-27 09:58:38', 'Isabella Kempainen'),
(88, 'office@gangerdermatology.com', 'support_ticket', 'Denied', 'Urgent + Important', 'Ann Arbor', NULL, '2025-05-21 15:28:52', '2025-05-31 17:25:24', '{\"location\":\"Ann Arbor\",\"request_type\":\"IT (network, computer, software)\",\"priority\":\"Urgent + Important\",\"details\":\"The card scanner on computer three closest to MA hub crashes everyday and doesnt work most days. Its very inconvenient to make the other girls have to stop what they are doing to scan in the patients cards.  \",\"photos\":\"\",\"submitter_name\":\"Ganger Dermatology\"}', '2025-05-22 15:26:05', 'Ganger Dermatology'),
(89, 'personnel@gangerdermatology.com', 'time_off_request', 'Approved', NULL, NULL, NULL, '2025-05-22 12:33:55', '2025-05-23 14:22:33', '{\"start_date\":\"2025-06-02\",\"end_date\":\"2025-06-02\",\"requesting_pto\":\"No\",\"reason\":\"This request is on behalf of Marguerite Smith. She requested this day off on her first day of work here. We submitted a time off request, but it doesn''t seem to have reached anyone. Thank you! \",\"comments\":\"This request is on behalf of Marguerite Smith. She requested this day off on her first day of work here. We submitted a time off request, but it doesn''t seem to have reached anyone. Thank you! \",\"submitter_name\":\"Jody GD (HR)\"}', '2025-05-23 14:22:33', 'Jody GD (HR)');
INSERT INTO "staff_tickets" ("id", "submitter_email", "form_type", "status", "priority", "location", "assigned_to_email", "created_at", "updated_at", "payload", "action_taken_at", "completed_by") VALUES
(90, 'personnel@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-22 13:25:21', '2025-05-27 09:58:36', '{\"employee_name\":\"Jody GD (HR)\",\"date\":\"2025-05-21\",\"in_time\":\"\",\"out_time\":\"17:10\",\"comments\":\"forgot to punch out when I was the last one left at Wixom!\",\"submitter_name\":\"Jody GD (HR)\"}', '2025-05-27 09:58:36', 'Jody GD (HR)'),
(91, 'mclean@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-22 15:39:27', '2025-05-22 15:39:27', '{\"start_date\":\"2025-07-02\",\"end_date\":\"2025-07-05\",\"requesting_pto\":\"No\",\"reason\":\"Family vacation\",\"comments\":\"I submitted two separate time off requests for July. I know that might be tricky. I''m not expecting both of them off (even though that would be great!), just one or the other will be just fine for me. Thank you!!\",\"submitter_name\":\"Aubrey McLean\"}', NULL, 'Aubrey McLean'),
(92, 'mclean@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-22 15:40:24', '2025-05-22 15:40:24', '{\"start_date\":\"2025-07-21\",\"end_date\":\"2025-07-25\",\"requesting_pto\":\"No\",\"reason\":\"Family vacation\",\"comments\":\"\",\"submitter_name\":\"Aubrey McLean\"}', NULL, 'Aubrey McLean'),
(93, 'mccarver@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-22 15:50:58', '2025-05-27 09:58:34', '{\"employee_name\":\"Krista McCarver\",\"date\":\"2025-05-15\",\"in_time\":\"\",\"out_time\":\"17:20\",\"comments\":\"Forgot to punch out\",\"submitter_name\":\"Krista McCarver\"}', '2025-05-27 09:58:34', 'Krista McCarver'),
(94, 'office@gangerdermatology.com', 'time_off_request', 'Approved', NULL, NULL, NULL, '2025-05-23 08:34:02', '2025-05-23 14:22:23', '{\"start_date\":\"2025-06-02\",\"end_date\":\"2025-06-06\",\"requesting_pto\":\"No\",\"reason\":\"As per what I had already informed, I have family coming over from England and visiting my house and I need to attend to them as a host, as I have not seen them in 3 years. I had attempted to fill out this form for the past two weeks but the link was not working. Thank you, Alina Mehdi. \",\"comments\":\"\",\"submitter_name\":\"Ganger Dermatology\"}', '2025-05-23 14:22:23', 'Ganger Dermatology'),
(95, 'office@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-23 08:34:52', '2025-05-23 08:34:52', '{\"start_date\":\"2025-08-04\",\"end_date\":\"2025-08-12\",\"requesting_pto\":\"No\",\"reason\":\"I have a previously scheduled family vacation to Florida and am not able to change my availability this week. Thanks! Emma Robbins\",\"comments\":\"\",\"submitter_name\":\"Ganger Dermatology\"}', NULL, 'Ganger Dermatology'),
(96, 'office@gangerdermatology.com', 'punch_fix', 'Approved', NULL, NULL, NULL, '2025-05-23 09:08:12', '2025-05-27 09:58:25', '{\"employee_name\":\"Ganger Dermatology\",\"date\":\"2025-05-19\",\"in_time\":\"17:15\",\"out_time\":\"18:15\",\"comments\":\"**Brianna Slavens, will not let me change name in employee name** \",\"submitter_name\":\"Ganger Dermatology\"}', '2025-05-27 09:58:25', 'Ganger Dermatology'),
(97, 'office@gangerdermatology.com', 'time_off_request', 'Approved', NULL, NULL, NULL, '2025-05-23 09:13:06', '2025-05-28 11:25:54', '{\"start_date\":\"2025-06-16\",\"end_date\":\"2025-06-16\",\"requesting_pto\":\"No\",\"reason\":\"Two appointments this day.\",\"comments\":\"\",\"submitter_name\":\"Ganger Dermatology\"}', '2025-05-28 11:25:54', 'Ganger Dermatology'),
(98, 'office@gangerdermatology.com', 'time_off_request', 'Approved', NULL, NULL, NULL, '2025-05-23 09:14:13', '2025-05-28 11:25:33', '{\"start_date\":\"2025-06-16\",\"end_date\":\"2025-06-16\",\"requesting_pto\":\"No\",\"reason\":\"I have two appointments this day, forgot to include my name in the previous request **Brianna Slavens**\",\"comments\":\"\",\"submitter_name\":\"Ganger Dermatology\"}', '2025-05-28 11:25:33', 'Ganger Dermatology'),
(99, 'brissette@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-23 15:18:21', '2025-05-23 15:18:21', '{\"start_date\":\"2025-07-21\",\"end_date\":\"2025-07-21\",\"requesting_pto\":\"No\",\"reason\":\"moving my mom out of state, will not be back until late monday\",\"comments\":\"\",\"submitter_name\":\"Megan Brissette\"}', NULL, 'Megan Brissette'),
(100, 'brissette@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-23 15:18:44', '2025-05-23 15:18:44', '{\"start_date\":\"2025-08-13\",\"end_date\":\"2025-08-15\",\"requesting_pto\":\"No\",\"reason\":\"visiting my mom out of state\",\"comments\":\"\",\"submitter_name\":\"Megan Brissette\"}', NULL, 'Megan Brissette'),
(101, 'brissette@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-23 15:19:05', '2025-05-23 15:19:05', '{\"start_date\":\"2025-07-07\",\"end_date\":\"2025-07-11\",\"requesting_pto\":\"No\",\"reason\":\"family vacation\",\"comments\":\"\",\"submitter_name\":\"Megan Brissette\"}', NULL, 'Megan Brissette'),
(102, 'personnel@gangerdermatology.com', 'expense_reimbursement', 'Pending Approval', NULL, NULL, NULL, '2025-05-23 15:50:44', '2025-05-23 15:50:44', '{\"expense_date\":\"2025-04-21\",\"amount\":\"96.00\",\"category\":\"Other\",\"description\":\"Anastasia Orlandi worked a full day paid shadow interview shift from 9A-5P in Wixom on 4\\/21\\/25. She was then hired on. We need to add 8 hours at $12.00\\/hr to her next paycheck for this. Thank you! Can someone please confirm with Jody that this reimbursement was received? Thanks again!\",\"receipt\":\"\",\"submitter_name\":\"Jody GD (HR)\"}', NULL, 'Jody GD (HR)'),
(103, 'office@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-05-27 11:28:58', '2025-05-27 11:28:58', '{\"employee_name\":\"Ganger Dermatology\",\"date\":\"2025-05-27\",\"in_time\":\"07:35\",\"out_time\":\"\",\"comments\":\"punched after starting work\",\"submitter_name\":\"Ganger Dermatology\"}', NULL, 'Ganger Dermatology'),
(104, 'office@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-05-27 11:52:07', '2025-05-31 17:25:43', '{\"location\":\"Ann Arbor\",\"request_type\":\"IT (network, computer, software)\",\"priority\":\"Urgent + Important\",\"details\":\"credit card terminal #1 is not functioning; has blank screen even after unplugging and plugging back in\",\"photos\":\"\",\"submitter_name\":\"Ganger Dermatology\"}', NULL, 'Ganger Dermatology'),
(105, 'peppard@gangerdermatology.com', 'meeting_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-27 12:51:38', '2025-05-27 12:51:38', '{\"meeting_date\":\"2025-06-02\",\"meeting_time\":\"13:45\",\"subject\":\"MA Training\\/Esthetics\",\"participants\":\"ayesha@gangerdermatology.com, personnel@gangerdermatology.com\",\"details\":\"Good afternoon,\\r\\nI just wanted to meet to go over my MA training schedule and discuss where I am with that. I also wanted to discuss and go over a timeline perhaps so I can gauge when I can be more incorporated with the esthetics team. Thank you! \",\"submitter_name\":\"Sofia Peppard\"}', NULL, 'Sofia Peppard'),
(106, 'office@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-27 16:42:07', '2025-05-27 16:42:07', '{\"start_date\":\"2025-08-18\",\"end_date\":\"2025-08-22\",\"requesting_pto\":\"No\",\"reason\":\"Alexis Riess time off request\",\"comments\":\"\",\"submitter_name\":\"Ganger Dermatology\"}', NULL, 'Ganger Dermatology'),
(107, 'mehdi@gangerdermatology.com', 'time_off_request', 'Approved', NULL, NULL, NULL, '2025-05-27 17:16:34', '2025-05-28 11:23:31', '{\"start_date\":\"2025-06-09\",\"end_date\":\"2025-06-13\",\"requesting_pto\":\"No\",\"reason\":\"I accidentally requested time off for the week prior (6\\/2-6\\/6). I can work next week, but I need 6\\/9-6\\/13 off please. So sorry for the confusion! \\r\\n\",\"comments\":\"\",\"submitter_name\":\"Alina Mehdi\"}', '2025-05-28 11:23:31', 'Alina Mehdi'),
(108, 'kempainen@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-27 18:02:34', '2025-05-27 18:02:34', '{\"start_date\":\"2025-07-14\",\"end_date\":\"2025-07-14\",\"requesting_pto\":\"No\",\"reason\":\"Dr. appt \",\"comments\":\"\",\"submitter_name\":\"Isabella Kempainen\"}', NULL, 'Isabella Kempainen'),
(109, 'kempainen@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-27 18:03:22', '2025-05-27 18:03:22', '{\"start_date\":\"2025-08-28\",\"end_date\":\"2025-08-29\",\"requesting_pto\":\"No\",\"reason\":\"Trip\",\"comments\":\"\",\"submitter_name\":\"Isabella Kempainen\"}', NULL, 'Isabella Kempainen'),
(110, 'kempainen@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-27 18:04:10', '2025-05-27 18:04:10', '{\"start_date\":\"2025-10-13\",\"end_date\":\"2025-10-14\",\"requesting_pto\":\"No\",\"reason\":\"Trip\",\"comments\":\"\",\"submitter_name\":\"Isabella Kempainen\"}', NULL, 'Isabella Kempainen'),
(111, 'kempainen@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-27 18:07:06', '2025-05-27 18:07:06', '{\"start_date\":\"2025-11-05\",\"end_date\":\"2025-11-11\",\"requesting_pto\":\"No\",\"reason\":\"Cruise\",\"comments\":\"\",\"submitter_name\":\"Isabella Kempainen\"}', NULL, 'Isabella Kempainen'),
(112, 'kempainen@gangerdermatology.com', 'time_off_request', 'Approved', NULL, NULL, NULL, '2025-05-27 18:10:19', '2025-05-28 11:17:14', '{\"start_date\":\"2025-06-10\",\"end_date\":\"2025-06-10\",\"requesting_pto\":\"No\",\"reason\":\"Time off\",\"comments\":\"\",\"submitter_name\":\"Isabella Kempainen\"}', '2025-05-28 11:17:14', 'Isabella Kempainen'),
(113, 'office@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-28 08:32:07', '2025-05-28 08:32:07', '{\"start_date\":\"2025-07-30\",\"end_date\":\"2025-08-03\",\"requesting_pto\":\"No\",\"reason\":\"out of town. will not be in able to come in.\",\"comments\":\"Jillian Dionne\",\"submitter_name\":\"Ganger Dermatology\"}', NULL, 'Ganger Dermatology'),
(114, 'mclean@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-28 15:47:55', '2025-05-28 15:47:55', '{\"start_date\":\"2025-06-19\",\"end_date\":\"2025-06-19\",\"requesting_pto\":\"No\",\"reason\":\"I have a dr apt in the middle of the day that I couldn''t get moved to a better time :(\",\"comments\":\"\",\"submitter_name\":\"Aubrey McLean\"}', NULL, 'Aubrey McLean'),
(115, 'mclean@gangerdermatology.com', 'change_of_availability', 'Pending Approval', NULL, NULL, NULL, '2025-05-28 15:51:09', '2025-05-28 15:51:09', '{\"employee_name\":\"Aubrey McLean\",\"availability_change\":\"Decreasing\",\"employment_type\":\"Full-time\",\"effective_date\":\"\",\"probation_completed\":\"No\",\"days_affected\":\"Monday\",\"limited_availability_details\":\"\",\"return_date\":\"\",\"reason\":\"I just want to stick between 30-35 hr weekly. I just want to make sure I''m not overloading my schedule for this summer.\",\"supporting_documentation\":\"\",\"additional_comments\":\"I don''t really have a specific day I need\\/want off, I just want to stick to a certain amount of hours each week. I''ve been consistent at 32 hours a week since I''ve started and I''m kind of just hoping it could stay that way. Thank you guys!\",\"submitter_name\":\"Aubrey McLean\"}', NULL, 'Aubrey McLean'),
(116, 'kempainen@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-05-29 08:30:52', '2025-05-29 08:30:52', '{\"start_date\":\"2025-07-07\",\"end_date\":\"2025-07-07\",\"requesting_pto\":\"No\",\"reason\":\"Dentist Appt (Scheduled prior to starting at Ganger)\",\"comments\":\"\",\"submitter_name\":\"Isabella Kempainen\"}', NULL, 'Isabella Kempainen'),
(117, 'hailey@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-05-29 09:49:22', '2025-05-29 09:49:22', '{\"employee_name\":\"Hailey Foster\",\"date\":\"2025-05-28\",\"in_time\":\"17:30\",\"out_time\":\"18:15\",\"comments\":\"admin scheduling meeting\",\"submitter_name\":\"Hailey Foster\"}', NULL, 'Hailey Foster'),
(118, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-05-29 10:23:04', '2025-05-29 10:23:04', '{\"employee_name\":\"Jody GD (HR)\",\"date\":\"2025-05-28\",\"in_time\":\"\",\"out_time\":\"18:25\",\"comments\":\"Facilitated an Admin meeting from 5:30-6:25 in person + virtual in Ann Arbor. When I attempted to punch out, Deputy stated I already had. I think it automatically signed me out but I worked until 6:25p :) Thanks!\",\"submitter_name\":\"Jody GD (HR)\"}', NULL, 'Jody GD (HR)'),
(119, 'jordan@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-05-29 11:27:35', '2025-05-29 11:27:35', '{\"employee_name\":\"Jordan Stark\",\"date\":\"2025-05-28\",\"in_time\":\"17:30\",\"out_time\":\"18:25\",\"comments\":\"Admin meeting. \",\"submitter_name\":\"Jordan Stark\"}', NULL, 'Jordan Stark'),
(120, 'tech@vinyaconstruction.com', 'support_ticket', 'Approved', 'Urgent + Important', 'Ann Arbor', NULL, '2025-06-02 03:00:52', '2025-06-02 03:00:52', '{\"priority\":\"Urgent + Important\",\"details\":\"Test ticket created to verify system functionality\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Test Technician\",\"request_type\":\"building_maintenance\"}', NULL, NULL),
(121, 'tech@vinyaconstruction.com', 'support_ticket', 'Approved', 'Urgent + Important', 'Ann Arbor', NULL, '2025-06-02 03:01:07', '2025-06-02 03:01:07', '{\"priority\":\"Urgent + Important\",\"details\":\"Test ticket created to verify system functionality\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Test Technician\",\"request_type\":\"building_maintenance\"}', NULL, NULL),
(122, 'anand@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-03 04:32:56', '2025-06-03 04:32:56', '{\"employee_name\":\"A.C. Ganger\",\"employee_email\":\"anand@gangerdermatology.com\",\"date\":\"2025-06-02\",\"in_time\":\"09:00\",\"out_time\":\"17:00\",\"comments\":\"Diagnostic test\"}', NULL, 'A.C. Ganger'),
(123, 'test@vinyaconstruction.com', 'support_ticket', 'Approved', 'Urgent + Important', 'Ann Arbor', NULL, '2025-06-03 21:42:59', '2025-06-03 21:42:59', '{\"priority\":\"Urgent + Important\",\"details\":\"Test ticket created at 2025-06-03 21:42:59\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Test User\",\"request_type\":\"General Support\"}', NULL, NULL),
(124, 'test@vinyaconstruction.com', 'support_ticket', 'Approved', 'Urgent + Important', 'Ann Arbor', NULL, '2025-06-03 21:43:29', '2025-06-03 21:43:29', '{\"priority\":\"Urgent + Important\",\"details\":\"Test ticket created at 2025-06-03 21:43:29\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Test User\",\"request_type\":\"General Support\"}', NULL, NULL),
(125, 'test@vinyaconstruction.com', 'support_ticket', 'Approved', 'Urgent + Important', 'Ann Arbor', NULL, '2025-06-03 21:43:40', '2025-06-03 21:43:40', '{\"priority\":\"Urgent + Important\",\"details\":\"Test ticket created at 2025-06-03T21:43:38.385Z\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Test User\",\"request_type\":\"General Support\"}', NULL, NULL),
(126, 'test@vinyaconstruction.com', 'support_ticket', 'Approved', 'Not Urgent + Not Important', 'Ann Arbor', NULL, '2025-06-03 21:50:18', '2025-06-03 21:50:18', '{\"priority\":\"Not Urgent + Not Important\",\"details\":\"This is a test\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Test User\",\"request_type\":\"building_maintenance\"}', NULL, NULL),
(127, 'anand@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-03 22:43:22', '2025-06-03 22:43:22', '{\"employee_name\":\"A.C. Ganger\",\"employee_email\":\"anand@gangerdermatology.com\",\"date\":\"2025-06-03\",\"in_time\":\"09:00\",\"out_time\":\"\",\"comments\":\"6:43p\"}', NULL, 'A.C. Ganger'),
(128, 'ac@vinyaconstruction.com', 'support_ticket', 'Open', 'Not Urgent + Not Important', 'Vinya Construction', NULL, '2025-06-03 23:22:14', '2025-06-04 03:10:33', '{\"priority\":\"Not Urgent + Not Important\",\"details\":\"RGB light project\",\"photos\":\"\",\"location\":\"Vinya Construction\",\"submitter_name\":\"Technician\",\"request_type\":\"property_maintenance\"}', NULL, NULL),
(129, 'sunil@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-03 23:53:20', '2025-06-03 23:53:20', '{\"submitter_name\":\"Arya Sunil\",\"submitter_email\":\"sunil@gangerdermatology.com\",\"start_date\":\"2025-06-27\",\"end_date\":\"2025-06-30\",\"requesting_pto\":\"No\",\"reason\":\"Travel\",\"comments\":\"Already mentioned this on the old form at the end of April\"}', NULL, 'Arya Sunil'),
(130, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-04 12:09:16', '2025-06-04 12:09:16', '{\"employee_name\":\"Jody GD (HR)\",\"employee_email\":\"personnel@gangerdermatology.com\",\"date\":\"2025-06-03\",\"in_time\":\"09:00\",\"out_time\":\"17:00\",\"comments\":\"The iPad glitched when I punched out yesterday from the break room in Ann Arbor and I don\\u2019t think it loaded my info\"}', NULL, 'Jody GD (HR)'),
(131, 'mclean@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-04 13:04:38', '2025-06-04 13:04:38', '{\"submitter_name\":\"Aubrey McLean\",\"submitter_email\":\"mclean@gangerdermatology.com\",\"start_date\":\"2025-07-01\",\"end_date\":\"2025-07-05\",\"requesting_pto\":\"No\",\"reason\":\"vacation\",\"comments\":\"resubmitting because i&#039;m not sure if the original requests actually showed up.\"}', NULL, 'Aubrey McLean'),
(132, 'ops@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-04 15:06:46', '2025-06-04 15:06:46', '{\"submitter_name\":\"Kathy Keeley\",\"submitter_email\":\"ops@gangerdermatology.com\",\"start_date\":\"2025-06-04\",\"end_date\":\"2026-06-04\",\"requesting_pto\":\"No\",\"reason\":\"testing :)\",\"comments\":\"See you in a year!\"}', NULL, 'Kathy Keeley'),
(133, 'ops@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-04 15:07:25', '2025-06-04 15:07:25', '{\"employee_name\":\"Kathy Keeley\",\"employee_email\":\"ops@gangerdermatology.com\",\"date\":\"2025-06-04\",\"in_time\":\"09:00\",\"out_time\":\"09:01\",\"comments\":\"testing--ignore\"}', NULL, 'Kathy Keeley'),
(134, 'ops@gangerdermatology.com', 'change_of_availability', 'Pending Approval', NULL, NULL, NULL, '2025-06-04 15:08:51', '2025-06-04 15:08:51', '{\"employee_name\":\"Kathy Keeley\",\"employee_email\":\"ops@gangerdermatology.com\",\"availability_change\":\"Decreasing\",\"employment_type\":\"Full-time\",\"effective_date\":\"2025-06-22\",\"probation_completed\":\"Yes\",\"days_affected\":\"Tuesday\",\"limited_availability_details\":\"not available on Tuesday\",\"return_date\":\"\",\"reason\":\"vacations\",\"supporting_documentation\":\"\",\"additional_comments\":\"\"}', NULL, 'Kathy Keeley'),
(135, 'sam@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-04 20:04:15', '2025-06-04 20:04:15', '{\"employee_name\":\"Samantha Wesley\",\"employee_email\":\"sam@gangerdermatology.com\",\"date\":\"2025-06-03\",\"in_time\":\"09:00\",\"out_time\":\"17:33\",\"comments\":\"FOrgot to clock out\"}', NULL, 'Samantha Wesley'),
(136, 'sam@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-04 20:05:58', '2025-06-04 20:05:58', '{\"employee_name\":\"Samantha Wesley\",\"employee_email\":\"sam@gangerdermatology.com\",\"date\":\"2025-06-02\",\"in_time\":\"09:00\",\"out_time\":\"17:32\",\"comments\":\"admin huddle, just adding time for the meeting! thanks\"}', NULL, 'Samantha Wesley'),
(137, 'mccarver@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Wixom', NULL, '2025-06-05 12:19:20', '2025-06-05 12:19:20', '{\"submitter_name\":\"Krista McCarver\",\"submitter_email\":\"mccarver@gangerdermatology.com\",\"location\":\"Wixom\",\"request_type\":\"IT (Network\\/Computer\\/Software)\",\"priority\":\"Not Urgent + Important\",\"details\":\"Norton on my computer just notified me that it expired. I assume that needs to be renewed. Thanks!\",\"photos\":\"\"}', NULL, 'Krista McCarver'),
(138, 'personnel@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-05 13:46:52', '2025-06-05 13:46:52', '{\"submitter_name\":\"Jody GD (HR)\",\"submitter_email\":\"personnel@gangerdermatology.com\",\"start_date\":\"2025-06-27\",\"end_date\":\"2025-06-27\",\"requesting_pto\":\"Yes\",\"reason\":\"Bruce has a medical procedure\",\"comments\":\"Thank you!\"}', NULL, 'Jody GD (HR)'),
(139, 'sam@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-05 13:57:29', '2025-06-05 13:57:29', '{\"employee_name\":\"Samantha Wesley\",\"employee_email\":\"sam@gangerdermatology.com\",\"date\":\"2025-06-05\",\"in_time\":\"09:00\",\"out_time\":\"17:46\",\"comments\":\"ipad didn&#039;t clock me again... sorry-Sam W\"}', NULL, 'Samantha Wesley'),
(140, 'jordan@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-05 14:59:18', '2025-06-05 14:59:18', '{\"submitter_name\":\"Jordan Stark\",\"submitter_email\":\"jordan@gangerdermatology.com\",\"start_date\":\"2025-06-24\",\"end_date\":\"2025-06-26\",\"requesting_pto\":\"Yes\",\"reason\":\"My husbands birthday is the 24th and mine is the 26th. I know the schedule is already made so if I could even could just get off earlier I would really appreciate it &lt;3\",\"comments\":\"Thank you in advanced\"}', NULL, 'Jordan Stark'),
(141, 'jessie@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-06-05 16:49:31', '2025-06-05 16:49:31', '{\"submitter_name\":\"Jessie Bratcher\",\"submitter_email\":\"jessie@gangerdermatology.com\",\"location\":\"Ann Arbor\",\"request_type\":\"Property Maintenance (Outdoor)\",\"priority\":\"Urgent + Important\",\"details\":\"Holes in wood from insect borrowing at top of bay window. Beneath the wood there is a gap that needs to be filled in the brick. Back of building corner before the a\\/c units the gutter is clogged from tree debris. several small wasp\\/bee hives around building\",\"photos\":\"\"}', NULL, 'Jessica Bratcher'),
(142, 'dionne@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-05 17:22:17', '2025-06-05 17:22:17', '{\"submitter_name\":\"Jillian Dionne\",\"submitter_email\":\"dionne@gangerdermatology.com\",\"start_date\":\"2025-07-30\",\"end_date\":\"2025-08-04\",\"requesting_pto\":\"No\",\"reason\":\"Out of town.\",\"comments\":\"Jillian Dionne\"}', NULL, 'Jillian Dionne'),
(143, 'compliance@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-05 17:59:17', '2025-06-05 17:59:17', '{\"employee_name\":\"Erin Turri\",\"employee_email\":\"compliance@gangerdermatology.com\",\"date\":\"2025-06-02\",\"in_time\":\"13:30\",\"out_time\":\"15:15\",\"comments\":\"none\"}', NULL, 'Erin Turri'),
(144, 'compliance@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-05 18:01:37', '2025-06-05 18:01:37', '{\"submitter_name\":\"Erin Turri\",\"submitter_email\":\"compliance@gangerdermatology.com\",\"start_date\":\"2025-09-15\",\"end_date\":\"2025-09-15\",\"requesting_pto\":\"No\",\"reason\":\"vacation\",\"comments\":\"This is assuming Mohs will be changed to Mondays starting September\"}', NULL, 'Erin Turri'),
(145, 'peppard@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-06 16:43:54', '2025-06-06 16:43:54', '{\"submitter_name\":\"Sofia Peppard\",\"submitter_email\":\"peppard@gangerdermatology.com\",\"start_date\":\"2025-06-23\",\"end_date\":\"2025-06-23\",\"requesting_pto\":\"No\",\"reason\":\"My parents are visiting me from Florida and I have to pick them up from the airport.\",\"comments\":\"n\\/a\"}', NULL, 'Sofia Peppard'),
(146, 'peppard@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-06 16:48:57', '2025-06-06 16:48:57', '{\"submitter_name\":\"Sofia Peppard\",\"submitter_email\":\"peppard@gangerdermatology.com\",\"start_date\":\"2025-07-03\",\"end_date\":\"2025-07-07\",\"requesting_pto\":\"No\",\"reason\":\"I will be out of town for fourth of July weekend.\",\"comments\":\"N\\/A\"}', NULL, 'Sofia Peppard'),
(147, 'orlandi@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-07 16:23:00', '2025-06-07 16:23:00', '{\"submitter_name\":\"Anastasia Orlandi\",\"submitter_email\":\"orlandi@gangerdermatology.com\",\"start_date\":\"2025-06-25\",\"end_date\":\"2025-06-25\",\"requesting_pto\":\"No\",\"reason\":\"Medical appointment scheduled for health issue\",\"comments\":\"Just need the afternoon off\\/ could leave around 1 o&#039;clock!\"}', NULL, 'Anastasia Orlandi'),
(148, 'dionne@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-09 18:09:35', '2025-06-09 18:09:35', '{\"submitter_name\":\"Jillian Dionne\",\"submitter_email\":\"dionne@gangerdermatology.com\",\"start_date\":\"2025-07-18\",\"end_date\":\"2025-07-18\",\"requesting_pto\":\"No\",\"reason\":\"doc appointment\",\"comments\":\"doc appointment\"}', NULL, 'Jillian Dionne'),
(149, 'traction@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-09 20:01:43', '2025-06-09 20:01:43', '{\"employee_name\":\"Ayesha Patel\",\"employee_email\":\"traction@gangerdermatology.com\",\"date\":\"2025-05-29\",\"in_time\":\"09:30\",\"out_time\":\"17:00\",\"comments\":\"Tire change caused delay\"}', NULL, 'Ayesha Patel'),
(150, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-10 12:08:23', '2025-06-10 12:08:23', '{\"employee_name\":\"Jody GD (HR)\",\"employee_email\":\"personnel@gangerdermatology.com\",\"date\":\"2025-06-09\",\"in_time\":\"09:00\",\"out_time\":\"18:45\",\"comments\":\"Had an offsite meeting with Kathy until 6:45p so I couldn\\u2019t punch out - thank you!!\"}', NULL, 'Jody GD (HR)'),
(151, 'hailey@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-10 15:45:17', '2025-06-10 15:45:17', '{\"submitter_name\":\"Hailey Tuttle\",\"submitter_email\":\"hailey@gangerdermatology.com\",\"start_date\":\"2025-08-04\",\"end_date\":\"2025-08-04\",\"requesting_pto\":\"No\",\"reason\":\"vet appt (bloodwork, pre op for neutering)\",\"comments\":\"N\\/A\"}', NULL, 'Hailey Tuttle'),
(152, 'hailey@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-10 15:48:42', '2025-06-10 15:48:42', '{\"submitter_name\":\"Hailey Tuttle\",\"submitter_email\":\"hailey@gangerdermatology.com\",\"start_date\":\"2025-08-18\",\"end_date\":\"2025-08-22\",\"requesting_pto\":\"Yes\",\"reason\":\"dog getting neutered, need time off for healing process\",\"comments\":\"N\\/A\"}', NULL, 'Hailey Tuttle'),
(153, 'fisher@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-06-11 14:52:40', '2025-06-11 14:52:40', '{\"submitter_name\":\"Nalina Fisher\",\"submitter_email\":\"fisher@gangerdermatology.com\",\"location\":\"Ann Arbor\",\"request_type\":\"IT (Network\\/Computer\\/Software)\",\"priority\":\"Urgent + Important\",\"details\":\"The computer in the MA hub (the one closest to the window, near the samples) is not working properly. All processes run extremely slow. Chrome constantly fails to load pages. errors include &quot;not enough memory&quot;. Just now as I&#039;m entering this ticket, the screen resolution changed without prompting. This computer is not usable for efficient work in its current state.\",\"photos\":\"\"}', NULL, 'Nalina Fisher'),
(154, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-11 15:22:08', '2025-06-11 15:22:08', '{\"employee_name\":\"Jody GD (HR) - Annie Campbell\",\"employee_email\":\"personnel@gangerdermatology.com\",\"date\":\"2025-06-10\",\"in_time\":\"12:00\",\"out_time\":\"12:30\",\"comments\":\"Hello! I must have accidentally created Annie Campbell&#039;s shift in Deputy for Tues 6\\/10 to include a 1\\/2 hour unpaid lunch. Deputy automatically added unpaid 30 minutes to her timesheet yesterday. That was my fault, and she did NOT punch out for lunch yesterday. Thanks!\"}', NULL, 'Jody GD (HR) - Annie Campbell'),
(155, 'smith@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-11 15:25:35', '2025-06-11 15:25:35', '{\"submitter_name\":\"Marguerite Smith\",\"submitter_email\":\"smith@gangerdermatology.com\",\"start_date\":\"2025-07-03\",\"end_date\":\"2025-07-08\",\"requesting_pto\":\"No\",\"reason\":\"Traveling with family for July 4th to visit grandparents\",\"comments\":\"Thank you!\"}', NULL, 'Marguerite Smith'),
(156, 'mccarver@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Wixom', NULL, '2025-06-12 14:49:39', '2025-06-12 14:49:39', '{\"submitter_name\":\"Krista McCarver\",\"submitter_email\":\"mccarver@gangerdermatology.com\",\"location\":\"Wixom\",\"request_type\":\"IT (Network\\/Computer\\/Software)\",\"priority\":\"Not Urgent + Important\",\"details\":\"One of our MAs, Ali Baumann is unable to log into the staff portal. I know Jody has been trying to help, but unfortunately nothing she&#039;s tried has worked. Hoping to escalate this to try to find a resolution. Thanks!\",\"photos\":\"\"}', NULL, 'Krista McCarver'),
(157, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-13 12:20:22', '2025-06-13 12:20:22', '{\"employee_name\":\"Jody GD (HR)\",\"employee_email\":\"personnel@gangerdermatology.com\",\"date\":\"2025-06-11\",\"in_time\":\"09:00\",\"out_time\":\"17:00\",\"comments\":\"I never punched in or out!!\"}', NULL, 'Jody GD (HR)'),
(158, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-13 12:26:44', '2025-06-13 12:26:44', '{\"employee_name\":\"Jody GD (HR)\",\"employee_email\":\"personnel@gangerdermatology.com\",\"date\":\"2025-06-12\",\"in_time\":\"09:00\",\"out_time\":\"18:00\",\"comments\":\"Started my day at AC&#039;s house for the L10 meeting so I never punched in !!\"}', NULL, 'Jody GD (HR)'),
(159, 'orlandi@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-13 13:55:31', '2025-06-13 13:55:31', '{\"submitter_name\":\"Anastasia Orlandi\",\"submitter_email\":\"orlandi@gangerdermatology.com\",\"start_date\":\"2025-07-03\",\"end_date\":\"2025-07-03\",\"requesting_pto\":\"No\",\"reason\":\"Family vacation\",\"comments\":\"Will be leaving for a family vacation\"}', NULL, 'Anastasia Orlandi'),
(160, 'smith@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-13 16:53:18', '2025-06-13 16:53:18', '{\"employee_name\":\"Marguerite Smith\",\"employee_email\":\"smith@gangerdermatology.com\",\"date\":\"2025-06-12\",\"in_time\":\"08:00\",\"out_time\":\"16:00\",\"comments\":\"Hello! On Thursday 6\\/12\\/25 I forgot to clock out from my shift when I left at 4pm. Thank you for your help!\"}', NULL, 'Marguerite Smith'),
(161, 'sam@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-16 14:08:43', '2025-06-16 14:08:43', '{\"submitter_name\":\"Samantha Wesley\",\"submitter_email\":\"sam@gangerdermatology.com\",\"start_date\":\"2025-06-30\",\"end_date\":\"2025-06-30\",\"requesting_pto\":\"No\",\"reason\":\"N\\/A\",\"comments\":\"N\\/A\"}', NULL, 'Samantha Wesley'),
(162, 'sam@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-16 14:21:26', '2025-06-16 14:21:26', '{\"submitter_name\":\"Samantha Wesley\",\"submitter_email\":\"sam@gangerdermatology.com\",\"start_date\":\"2025-07-25\",\"end_date\":\"2025-07-25\",\"requesting_pto\":\"No\",\"reason\":\"N\\/A\",\"comments\":\"N\\/A\"}', NULL, 'Samantha Wesley'),
(163, 'gutowsky@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-16 17:13:37', '2025-06-16 17:13:37', '{\"employee_name\":\"Katherine Gutowsky\",\"employee_email\":\"gutowsky@gangerdermatology.com\",\"date\":\"2025-06-16\",\"in_time\":\"09:25\",\"out_time\":\"\",\"comments\":\"First day with Ganger, got set up with Deputy\"}', NULL, 'Katherine Gutowsky'),
(164, 'chiravuri@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-16 20:21:16', '2025-06-16 20:21:16', '{\"submitter_name\":\"Srikruthi Chiravuri\",\"submitter_email\":\"chiravuri@gangerdermatology.com\",\"start_date\":\"2025-07-18\",\"end_date\":\"2025-07-18\",\"requesting_pto\":\"No\",\"reason\":\"Out of town\",\"comments\":\"N\\/a\"}', NULL, 'Srikruthi Chiravuri'),
(165, 'peppard@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-17 13:29:15', '2025-06-17 13:29:15', '{\"submitter_name\":\"Sofia Peppard\",\"submitter_email\":\"peppard@gangerdermatology.com\",\"start_date\":\"2025-06-27\",\"end_date\":\"2025-06-27\",\"requesting_pto\":\"No\",\"reason\":\"I have a doctor&#039;s appt that morning. Also my family will be visiting from Florida that week and they need a ride to the airport midday Friday.\",\"comments\":\"n\\/a\"}', NULL, 'Sofia Peppard'),
(166, 'peppard@gangerdermatology.com', 'meeting_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-17 13:44:02', '2025-06-17 13:44:02', '{\"submitter_name\":\"Sofia Peppard\",\"submitter_email\":\"peppard@gangerdermatology.com\",\"meeting_date\":\"2025-06-24\",\"meeting_time\":\"12:30\",\"subject\":\"F\\/U on Training Wage &amp; Esthetics\",\"participants\":\"personnel@gangerdermatology.com, ayesha@gangerdermatology.com\",\"details\":\"Following up on the meeting I had with Ayesha on May 27th regarding my training wage and transition to cross training for esthetics. Thank you!!\"}', NULL, 'Sofia Peppard'),
(167, 'ac@vinyaconstruction.com', 'support_ticket', 'Approved', 'Urgent + Important', 'Ann Arbor', NULL, '2025-06-17 15:21:30', '2025-06-17 15:21:30', '{\"priority\":\"Urgent + Important\",\"details\":\"Room 7\\u2019s faucet seal is broken either need new faucet or o ring\",\"photos\":\"\",\"location\":\"Ann Arbor\",\"submitter_name\":\"Technician\",\"request_type\":\"building_maintenance\"}', NULL, NULL),
(168, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-17 19:12:29', '2025-06-17 19:12:29', '{\"employee_name\":\"Jody GD (HR) - MARIAM HARBALI\",\"employee_email\":\"personnel@gangerdermatology.com\",\"date\":\"2025-06-17\",\"in_time\":\"09:00\",\"out_time\":\"\",\"comments\":\"First day with Ganger - set up with Deputy at 3PM, punched in 9AM\"}', NULL, 'Jody GD (HR) - MARIAM HARBALI'),
(169, 'campbell@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-18 16:57:22', '2025-06-18 16:57:22', '{\"submitter_name\":\"Annie Campbell\",\"submitter_email\":\"campbell@gangerdermatology.com\",\"start_date\":\"2025-06-20\",\"end_date\":\"2025-06-20\",\"requesting_pto\":\"No\",\"reason\":\"Following up on my earlier request to leave at 2:00 pm on Friday, June 20th for a final class presentation at 3:00 pm. I attempted to reschedule with my professor, but no other times were available. I am happy to continue reaching out to my professor if coverage is an issue.\",\"comments\":\"N\\/A\"}', NULL, 'Annie Campbell'),
(170, 'mckenzie@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-18 18:44:02', '2025-06-18 18:44:02', '{\"submitter_name\":\"Megan McKenzie\",\"submitter_email\":\"mckenzie@gangerdermatology.com\",\"start_date\":\"2025-07-25\",\"end_date\":\"2025-07-26\",\"requesting_pto\":\"Yes\",\"reason\":\"Vacation\",\"comments\":\"Going to Houghton Lake\"}', NULL, 'Megan McKenzie'),
(171, 'mckenzie@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-18 18:44:53', '2025-06-18 18:44:53', '{\"submitter_name\":\"Megan McKenzie\",\"submitter_email\":\"mckenzie@gangerdermatology.com\",\"start_date\":\"2025-10-02\",\"end_date\":\"2025-10-04\",\"requesting_pto\":\"Yes\",\"reason\":\"Vacation\",\"comments\":\"Going to Pigeon Forge TN\"}', NULL, 'Megan McKenzie'),
(172, 'sunil@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-18 21:37:45', '2025-06-18 21:37:45', '{\"employee_name\":\"Arya Sunil\",\"employee_email\":\"sunil@gangerdermatology.com\",\"date\":\"2025-06-18\",\"in_time\":\"07:30\",\"out_time\":\"17:38\",\"comments\":\"forgot to clock in when i got in today\"}', NULL, 'Arya Sunil'),
(173, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-19 14:14:56', '2025-06-19 14:14:56', '{\"employee_name\":\"Jody GD (HR)\",\"employee_email\":\"personnel@gangerdermatology.com\",\"date\":\"2025-06-18\",\"in_time\":\"09:00\",\"out_time\":\"17:00\",\"comments\":\"Hi!! I&#039;m so sorry - yesterday was a hectic day. I worked 9-5 but don&#039;t think I ever punched out.\"}', NULL, 'Jody GD (HR)'),
(174, 'jordan@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-19 14:24:12', '2025-06-19 14:24:12', '{\"submitter_name\":\"Jordan Stark\",\"submitter_email\":\"jordan@gangerdermatology.com\",\"start_date\":\"2025-07-24\",\"end_date\":\"2025-07-28\",\"requesting_pto\":\"Yes\",\"reason\":\"vacation\",\"comments\":\"vacation\"}', NULL, 'Jordan Stark'),
(175, 'mccarver@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Wixom', NULL, '2025-06-19 19:36:08', '2025-06-19 19:36:08', '{\"submitter_name\":\"Krista McCarver\",\"submitter_email\":\"mccarver@gangerdermatology.com\",\"location\":\"Wixom\",\"request_type\":\"Building Maintenance (Indoor)\",\"priority\":\"Not Urgent + Important\",\"details\":\"Video visit\\/Cosmetic consult room door is not closing well again. Seems like the door doesn&#039;t fit well into the frame. In the past an MA got stuck in the room because she couldn&#039;t pull it open, so it needs to be addressed. Thanks!\",\"photos\":\"\"}', NULL, 'Krista McCarver'),
(176, 'sam@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-19 21:09:06', '2025-06-19 21:09:06', '{\"employee_name\":\"Samantha Wesley\",\"employee_email\":\"sam@gangerdermatology.com\",\"date\":\"2025-06-19\",\"in_time\":\"07:50\",\"out_time\":\"17:10\",\"comments\":\"I know I clocked in this morning, Deputy even said I did.  But when I went to clock out tonight, it said I never clocked in.\"}', NULL, 'Samantha Wesley'),
(177, 'jen@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-20 12:06:42', '2025-06-20 12:06:42', '{\"employee_name\":\"Jennifer Eskildsen\",\"employee_email\":\"jen@gangerdermatology.com\",\"date\":\"2025-06-13\",\"in_time\":\"07:50\",\"out_time\":\"17:46\",\"comments\":\"Forgot to punch in\"}', NULL, 'Jennifer Eskildsen'),
(178, 'younas@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-20 15:47:13', '2025-06-20 15:47:13', '{\"submitter_name\":\"Alizah Younas\",\"submitter_email\":\"younas@gangerdermatology.com\",\"start_date\":\"2025-06-30\",\"end_date\":\"2025-07-01\",\"requesting_pto\":\"No\",\"reason\":\"I will be out of town.\",\"comments\":\"N\\/A\"}', NULL, 'Alizah Younas'),
(179, 'younas@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-20 17:28:53', '2025-06-20 17:28:53', '{\"submitter_name\":\"Alizah Younas\",\"submitter_email\":\"younas@gangerdermatology.com\",\"start_date\":\"2025-07-01\",\"end_date\":\"2025-07-02\",\"requesting_pto\":\"No\",\"reason\":\"I will be out of town.\",\"comments\":\"Please ignore the last request, the dates have changed. Thanks!\"}', NULL, 'Alizah Younas'),
(180, 'jordan@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-20 18:10:42', '2025-06-20 18:10:42', '{\"submitter_name\":\"Jordan Stark\",\"submitter_email\":\"jordan@gangerdermatology.com\",\"start_date\":\"2025-09-29\",\"end_date\":\"2025-10-03\",\"requesting_pto\":\"Yes\",\"reason\":\"vacation\",\"comments\":\"vacation\"}', NULL, 'Jordan Stark'),
(181, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-20 21:11:17', '2025-06-20 21:11:17', '{\"employee_name\":\"Jody GD (HR)\",\"employee_email\":\"personnel@gangerdermatology.com\",\"date\":\"2025-06-20\",\"in_time\":\"09:00\",\"out_time\":\"17:11\",\"comments\":\"iPad died when I was clocking out and would not turn back on\"}', NULL, 'Jody GD (HR)'),
(182, 'kempainen@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-21 21:56:55', '2025-06-21 21:56:55', '{\"submitter_name\":\"Isabella Kempainen\",\"submitter_email\":\"kempainen@gangerdermatology.com\",\"start_date\":\"2025-08-18\",\"end_date\":\"2025-08-18\",\"requesting_pto\":\"No\",\"reason\":\"dr appt\",\"comments\":\"n\\/a\"}', NULL, 'Isabella Kempainen'),
(183, 'kempainen@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-21 22:17:20', '2025-06-21 22:17:20', '{\"submitter_name\":\"Isabella Kempainen\",\"submitter_email\":\"kempainen@gangerdermatology.com\",\"start_date\":\"2025-07-08\",\"end_date\":\"2025-07-08\",\"requesting_pto\":\"No\",\"reason\":\"Going to tiger\\u2019s game for family member\\u2019s birthday. If at all possible to have this day off\\/leave early this day it would be greatly appreciated. Thanks!!\",\"comments\":\"n\\/a.\"}', NULL, 'Isabella Kempainen'),
(184, 'topic@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-23 11:52:46', '2025-06-23 11:52:46', '{\"employee_name\":\"Susan Topic\",\"employee_email\":\"topic@gangerdermatology.com\",\"date\":\"2025-06-22\",\"in_time\":\"20:20\",\"out_time\":\"21:30\",\"comments\":\"forgot to clock out\"}', NULL, 'Susan Topic'),
(185, 'brissette@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-06-23 13:53:38', '2025-06-23 13:53:38', '{\"submitter_name\":\"Megan Brissette\",\"submitter_email\":\"brissette@gangerdermatology.com\",\"start_date\":\"2025-06-25\",\"end_date\":\"2025-06-25\",\"requesting_pto\":\"No\",\"reason\":\"Need to come in at 10:30 instead of 7:30 for a doctors appointment\",\"comments\":\"Need to come in at 10:30 instead of 7:30 for a doctors appointment starts at 9 instead Milford\"}', NULL, 'Megan Brissette'),
(186, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-23 14:01:22', '2025-06-23 14:01:22', '{\"employee_name\":\"Jody GD (HR)\",\"employee_email\":\"personnel@gangerdermatology.com\",\"date\":\"2025-06-19\",\"in_time\":\"09:00\",\"out_time\":\"17:45\",\"comments\":\"Had an offsite meeting with Kathy until 5:45 so I could not punch out\"}', NULL, 'Jody GD (HR)'),
(187, 'personnel@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-24 14:52:50', '2025-06-24 14:52:50', '{\"employee_name\":\"Jody GD (HR)- CELINA COOKSON\",\"employee_email\":\"personnel@gangerdermatology.com\",\"date\":\"2025-06-24\",\"in_time\":\"09:30\",\"out_time\":\"17:03\",\"comments\":\"Celina&#039;s first day at Ganger is today! Just got her set up in Deputy - but she should be punched in for 9:30AM\"}', NULL, 'Jody GD (HR)- CELINA COOKSON'),
(188, 'sam@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-06-25 19:35:51', '2025-06-25 19:35:51', '{\"employee_name\":\"Samantha Wesley\",\"employee_email\":\"sam@gangerdermatology.com\",\"date\":\"2025-06-23\",\"in_time\":\"09:00\",\"out_time\":\"06:20\",\"comments\":\"Had Admin huddle, just adding my time from the meeting\"}', NULL, 'Samantha Wesley'),
(189, 'smith@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Urgent + Important', 'Ann Arbor', NULL, '2025-06-26 14:57:56', '2025-06-26 14:57:56', '{\"submitter_name\":\"Marguerite Smith\",\"submitter_email\":\"smith@gangerdermatology.com\",\"location\":\"Ann Arbor\",\"request_type\":\"Building Maintenance (Indoor)\",\"priority\":\"Urgent + Important\",\"details\":\"Chair in room 5- The piece on the end of the chair that holds the table paper has broken off. We cannot place another roll of table paper for pts. If someone can please come and fix this today it would be very appreciated! - Also, this is Ava Thrasher. I am using Ming&#039;s staff portal as mine does not work. Thank you\",\"photos\":\"\"}', NULL, 'Marguerite Smith'),
(190, 'sam@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Not Important', 'Ann Arbor', NULL, '2025-06-27 18:16:13', '2025-06-27 18:16:13', '{\"submitter_name\":\"Samantha Wesley\",\"submitter_email\":\"sam@gangerdermatology.com\",\"location\":\"Ann Arbor\",\"request_type\":\"IT (Network\\/Computer\\/Software)\",\"priority\":\"Not Urgent + Not Important\",\"details\":\"Ipad in the kitchen is no longer working.  Spends the day resetting, turning on\\/off.  Not able to use whatsoever.\",\"photos\":\"\"}', NULL, 'Samantha Wesley'),
(191, 'mclean@gangerdermatology.com', 'support_ticket', 'Pending Approval', 'Not Urgent + Important', 'Ann Arbor', NULL, '2025-06-30 20:18:38', '2025-06-30 20:18:38', '{\"submitter_name\":\"Aubrey McLean\",\"submitter_email\":\"mclean@gangerdermatology.com\",\"location\":\"Ann Arbor\",\"request_type\":\"IT (Network\\/Computer\\/Software)\",\"priority\":\"Not Urgent + Important\",\"details\":\"Terminal 1 and terminal 3 card scanners are broken. Terminal one doesn&#039;t scan the full card and cuts the top part of it off. Terminal 3 doesn&#039;t function at all.\",\"photos\":\"\"}', NULL, 'Aubrey McLean'),
(192, 'personnel@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-07-01 17:07:49', '2025-07-01 17:07:49', '{\"submitter_name\":\"Jody GD (HR)- Ming Smith\",\"submitter_email\":\"personnel@gangerdermatology.com\",\"start_date\":\"2025-08-25\",\"end_date\":\"2025-08-25\",\"requesting_pto\":\"No\",\"reason\":\"Doctors appts\",\"comments\":\"Doctors appts\"}', NULL, 'Jody GD (HR)'),
(193, 'topic@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-07-02 11:31:51', '2025-07-02 11:31:51', '{\"employee_name\":\"Susan Topic\",\"employee_email\":\"topic@gangerdermatology.com\",\"date\":\"2025-07-01\",\"in_time\":\"07:26\",\"out_time\":\"15:30\",\"comments\":\"forgot to clock out.\"}', NULL, 'Susan Topic'),
(194, 'traction@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-07-02 15:51:09', '2025-07-02 15:51:09', '{\"employee_name\":\"Michael Kafati\",\"employee_email\":\"traction@gangerdermatology.com\",\"date\":\"2025-07-02\",\"in_time\":\"07:30\",\"out_time\":\"12:00\",\"comments\":\"Onboarding Day\\r\\nUnable to  submit request without end time.\"}', NULL, 'Michael Kafati'),
(195, 'brissette@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-07-02 21:41:58', '2025-07-02 21:41:58', '{\"submitter_name\":\"Megan Brissette\",\"submitter_email\":\"brissette@gangerdermatology.com\",\"start_date\":\"2025-08-08\",\"end_date\":\"2025-08-08\",\"requesting_pto\":\"No\",\"reason\":\"Concert + need to take dad to airport\",\"comments\":\"Have a concert and need to take my dad to the airport\"}', NULL, 'Megan Brissette'),
(196, 'topic@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-07-03 12:38:16', '2025-07-03 12:38:16', '{\"employee_name\":\"Susan Topic\",\"employee_email\":\"topic@gangerdermatology.com\",\"date\":\"2025-07-02\",\"in_time\":\"07:24\",\"out_time\":\"15:30\",\"comments\":\"forgot to clock out ... again!  sorry!\"}', NULL, 'Susan Topic'),
(197, 'dionne@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-07-03 19:10:09', '2025-07-03 19:10:09', '{\"submitter_name\":\"Jillian Dionne\",\"submitter_email\":\"dionne@gangerdermatology.com\",\"start_date\":\"2025-07-21\",\"end_date\":\"2025-07-21\",\"requesting_pto\":\"No\",\"reason\":\"Family commitment. Will not be in town.\",\"comments\":\"My little cousin is getting baptized in St. Claire Shores, will not be able to come in to work.\"}', NULL, 'Jillian Dionne'),
(198, 'mehdi@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-07-03 21:20:34', '2025-07-03 21:20:34', '{\"employee_name\":\"Alina Mehdi\",\"employee_email\":\"mehdi@gangerdermatology.com\",\"date\":\"2025-07-02\",\"in_time\":\"07:37\",\"out_time\":\"17:28\",\"comments\":\"It appears that I forgot to clock in.\"}', NULL, 'Alina Mehdi'),
(199, 'kempainen@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-07-07 18:07:05', '2025-07-07 18:07:05', '{\"submitter_name\":\"Isabella Kempainen\",\"submitter_email\":\"kempainen@gangerdermatology.com\",\"start_date\":\"2025-12-01\",\"end_date\":\"2025-12-01\",\"requesting_pto\":\"No\",\"reason\":\"dentist appt.\",\"comments\":\"n\\/a\"}', NULL, 'Isabella Kempainen'),
(200, 'topic@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-07-08 01:12:55', '2025-07-08 01:12:55', '{\"employee_name\":\"Susan Topic\",\"employee_email\":\"topic@gangerdermatology.com\",\"date\":\"2025-07-07\",\"in_time\":\"07:51\",\"out_time\":\"16:10\",\"comments\":\"forgot to clock out\"}', NULL, 'Susan Topic');
INSERT INTO "staff_tickets" ("id", "submitter_email", "form_type", "status", "priority", "location", "assigned_to_email", "created_at", "updated_at", "payload", "action_taken_at", "completed_by") VALUES
(201, 'topic@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-07-08 01:13:43', '2025-07-08 01:13:43', '{\"submitter_name\":\"Susan Topic\",\"submitter_email\":\"topic@gangerdermatology.com\",\"start_date\":\"2025-08-04\",\"end_date\":\"2025-08-06\",\"requesting_pto\":\"No\",\"reason\":\"Work from home.\",\"comments\":\"Childcare issue.\"}', NULL, 'Susan Topic'),
(202, 'topic@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-07-08 01:14:44', '2025-07-08 01:14:44', '{\"submitter_name\":\"Susan Topic\",\"submitter_email\":\"topic@gangerdermatology.com\",\"start_date\":\"2025-08-07\",\"end_date\":\"2025-08-11\",\"requesting_pto\":\"Yes\",\"reason\":\"out of town\",\"comments\":\"family trip\"}', NULL, 'Susan Topic'),
(203, 'topic@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-07-08 01:15:29', '2025-07-08 01:15:29', '{\"submitter_name\":\"Susan Topic\",\"submitter_email\":\"topic@gangerdermatology.com\",\"start_date\":\"2025-08-18\",\"end_date\":\"2025-08-18\",\"requesting_pto\":\"No\",\"reason\":\"middle school orientation\",\"comments\":\"need to be at the school\"}', NULL, 'Susan Topic'),
(204, 'jordan@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-07-11 19:19:51', '2025-07-11 19:19:51', '{\"employee_name\":\"Jordan Stark\",\"employee_email\":\"jordan@gangerdermatology.com\",\"date\":\"2025-07-11\",\"in_time\":\"08:00\",\"out_time\":\"17:00\",\"comments\":\"I was not able to clock in the morning as I kept getting the error code that I was assigned to multiple shifts.  I clocked out with Bella and we took a picture together so I&#039;m not sure why I was still clocked in.\"}', NULL, 'Jordan Stark'),
(205, 'jordan@gangerdermatology.com', 'punch_fix', 'Pending Approval', NULL, NULL, NULL, '2025-07-14 13:38:47', '2025-07-14 13:38:47', '{\"employee_name\":\"Jordan Stark\",\"employee_email\":\"jordan@gangerdermatology.com\",\"date\":\"2025-07-11\",\"in_time\":\"08:00\",\"out_time\":\"17:03\",\"comments\":\"Would not allow me to clock in\"}', NULL, 'Jordan Stark'),
(206, 'kempainen@gangerdermatology.com', 'time_off_request', 'Pending Approval', NULL, NULL, NULL, '2025-07-14 19:23:12', '2025-07-14 19:23:12', '{\"submitter_name\":\"Isabella Kempainen\",\"submitter_email\":\"kempainen@gangerdermatology.com\",\"start_date\":\"2025-08-26\",\"end_date\":\"2025-08-26\",\"requesting_pto\":\"No\",\"reason\":\"follow up dr appointment\",\"comments\":\"n\\/a\"}', NULL, 'Isabella Kempainen');

-- --------------------------------------------------------

--
-- Table structure for table "staff_ticket_comments"
--

CREATE TABLE "staff_ticket_comments" (
  "id" int(11) NOT NULL,
  "ticket_id" int(11) NOT NULL,
  "author_email" VARCHAR(200) NOT NULL,
  "comment" TEXT DEFAULT NULL,
  "photo_url" VARCHAR(500) DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT current_timestamp()
)   ;

--
-- Dumping data for table "staff_ticket_comments"
--

INSERT INTO "staff_ticket_comments" ("id", "ticket_id", "author_email", "comment", "photo_url", "created_at") VALUES
(1, 59, 'anand@gangerdermatology.com', 'Status changed to Approved by anand@gangerdermatology.com', NULL, '2025-05-22 14:38:24'),
(2, 88, 'anand@gangerdermatology.com', 'Status changed to Denied by anand@gangerdermatology.com', NULL, '2025-05-22 14:38:33'),
(3, 88, 'anand@gangerdermatology.com', 'Status changed to Pending Approval by anand@gangerdermatology.com', NULL, '2025-05-22 14:38:36'),
(4, 71, 'anand@gangerdermatology.com', 'Status changed to Approved by anand@gangerdermatology.com', NULL, '2025-05-22 14:38:43'),
(5, 71, 'anand@gangerdermatology.com', 'Status changed to Denied by anand@gangerdermatology.com', NULL, '2025-05-22 14:38:46'),
(6, 71, 'anand@gangerdermatology.com', 'Status changed to Pending Approval by anand@gangerdermatology.com', NULL, '2025-05-22 14:38:47'),
(7, 88, 'anand@gangerdermatology.com', 'Status changed to Approved', NULL, '2025-05-22 15:26:00'),
(8, 88, 'anand@gangerdermatology.com', 'Status changed to Denied', NULL, '2025-05-22 15:26:05'),
(9, 128, 'tech@vinyaconstruction.com', 'Status changed from Approved to Open', NULL, '2025-06-03 23:10:33'),
(10, 105, 'traction@gangerdermatology.com', 'Completed.', NULL, '2025-06-06 15:19:52'),
(11, 147, 'traction@gangerdermatology.com', 'Doctor&#039;s appointment at 2pm.', NULL, '2025-06-11 17:28:08'),
(12, 32, 'mccarver@gangerdermatology.com', 'This can be closed, it was replaced.', NULL, '2025-06-12 14:46:48'),
(13, 105, 'ops@gangerdermatology.com', 'resolved', NULL, '2025-06-23 15:35:09'),
(14, 102, 'anand@gangerdermatology.com', 'paid 6/27', NULL, '2025-06-25 19:49:35');

-- --------------------------------------------------------

--
-- Table structure for table "staff_user_cache"
--

CREATE TABLE "staff_user_cache" (
  "email" VARCHAR(255) NOT NULL,
  "user_data" TEXT NOT NULL,
  "expires_at" TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  "created_at" TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
)   ;

--
-- Dumping data for table "staff_user_cache"
--

INSERT INTO "staff_user_cache" ("email", "user_data", "expires_at", "created_at", "updated_at") VALUES
('anand@gangerdermatology.com', '{\"email\":\"anand@gangerdermatology.com\",\"name\":\"Anand\",\"id\":\"7f7a4306f760cac356c9196a6de9705c\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-05-30 14:45:02', '2025-07-14 20:15:09'),
('brissette@gangerdermatology.com', '{\"email\":\"brissette@gangerdermatology.com\",\"name\":\"Brissette\",\"id\":\"0c480cf5b85c686c4c8bfe5039e6c0ab\",\"verified_email\":true,\"picture\":\"\"}', '2025-05-30 15:45:02', '2025-05-30 14:45:02', '2025-05-30 14:45:02'),
('campbell@gangerdermatology.com', '{\"email\":\"campbell@gangerdermatology.com\",\"name\":\"Campbell\",\"id\":\"17f166da3a2063398cfd370d4cdcaa58\",\"verified_email\":true,\"picture\":\"\"}', '2025-06-19 19:03:10', '2025-05-30 14:45:02', '2025-06-19 18:03:10'),
('compliance@gangerdermatology.com', '{\"email\":\"compliance@gangerdermatology.com\",\"name\":\"Compliance\",\"id\":\"33652bf29058a3df0f9e78b538a8f1c6\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-05-30 14:45:02', '2025-07-14 20:15:09'),
('dionne@gangerdermatology.com', '{\"email\":\"dionne@gangerdermatology.com\",\"name\":\"Dionne\",\"id\":\"022b647ca5b67d8ad9b99adb93405f22\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:14:59', '2025-07-03 21:32:31', '2025-07-14 20:14:59'),
('fisher@gangerdermatology.com', '{\"email\":\"fisher@gangerdermatology.com\",\"name\":\"Fisher\",\"id\":\"0d8ad4b32daf55a1098f8117ce8970f1\",\"verified_email\":true,\"picture\":\"\"}', '2025-06-19 19:27:03', '2025-06-19 18:27:03', '2025-06-19 18:27:03'),
('gutowsky@gangerdermatology.com', '{\"email\":\"gutowsky@gangerdermatology.com\",\"name\":\"Gutowsky\",\"id\":\"c43bf6b0a9d2c143dd45c8c1bce1593d\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-06-17 19:41:29', '2025-07-14 20:15:09'),
('hailey@gangerdermatology.com', '{\"email\":\"hailey@gangerdermatology.com\",\"name\":\"Hailey\",\"id\":\"dc409d0fa2180eebc22e0440d6e61d7a\",\"verified_email\":true,\"picture\":\"\"}', '2025-05-30 15:45:02', '2025-05-30 14:45:02', '2025-05-30 14:45:02'),
('jen@gangerdermatology.com', '{\"email\":\"jen@gangerdermatology.com\",\"name\":\"Jen\",\"id\":\"ff44138b6d335791d2ac74334d21f1c5\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-06-23 19:19:25', '2025-07-14 20:15:09'),
('jordan@gangerdermatology.com', '{\"email\":\"jordan@gangerdermatology.com\",\"name\":\"Jordan\",\"id\":\"b2519775084e90792f1fbd111cb74148\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-05-30 14:45:02', '2025-07-14 20:15:09'),
('kempainen@gangerdermatology.com', '{\"email\":\"kempainen@gangerdermatology.com\",\"name\":\"Kempainen\",\"id\":\"8eccf59f198874a64d363c52a9c0bbff\",\"verified_email\":true,\"picture\":\"\"}', '2025-06-19 19:24:28', '2025-05-30 14:45:02', '2025-06-19 18:24:28'),
('mccarver@gangerdermatology.com', '{\"email\":\"mccarver@gangerdermatology.com\",\"name\":\"Mccarver\",\"id\":\"e8db174ce55a45661c89a7eec740a817\",\"verified_email\":true,\"picture\":\"\"}', '2025-06-12 19:46:09', '2025-05-30 14:45:02', '2025-06-12 18:46:09'),
('mclean@gangerdermatology.com', '{\"email\":\"mclean@gangerdermatology.com\",\"name\":\"Mclean\",\"id\":\"3d2368057a5485762a25e5faa9650643\",\"verified_email\":true,\"picture\":\"\"}', '2025-06-23 20:23:28', '2025-05-30 14:45:02', '2025-06-23 19:23:28'),
('mehdi@gangerdermatology.com', '{\"email\":\"mehdi@gangerdermatology.com\",\"name\":\"Mehdi\",\"id\":\"c2c1696d62ac1bc56a955ff4ca32c473\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-05-30 14:45:02', '2025-07-14 20:15:09'),
('office@gangerdermatology.com', '{\"email\":\"office@gangerdermatology.com\",\"name\":\"Office\",\"id\":\"2481a9b4f896715aaea2514f01d6281a\",\"verified_email\":true,\"picture\":\"\"}', '2025-06-05 22:21:22', '2025-05-30 14:45:02', '2025-06-05 21:21:22'),
('ops@gangerdermatology.com', '{\"email\":\"ops@gangerdermatology.com\",\"name\":\"Ops\",\"id\":\"7c54f94909ed966407ea423e548dbb0c\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-06-04 21:46:42', '2025-07-14 20:15:09'),
('peppard@gangerdermatology.com', '{\"email\":\"peppard@gangerdermatology.com\",\"name\":\"Peppard\",\"id\":\"7466e3650ea898980e4cf57723bfc926\",\"verified_email\":true,\"picture\":\"\"}', '2025-06-23 20:21:05', '2025-05-30 14:45:02', '2025-06-23 19:21:05'),
('personnel@gangerdermatology.com', '{\"email\":\"personnel@gangerdermatology.com\",\"name\":\"Personnel\",\"id\":\"ad8e5a850e32a1a1b68e2ad68ccd97d9\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-05-30 14:45:02', '2025-07-14 20:15:09'),
('sam@gangerdermatology.com', '{\"email\":\"sam@gangerdermatology.com\",\"name\":\"Sam\",\"id\":\"056d948bf3fcdcbff2130be2cb54f9d7\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-06-05 06:10:45', '2025-07-14 20:15:09'),
('shelby2@gangerdermatology.com', '{\"email\":\"shelby2@gangerdermatology.com\",\"name\":\"Shelby\",\"id\":\"fd0da4502fb3341de84c7e0a2142fe44\",\"verified_email\":true,\"picture\":\"\"}', '2025-05-30 15:45:02', '2025-05-30 14:45:02', '2025-05-30 14:45:02'),
('smith@gangerdermatology.com', '{\"email\":\"smith@gangerdermatology.com\",\"name\":\"Smith\",\"id\":\"1ef538b6de508e4c06660b435574ca03\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-06-13 20:53:30', '2025-07-14 20:15:09'),
('sunil@gangerdermatology.com', '{\"email\":\"sunil@gangerdermatology.com\",\"name\":\"Sunil\",\"id\":\"44650b8c02c903915e4b750d033f42af\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-06-23 19:19:25', '2025-07-14 20:15:09'),
('topic@gangerdermatology.com', '{\"email\":\"topic@gangerdermatology.com\",\"name\":\"Topic\",\"id\":\"9f308ace6a7edc975eded6a5346cf3ed\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-06-23 19:19:25', '2025-07-14 20:15:09'),
('traction@gangerdermatology.com', '{\"email\":\"traction@gangerdermatology.com\",\"name\":\"Traction\",\"id\":\"3fbef4fe66656328b8c5c5d1c888c9bc\",\"verified_email\":true,\"picture\":\"\"}', '2025-07-14 21:15:09', '2025-06-10 00:01:56', '2025-07-14 20:15:09'),
('younas@gangerdermatology.com', '{\"email\":\"younas@gangerdermatology.com\",\"name\":\"Younas\",\"id\":\"31d6b268b19d7a0d58db3a0a9fb15e23\",\"verified_email\":true,\"picture\":\"\"}', '2025-06-20 22:27:31', '2025-06-20 21:27:31', '2025-06-20 21:27:31');

-- --------------------------------------------------------

--
-- Table structure for table "tasks"
--

CREATE TABLE "tasks" (
  "id" int(11) NOT NULL,
  "submission_date" TIMESTAMP DEFAULT NULL,
  "first_name" VARCHAR(100) DEFAULT NULL,
  "last_name" VARCHAR(100) DEFAULT NULL,
  "location" VARCHAR(100) DEFAULT NULL,
  "request_type" VARCHAR(100) DEFAULT NULL,
  "priority" VARCHAR(50) DEFAULT NULL,
  "description" TEXT DEFAULT NULL,
  "file_url" TEXT DEFAULT NULL,
  "meeting_with" VARCHAR(100) DEFAULT NULL,
  "jotform_submission_id" VARCHAR(100) DEFAULT NULL,
  "status" VARCHAR(50) DEFAULT 'New'
)   ;

--
-- Dumping data for table "tasks"
--

INSERT INTO "tasks" ("id", "submission_date", "first_name", "last_name", "location", "request_type", "priority", "description", "file_url", "meeting_with", "jotform_submission_id", "status") VALUES
(1, '2024-08-19 14:44:31', 'Dayla', 'Balistreri', 'Wixom', 'Admin Issue', 'Urgent + Important', 'The issue is when we send KGM''s video visit link it appears on the patients end as KLM''s video visit link. We resent the link and double checked to make sure it said Michels, which it did. Patient said it said waiting for host to join, yet when we joined both KGM and KLM''s video zoom \"rooms\" it only showed us (host) in the room and not the patient.', '', '', '5999022706412991521', 'PLEASE CONFIRM'),
(2, '2024-09-05 15:10:31', 'Sarah', 'Hyland', 'Plymouth', 'Building Maintenance (Indoor)', 'Not Urgent + Important', 'Door handle on linen closet broke. We did try to superglue together which has temporarily resolved the issue twice, but the handle likely needs to be replaced. There is a matching one on the other door so probably need 2', '', '', '6013726302619381139', 'PLEASE CONFIRM'),
(3, '2024-09-19 09:01:09', 'Krista', 'McCarver', 'Wixom', 'Building Maintenance (Indoor)', 'Not Urgent + Important', 'This is not the first request for this problem, but our video visit/consult room door will not close fully. It is difficult to get it to close at all (i.e. wedging it a tiny bit closed into the frame) and is a possible HIPAA issue. I know Tom had looked at it once a year-ish ago, but it was never fixed. Please address.', '', '', '6025600686411779708', 'PLEASE CONFIRM'),
(4, '2024-10-03 13:18:20', 'Miyuki', 'Yoshinaga', 'Wixom', 'IT (network, computer, software)', 'Not Urgent + Important', 'Our Wixom check machine (Digital Check - TS240) is not working. I have tried uninstalling/installing and unplugging/plugging the cables multiple of times. The machine is still showing a red glow, and this error message: \"Fail (Check that unit is powered on. Check usb and power cable connections.)', 'https://www.jotform.com/uploads/Ganger_anand/210354534990052/6037850996411449698/Screen shot of checking machine.JPG', '', '6037850996411449698', 'PLEASE CONFIRM'),
(5, '2024-10-10 10:49:07', 'Erica', 'Gavalier', 'Wixom', 'IT (network, computer, software)', 'Not Urgent + Important', 'Check path printers - esp room 3 & 4 do not print or print very delayed, depending on the day/how the printer is feeling', '', '', '6043809476413117424', 'PLEASE CONFIRM'),
(6, '2024-10-10 15:46:54', 'Leah', 'Harris', 'Plymouth', 'IT (network, computer, software)', 'Urgent + Not Important', 'Computer is out dated, Slack is no longer supported which means I can not access parm to email patients.  Also printers will not connect to computer, so I am unable to print from my computer', '', '', '6043988132617791087', 'PLEASE CONFIRM'),
(7, '2024-10-14 15:35:30', 'Erica', 'Gavalier', 'Wixom', 'IT (network, computer, software)', 'Urgent + Important', 'Phones in MA hub, front desk, and phones cubby in hallway will not connect until the end of the phone call. Sometimes they just go silent, sometimes they ring then play a loud noise, and sometimes they do connect. Only about a third of the time the phone calls go through. Started sometime week of 10/7 and has just gotten worse.', '', '', '6047437306412151613', 'PLEASE CONFIRM'),
(8, '2024-10-24 13:22:28', 'Terri', 'Squires', 'Ann Arbor', 'IT (network, computer, software)', 'Urgent + Important', 'The Dymo in the Aesthetic hub is not working to print patient labels for check out slips.', '', '', '6055997480326057419', 'PLEASE CONFIRM'),
(9, '2024-10-25 12:11:42', 'Eliza', 'Draper', 'Ann Arbor', 'IT (network, computer, software)', 'Not Urgent + Important', 'The middle computer in the MA hub stopped working on 10/16/24 due to a person possibly kicking or displacing a wire from the PC. The monitor appears that there is a issue with the source due to not being able to display anything besides in the top left corner saying \"Display Port\". This appears when I push the button on the back to turn the monitor on.', '', '', '6056819020324452089', 'PLEASE CONFIRM'),
(10, '2024-11-22 15:17:40', 'ARIELA', 'LIGORI', 'Plymouth', 'Admin Issue', 'Urgent + Important', 'My work phone, extention 384,  has been on reboot for the last 5 hours and it is still not working.', '', '', '6081158602614570684', 'New'),
(11, '2024-11-25 09:10:39', 'ariela', 'ligori', 'Plymouth', 'IT (network, computer, software)', 'Urgent + Important', '', '', '', '6083530392616367283', 'New'),
(12, '2024-11-25 14:25:03', 'Ariela', 'Ligori', 'Plymouth', 'IT (network, computer, software)', 'Urgent + Important', 'Phone is not working.', '', '', '6083719022616875333', 'New'),
(13, '2024-11-26 09:03:15', 'Erica', 'Gavalier', 'Wixom', 'Building Maintenance (Indoor)', 'Not Urgent + Important', 'Screen in room 3 that was recently removed left holes in the wall. When removed, the workers did fill in the holes, but they are white and will need to be sanded/painted.', '', '', '6084389956415873976', 'New'),
(14, '2024-11-26 12:27:55', 'Hailey', 'Tuttle', 'Plymouth', 'IT (network, computer, software)', 'Not Urgent + Important', 'The phone extension 384 at the Plymouth office is no longer working. I have an image of the device. It will not load, stays frozen with a permanent loading bar and white/blank screen. At least able to log in via the computer with the 384 extension and use it that way, but the actual phone device is not working. Image of the device attached for reference.', 'https://www.jotform.com/uploads/Ganger_anand/210354534990052/6084512742616633214/IMG_3456.jpg', '', '6084512742616633214', 'New'),
(15, '2024-11-27 09:53:43', 'LARA', 'DEMIRJIAN', 'Ann Arbor', 'Building Maintenance (Indoor)', 'Urgent + Important', 'GFI in Aesthetic room 3 (room closest to the kitchen) on the left of sink popped out with screws and other pieces as I was [plugging something in- outlet is not in use', '', '', '6085284230326958240', 'New'),
(16, '2024-12-02 11:28:43', 'Jessie', 'Bratcher', 'Wixom', 'Building Maintenance (Indoor)', 'Not Urgent + Important', 'The 2 patient point units were taken down and it looks like Ashley attempted painting them, but the spots are still an eye sore. Also, Dr Ferral liked having the unit in room 3 (surgery room, large room with bare walls) for the patients to look at, she suggested art work or something on walls instead. Kathy suggested using the TV''s we have and uploading our info, i.e. promos, provider bios, pt reviews, etc on them to play in the room & the lobby where the other unit was taken down', 'https://www.jotform.com/uploads/Ganger_anand/210354534990052/6089661212615466391/IMG_5261.jpg\nhttps://www.jotform.com/uploads/Ganger_anand/210354534990052/6089661212615466391/IMG_5262.jpg', '', '6089661212615466391', 'New'),
(17, '2024-12-02 13:19:21', 'Lara', 'Demirjian', 'Ann Arbor', 'Building Maintenance (Indoor)', 'Urgent + Important', 'Ceiling fan was working just fine last week- now it is not functioning, or it turns on for 1 min and stops. Because its winter and the office is heated, when the laser is on in a closed room it gets unbearably boiling hot. The ceiling fan usually saves the day, but it is not functioning currently. Not sure if anyone messed with it over the weekend as it apparent our rooms were occupied after we left for the holiday.', '', '', '6089727610321790673', 'New'),
(18, '2024-12-03 10:45:46', 'Terri', 'Squires', 'Ann Arbor', 'Building Maintenance (Indoor)', 'Urgent + Important', 'Cooling fan in room does not work. It is 78 degrees in the room.\r\nI tried to turn it on multiple times. I starts and then shuts off immediately.', '', '', '6090499460328760448', 'New'),
(19, '2024-12-05 12:39:22', 'Lara', 'Demirjian', 'Wixom', 'Building Maintenance (Indoor)', 'Urgent + Important', 'In room 8, the outlet for the laser (in back right corner of the room behind the zimmer) is not strong enough for the laser- it makes the laser read \"low energy\" and does not let me use the laser.\r\n\r\nsecondly, the patient chair/table/bed in room 8 constantly swings, and its not safe if someone isnt careful getting on it. could be a safety hazard. the locking handle beneath the chair has been loose for awhile- and even when locked, loosens up almost immediately and the patient suddenly swings.', '', '', '6092295626415152596', 'New'),
(20, '2024-12-06 11:18:26', 'Sarah', 'Noonan', 'Plymouth', 'IT (network, computer, software)', 'Not Urgent + Important', 'Yesterday and today we have had issues with printing from our path printer in the HUB. We have not be able to use it to print from either ipads or the desktop. It will not show up as an active printer at times. We have tried unplugging it, resetting it, and unplugging the ethernet cable but have been unsuccessful in printing anything from it.', '', '', '6093111062619448101', 'New'),
(21, '2025-01-09 08:42:18', 'Jack', 'Santinga', 'Ann Arbor', 'Building Maintenance (Indoor)', 'Urgent + Not Important', 'door handle in room 2 is loose', '', '', '6122393380328914214', 'New'),
(22, '2025-01-09 12:25:44', 'Terri', 'Squires', 'Ann Arbor', 'IT (network, computer, software)', 'Not Urgent + Important', 'When Aesthetics is using the ipad to play music, it turns off the music in Plymouth. If it is on in Ann Arbor, Plymouth can not hear it and vise versa. We do not have music 90% of the time.', '', '', '6122527430324685128', 'New'),
(23, '2025-01-17 11:16:25', 'Dayla', 'Balistreri', 'Wixom', '', 'Urgent + Important', 'We received stainless steel sanitary napkin receptacles for all 3 bathrooms. It states in the installation instructions to drill 2 holes and insert plastic anchors (not supplied) to hang the dispenser(s) up. Will need assistance with this please.', '', '', '6129397856418496859', 'New'),
(24, '2025-01-28 09:43:33', 'Leah', 'Harris', 'Plymouth', 'Information Request', 'Not Urgent + Important', 'Can Plymouth get some kind of shelves to display products on, similar to the one Ann Arbor has just not as big. I think it would help patients know what products we carry, especially medical patients who wait in the lobby! I''m going to add a photo of some open space we could use.', 'https://www.jotform.com/uploads/Ganger_anand/210354534990052/6138846110509607435/IMG_4900.jpeg\nhttps://www.jotform.com/uploads/Ganger_anand/210354534990052/6138846110509607435/IMG_4901.jpeg\nhttps://www.jotform.com/uploads/Ganger_anand/210354534990052/6138846110509607435/IMG_4902.jpeg', '', '6138846110509607435', 'New'),
(25, '2025-01-30 11:19:17', 'Erica', 'Gavalier', 'Wixom', 'Building Maintenance (Indoor)', 'Not Urgent + Important', 'Exam chair in room 6 has a hole, needs to at least be patched. Fuzz does come out of it and it gets pulled on when pts sit in the chair. AF had mentioned the chair may be under warranty too so maybe it can be fixed that way.', 'https://www.jotform.com/uploads/Ganger_anand/210354534990052/6140631566418060701/IMG_7014.jpeg\nhttps://www.jotform.com/uploads/Ganger_anand/210354534990052/6140631566418060701/IMG_7014_1945.jpeg', '', '6140631566418060701', 'New'),
(26, '2025-01-31 13:12:03', 'Sarah', 'VanInwagen', 'Ann Arbor', 'IT (network, computer, software)', 'Urgent + Important', 'Ambir scanner at Terminal 1 for A2 is not scanning. We have tried cleaning and calibrating using the AmbirScan app but it says calibration failed after every attempt.', '', '', '6141563220322002032', 'New'),
(27, '2025-02-04 09:01:38', 'Sarah', 'VanInwagen', 'Ann Arbor', 'IT (network, computer, software)', 'Urgent + Important', 'Ambir machine at Terminal 1 says it needs to calibrate but keeps failing. Tried cleaning and calibrating but it still says won''t work (see previous request). Also, P-touch editor on same computer won''t print. It does the first time after rebooting the computer but any afterwards it says \"The machine is operating\" and it won''t print.', '', '', '6144868980325849576', 'New'),
(28, '2025-02-05 07:35:56', 'Madison', 'K', 'Wixom', '', 'Urgent + Important', 'Vacuum keeps spitting out instead of picking up debris. Does not allow us to have clinic cleaned in the morning.', '', '', '6145681556419415883', 'New'),
(29, '2025-02-05 13:56:23', 'Emily', 'Richardson', 'Ann Arbor', 'Building Maintenance (Indoor)', 'Urgent + Important', 'Toilet in the patient bathroom near lobby is not flushing properly. Flushing very slow. I tried plunging, letting it refill with water. Re-flushing and it has little to no water pressure. We will be closing the bathroom to avoid overflowing/ more issues. This is urgent and needs to be fixed ASAP.', '', '', '6145909820324307343', 'Complete'),
(30, '2025-02-12 10:22:30', 'Dayla', 'Balistreri', 'Wixom', 'IT (network, computer, software)', 'Urgent + Important', 'Card scanner (used to scan in pts IDs and insurance cards) is scanning in photo images dark (almost black) and we are unable to view them correctly to pull out any necessary information.', '', '', '6151829506417492698', 'New'),
(31, '2024-12-09 09:20:17', 'Angela', 'Ferrell', 'Wixom', 'Building Maintenance (Indoor)', 'Urgent + Important', 'The interactive screen was removed in room 3 (I''m sad because patients really liked it) and the wall is damaged and needs to be fixed.  If we don''t have the screen there we need to get some artwork or something to break up the large plain wall.', '', '', '6095632176416404357', 'New'),
(32, '2024-12-23 14:55:17', 'Jessie', 'Bratcher', 'Ann Arbor', 'Building Maintenance (Indoor)', 'Not Urgent + Not Important', 'Take down patient point unit in surgery room (next to visia room). Do not take down until you have the items to repair the wall once it is taken down.  \r\nAlso there are 3 patient point units in the utility closet that need to go to the Wixom warehouse.', '', '', '6107929172613294538', 'Copied to PUNCHLIST');

-- --------------------------------------------------------

--
-- Table structure for table "tech_login_attempts"
--

CREATE TABLE "tech_login_attempts" (
  "id" int(11) NOT NULL,
  "ip_address" VARCHAR(45) NOT NULL,
  "user_id" VARCHAR(20) DEFAULT NULL,
  "success" tinyint(1) DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  "locked_until" TIMESTAMP NULL DEFAULT NULL
)   ;

-- --------------------------------------------------------

--
-- Table structure for table "tech_sessions"
--

CREATE TABLE "tech_sessions" (
  "id" VARCHAR(128) NOT NULL,
  "user_id" VARCHAR(20) NOT NULL,
  "user_email" VARCHAR(200) NOT NULL,
  "user_name" VARCHAR(100) NOT NULL,
  "user_role" enum('technician','admin') NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  "last_active" TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  "expires_at" TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00',
  "ip_address" VARCHAR(45) DEFAULT NULL,
  "user_agent" TEXT DEFAULT NULL
)   ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table "staff_approvals"
--
ALTER TABLE "staff_approvals"
  ADD PRIMARY KEY ("id"),
  ADD KEY "idx_ticket" ("ticket_id");

--
-- Indexes for table "staff_file_uploads"
--
ALTER TABLE "staff_file_uploads"
  ADD PRIMARY KEY ("id"),
  ADD KEY "idx_ticket_id" ("ticket_id"),
  ADD KEY "idx_status" ("status"),
  ADD KEY "idx_uploaded_by" ("uploaded_by"),
  ADD KEY "idx_file_uploads_ticket" ("ticket_id");

--
-- Indexes for table "staff_job_queue"
--
ALTER TABLE "staff_job_queue"
  ADD PRIMARY KEY ("id"),
  ADD KEY "idx_status" ("status"),
  ADD KEY "idx_job_queue_status" ("status","priority","created_at");

--
-- Indexes for table "staff_login_attempts"
--
ALTER TABLE "staff_login_attempts"
  ADD PRIMARY KEY ("id"),
  ADD KEY "idx_ip_address" ("ip_address"),
  ADD KEY "idx_created_at" ("created_at"),
  ADD KEY "idx_locked_until" ("locked_until"),
  ADD KEY "idx_ip_created" ("ip_address","created_at");

--
-- Indexes for table "staff_notifications"
--
ALTER TABLE "staff_notifications"
  ADD PRIMARY KEY ("id"),
  ADD KEY "idx_ticket" ("ticket_id");

--
-- Indexes for table "staff_pending_hires"
--
ALTER TABLE "staff_pending_hires"
  ADD PRIMARY KEY ("id");

--
-- Indexes for table "staff_tickets"
--
ALTER TABLE "staff_tickets"
  ADD PRIMARY KEY ("id"),
  ADD KEY "idx_status" ("status"),
  ADD KEY "idx_form_type" ("form_type"),
  ADD KEY "idx_submitter" ("submitter_email"),
  ADD KEY "idx_form_status_email" ("form_type","status","submitter_email"),
  ADD KEY "idx_status_action_taken" ("status","action_taken_at"),
  ADD KEY "idx_priority" ("priority"),
  ADD KEY "idx_location" ("location"),
  ADD KEY "idx_updated_at" ("updated_at"),
  ADD KEY "idx_request_type" ("request_type_virtual");

--
-- Indexes for table "staff_ticket_comments"
--
ALTER TABLE "staff_ticket_comments"
  ADD PRIMARY KEY ("id"),
  ADD KEY "idx_ticket" ("ticket_id"),
  ADD KEY "idx_comment_ticket" ("ticket_id");

--
-- Indexes for table "staff_user_cache"
--
ALTER TABLE "staff_user_cache"
  ADD PRIMARY KEY ("email"),
  ADD KEY "idx_expires_at" ("expires_at"),
  ADD KEY "idx_user_cache_email" ("email");

--
-- Indexes for table "tasks"
--
ALTER TABLE "tasks"
  ADD PRIMARY KEY ("id");

--
-- Indexes for table "tech_login_attempts"
--
ALTER TABLE "tech_login_attempts"
  ADD PRIMARY KEY ("id"),
  ADD KEY "idx_ip_created" ("ip_address","created_at"),
  ADD KEY "idx_locked_until" ("locked_until");

--
-- Indexes for table "tech_sessions"
--
ALTER TABLE "tech_sessions"
  ADD PRIMARY KEY ("id");

--
-- SERIAL for dumped tables
--

--
-- SERIAL for table "staff_approvals"
--
ALTER TABLE "staff_approvals"
  MODIFY "id" int(11) NOT NULL SERIAL;

--
-- SERIAL for table "staff_file_uploads"
--
ALTER TABLE "staff_file_uploads"
  MODIFY "id" int(11) NOT NULL SERIAL;

--
-- SERIAL for table "staff_job_queue"
--
ALTER TABLE "staff_job_queue"
  MODIFY "id" int(11) NOT NULL SERIAL, ;

--
-- SERIAL for table "staff_login_attempts"
--
ALTER TABLE "staff_login_attempts"
  MODIFY "id" int(11) NOT NULL SERIAL, ;

--
-- SERIAL for table "staff_notifications"
--
ALTER TABLE "staff_notifications"
  MODIFY "id" int(11) NOT NULL SERIAL;

--
-- SERIAL for table "staff_pending_hires"
--
ALTER TABLE "staff_pending_hires"
  MODIFY "id" int(11) NOT NULL SERIAL;

--
-- SERIAL for table "staff_tickets"
--
ALTER TABLE "staff_tickets"
  MODIFY "id" int(11) NOT NULL SERIAL, ;

--
-- SERIAL for table "staff_ticket_comments"
--
ALTER TABLE "staff_ticket_comments"
  MODIFY "id" int(11) NOT NULL SERIAL, ;

--
-- SERIAL for table "tasks"
--
ALTER TABLE "tasks"
  MODIFY "id" int(11) NOT NULL SERIAL, ;

--
-- SERIAL for table "tech_login_attempts"
--
ALTER TABLE "tech_login_attempts"
  MODIFY "id" int(11) NOT NULL SERIAL;

--
-- Constraints for dumped tables
--

--
-- Constraints for table "staff_approvals"
--
ALTER TABLE "staff_approvals"
  ADD CONSTRAINT "staff_approvals_ibfk_1" FOREIGN KEY ("ticket_id") REFERENCES "staff_tickets" ("id") ON DELETE CASCADE;

--
-- Constraints for table "staff_file_uploads"
--
ALTER TABLE "staff_file_uploads"
  ADD CONSTRAINT "staff_file_uploads_ibfk_1" FOREIGN KEY ("ticket_id") REFERENCES "staff_tickets" ("id") ON DELETE CASCADE;

--
-- Constraints for table "staff_notifications"
--
ALTER TABLE "staff_notifications"
  ADD CONSTRAINT "staff_notifications_ibfk_1" FOREIGN KEY ("ticket_id") REFERENCES "staff_tickets" ("id") ON DELETE CASCADE;

--
-- Constraints for table "staff_ticket_comments"
--
ALTER TABLE "staff_ticket_comments"
  ADD CONSTRAINT "staff_ticket_comments_ibfk_1" FOREIGN KEY ("ticket_id") REFERENCES "staff_tickets" ("id") ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


-- Update foreign key references to use UUIDs
-- This would need to be customized based on your specific schema

COMMIT;

-- Migration completed successfully
SELECT 'Legacy data migration completed!' as status;
