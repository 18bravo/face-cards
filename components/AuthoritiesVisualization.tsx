'use client'

import React, { useState, useMemo } from 'react'

// Complete list of DoD civilian officials from war.gov/About/Biographies
// with their concrete authorities mapped from statutory/regulatory sources

interface Authority {
  type: 'acquisition' | 'budget' | 'personnel' | 'operations' | 'policy'
  action: string
  threshold: string
}

interface Official {
  id: string
  name: string
  title: string
  abbrev: string
  level: number
  domain?: string
  reports_to?: string
  authorities: Authority[]
  category?: string
}

type OfficialCategory = 'secretary' | 'deputy' | 'usd' | 'asd' | 'dasd' | 'principals' | 'agencies' | 'cocoms' | 'jcs'

const OFFICIALS_DATA: Record<OfficialCategory, Official[]> = {
  // === TIER 1: SECRETARY ===
  secretary: [
    {
      id: "secwar",
      name: "Pete Hegseth",
      title: "Secretary of War",
      abbrev: "SECWAR",
      level: 1,
      authorities: [
        { type: "acquisition", action: "Designates alternate MDAs for ACAT I programs", threshold: "Any MDAP" },
        { type: "budget", action: "Approves General Transfer Authority use", threshold: "Up to $4B annually" },
        { type: "personnel", action: "Waives acquisition workforce requirements", threshold: "Any position" },
        { type: "operations", action: "Exercises authority, direction, control over DoD", threshold: "Unlimited" },
        { type: "policy", action: "Signs National Defense Strategy", threshold: "Statutory requirement" },
      ]
    },
  ],

  // === TIER 2: DEPUTY SECRETARY ===
  deputy: [
    {
      id: "depsecwar",
      name: "Steve Feinberg",
      title: "Deputy Secretary of War",
      abbrev: "DepSecWar",
      level: 2,
      authorities: [
        { type: "acquisition", action: "Acts for SECWAR on acquisition matters", threshold: "Full delegation" },
        { type: "budget", action: "Day-to-day budget execution oversight", threshold: "DoD-wide" },
        { type: "personnel", action: "Approves civilian workforce hiring freeze exemptions", threshold: "DoD-wide" },
        { type: "operations", action: "Day-to-day management of DoD", threshold: "All matters" },
      ]
    },
  ],

  // === TIER 3: UNDER SECRETARIES ===
  usd: [
    {
      id: "usd_as",
      name: "Michael P. Duffey",
      title: "Under Secretary of War for Acquisition and Sustainment",
      abbrev: "USD(A&S)",
      level: 3,
      domain: "Acquisition",
      authorities: [
        { type: "acquisition", action: "Milestone Decision Authority for ACAT ID programs", threshold: ">$300M RDT&E or >$1.8B procurement" },
        { type: "acquisition", action: "Approves cost-reimbursement contracts on MDAP production", threshold: "Any MDAP" },
        { type: "acquisition", action: "Designates MDAPs and ACATs", threshold: "All programs" },
        { type: "acquisition", action: "Peer review approval for competitive contracts", threshold: "≥$1B" },
        { type: "budget", action: "Certifies program affordability to Congress", threshold: "MDAP Milestone B" },
        { type: "personnel", action: "Sets acquisition workforce training requirements", threshold: "DoD-wide" },
      ]
    },
    {
      id: "usd_re",
      name: "Emil Michael",
      title: "Under Secretary of War for Research and Engineering / DoW CTO",
      abbrev: "USD(R&E)",
      level: 3,
      domain: "Technology",
      authorities: [
        { type: "acquisition", action: "Conducts/approves independent technical risk assessments", threshold: "Milestones A, B, production" },
        { type: "acquisition", action: "Technology maturation & risk reduction oversight", threshold: "All MDAPs" },
        { type: "operations", action: "Manages defense laboratories", threshold: "All DoD labs" },
        { type: "policy", action: "Sets S&T priorities and technology roadmaps", threshold: "DoD-wide" },
        { type: "policy", action: "DoD Chief Technology Officer responsibilities", threshold: "Enterprise-wide" },
      ]
    },
    {
      id: "usd_p",
      name: "Elbridge A. Colby",
      title: "Under Secretary of War for Policy",
      abbrev: "USD(P)",
      level: 3,
      domain: "Policy",
      authorities: [
        { type: "policy", action: "Principal advisor on national security & defense policy", threshold: "N/A" },
        { type: "operations", action: "Security cooperation & foreign military sales oversight", threshold: "All programs" },
        { type: "operations", action: "Overseas posture & force deployment policy", threshold: "Global" },
        { type: "policy", action: "Cyber & space warfighting policy development", threshold: "N/A" },
      ]
    },
    {
      id: "usd_pr",
      name: "Anthony J. Tata",
      title: "Under Secretary of War for Personnel and Readiness",
      abbrev: "USD(P&R)",
      level: 3,
      domain: "Personnel",
      authorities: [
        { type: "personnel", action: "Chief Human Capital Officer for DoD", threshold: "Entire civilian workforce" },
        { type: "personnel", action: "Approves direct-hire authority requests", threshold: "Component-wide" },
        { type: "personnel", action: "Sets military end-strength & recruiting targets", threshold: "Service-wide" },
        { type: "personnel", action: "Oversees reserve mobilization", threshold: "800K+ since 2001" },
        { type: "personnel", action: "Final decision on adverse actions exceeding 30-day window", threshold: "Individual cases" },
        { type: "operations", action: "Administrative agent for TRICARE, commissaries, DoDEA", threshold: "Direct control" },
      ]
    },
    {
      id: "usd_is",
      name: "Bradley D. Hansell",
      title: "Under Secretary of War for Intelligence and Security",
      abbrev: "USD(I&S)",
      level: 3,
      domain: "Intelligence",
      authorities: [
        { type: "operations", action: "Oversees defense intelligence agencies", threshold: "DIA, NGA, NSA, NRO" },
        { type: "personnel", action: "Security clearance policy", threshold: "DoD-wide" },
        { type: "operations", action: "Counterintelligence oversight", threshold: "All DoD components" },
        { type: "policy", action: "Defense intelligence strategy and policy", threshold: "Enterprise-wide" },
      ]
    },
  ],

  // === TIER 4: ASSISTANT SECRETARIES (OSD) ===
  asd: [
    {
      id: "asd_solic",
      name: "Derrick M. Anderson",
      title: "Assistant Secretary of War for Special Operations and Low-Intensity Conflict",
      abbrev: "ASD(SO/LIC)",
      level: 4,
      reports_to: "USD(P)",
      authorities: [
        { type: "budget", action: "Budget authority for special operations enterprise", threshold: "SO-peculiar programs" },
        { type: "operations", action: "Directly subordinate to SECWAR on SO matters", threshold: "Statutory protection" },
        { type: "policy", action: "Principal Staff Assistant for special operations", threshold: "N/A" },
      ]
    },
    {
      id: "asd_ha",
      name: "Keith Bass",
      title: "Assistant Secretary of War for Health Affairs",
      abbrev: "ASD(HA)",
      level: 4,
      reports_to: "USD(P&R)",
      authorities: [
        { type: "operations", action: "Oversees Military Health System", threshold: "9.6M beneficiaries" },
        { type: "budget", action: "Defense Health Program budget authority", threshold: "~$50B annually" },
        { type: "personnel", action: "Medical readiness policies", threshold: "All services" },
        { type: "policy", action: "Health policy for military and dependents", threshold: "Enterprise-wide" },
      ]
    },
    {
      id: "asd_ibp",
      name: "Michael Cadenazzi",
      title: "Assistant Secretary of War for Industrial Base Policy",
      abbrev: "ASD(IBP)",
      level: 4,
      reports_to: "USD(A&S)",
      authorities: [
        { type: "policy", action: "Defense industrial base strategy", threshold: "N/A" },
        { type: "operations", action: "CFIUS national security reviews", threshold: "Foreign transactions" },
        { type: "acquisition", action: "Manufacturing technology programs", threshold: "ManTech portfolio" },
        { type: "policy", action: "Supply chain risk management policy", threshold: "DoD-wide" },
      ]
    },
    {
      id: "asd_ct",
      name: "Michael 'Mike' Dodd",
      title: "Assistant Secretary of War for Critical Technologies",
      abbrev: "ASD(CT)",
      level: 4,
      reports_to: "USD(R&E)",
      authorities: [
        { type: "acquisition", action: "Critical technology protection oversight", threshold: "All critical tech programs" },
        { type: "policy", action: "Technology control policy", threshold: "Export/transfer controls" },
        { type: "operations", action: "Acting Deputy Director, Defense Innovation Unit", threshold: "DIU operations" },
      ]
    },
    {
      id: "asd_readiness",
      name: "Peter I. Belk",
      title: "Acting Assistant Secretary of War for Readiness",
      abbrev: "ASD(Readiness)",
      level: 4,
      reports_to: "USD(P&R)",
      authorities: [
        { type: "operations", action: "Force readiness oversight", threshold: "All DoD components" },
        { type: "policy", action: "Training and exercise policy", threshold: "DoD-wide" },
        { type: "operations", action: "Readiness reporting requirements", threshold: "Statutory compliance" },
      ]
    },
    {
      id: "asd_la",
      name: "Dane Hughes",
      title: "Assistant Secretary of War for Legislative Affairs",
      abbrev: "ASD(LA)",
      level: 4,
      reports_to: "SECWAR",
      authorities: [
        { type: "policy", action: "Congressional relations coordination", threshold: "All DoD testimony" },
        { type: "operations", action: "Legislative proposal development", threshold: "DoD legislative program" },
      ]
    },
    {
      id: "asd_hdasa",
      name: "Joseph M. Humire",
      title: "Performing Duties of ASD for Homeland Defense and Americas Security Affairs",
      abbrev: "ASD(HD&ASA)",
      level: 4,
      reports_to: "USD(P)",
      authorities: [
        { type: "operations", action: "Defense support to civil authorities", threshold: "DSCA requests" },
        { type: "policy", action: "Homeland defense policy", threshold: "NORTHCOM/SOUTHCOM AOR" },
        { type: "operations", action: "Border security support coordination", threshold: "As directed" },
      ]
    },
    {
      id: "asd_mra",
      name: "Jules W. Hurst III",
      title: "Performing Duties of ASD for Manpower and Reserve Affairs",
      abbrev: "ASD(M&RA)",
      level: 4,
      reports_to: "USD(P&R)",
      authorities: [
        { type: "personnel", action: "Total Force manpower policies", threshold: "All components" },
        { type: "operations", action: "Authority over Employer Support of Guard & Reserve", threshold: "Direct control" },
        { type: "personnel", action: "Reserve component facilities governance", threshold: "ARNG, ANG, Reserves" },
      ]
    },
    {
      id: "asd_st",
      name: "Joseph S. Jewell",
      title: "Assistant Secretary of War for Science and Technology",
      abbrev: "ASD(S&T)",
      level: 4,
      reports_to: "USD(R&E)",
      authorities: [
        { type: "acquisition", action: "S&T investment strategy", threshold: "6.1-6.3 programs" },
        { type: "operations", action: "Basic research program oversight", threshold: "All DoD basic research" },
        { type: "policy", action: "S&T workforce development", threshold: "Labs and RDT&E workforce" },
      ]
    },
    {
      id: "asd_ipsa",
      name: "John Noh",
      title: "Assistant Secretary of War for Indo-Pacific Security Affairs",
      abbrev: "ASD(IPSA)",
      level: 4,
      reports_to: "USD(P)",
      authorities: [
        { type: "policy", action: "Indo-Pacific defense policy", threshold: "INDOPACOM AOR" },
        { type: "operations", action: "Alliance management coordination", threshold: "Japan, Korea, Australia, etc." },
        { type: "policy", action: "China strategy implementation", threshold: "Regional focus" },
      ]
    },
    {
      id: "asd_spf",
      name: "Rafael F. Leonardo",
      title: "Performing Duties of ASD for Strategy, Plans, and Forces",
      abbrev: "ASD(SPF)",
      level: 4,
      reports_to: "USD(P)",
      authorities: [
        { type: "policy", action: "Defense strategy development", threshold: "NDS implementation" },
        { type: "policy", action: "Force planning and programming", threshold: "FYDP development" },
        { type: "budget", action: "Program and budget review coordination", threshold: "Policy perspective" },
      ]
    },
    {
      id: "asd_acq",
      name: "James A. Ruocco",
      title: "Performing Duties of ASD for Acquisition",
      abbrev: "ASD(Acquisition)",
      level: 4,
      reports_to: "USD(A&S)",
      authorities: [
        { type: "acquisition", action: "Acquisition policy and oversight", threshold: "DoD-wide" },
        { type: "acquisition", action: "Defense Acquisition System management", threshold: "DoDI 5000.02" },
        { type: "acquisition", action: "Acquisition workforce policy", threshold: "DAU coordination" },
      ]
    },
    {
      id: "asd_sus",
      name: "Steven J. Morani",
      title: "Acting Assistant Secretary of War for Sustainment",
      abbrev: "ASD(Sustainment)",
      level: 4,
      reports_to: "USD(A&S)",
      authorities: [
        { type: "acquisition", action: "Logistics & materiel readiness policy", threshold: "DoD-wide" },
        { type: "operations", action: "Installation management oversight", threshold: "All DoD installations" },
        { type: "operations", action: "Environment & energy policy", threshold: "DoD-wide" },
      ]
    },
    {
      id: "asd_ncbdpp",
      name: "Drew Walter",
      title: "Performing Duties of ASD for Nuclear Deterrence, Chemical, and Biological Defense Policy and Programs",
      abbrev: "ASD(NCB)",
      level: 4,
      reports_to: "USD(A&S)",
      authorities: [
        { type: "operations", action: "Nuclear enterprise oversight", threshold: "NC3 programs" },
        { type: "acquisition", action: "CBRN defense programs", threshold: "All CBRN acquisition" },
        { type: "policy", action: "Nuclear policy coordination", threshold: "With USD(P)" },
      ]
    },
    {
      id: "asd_cp",
      name: "Katherine E. Sutton",
      title: "Assistant Secretary of War for Cyber Policy and Principal Cyber Advisor",
      abbrev: "ASD(Cyber)",
      level: 4,
      reports_to: "USD(P)",
      authorities: [
        { type: "policy", action: "Cyber operations policy", threshold: "DoD-wide" },
        { type: "operations", action: "Principal Cyber Advisor to SECWAR", threshold: "Statutory role" },
        { type: "policy", action: "Cyber workforce development policy", threshold: "Enterprise-wide" },
      ]
    },
    {
      id: "asd_isa",
      name: "Daniel L. Zimmerman",
      title: "Assistant Secretary of War for International Security Affairs",
      abbrev: "ASD(ISA)",
      level: 4,
      reports_to: "USD(P)",
      authorities: [
        { type: "policy", action: "European and NATO defense policy", threshold: "EUCOM AOR" },
        { type: "policy", action: "Middle East defense policy", threshold: "CENTCOM AOR" },
        { type: "policy", action: "African defense policy", threshold: "AFRICOM AOR" },
        { type: "operations", action: "Security cooperation oversight", threshold: "Regional programs" },
      ]
    },
  ],

  // === TIER 5: DEPUTY ASSISTANT SECRETARIES ===
  dasd: [
    {
      id: "dasd_enp",
      name: "David A. Baker",
      title: "Deputy Assistant Secretary of War, European & NATO Policy",
      abbrev: "DASD(ENP)",
      level: 5,
      reports_to: "ASD(ISA)",
      authorities: [
        { type: "policy", action: "NATO defense policy implementation", threshold: "Alliance coordination" },
        { type: "operations", action: "European security assistance", threshold: "EUCOM programs" },
      ]
    },
    {
      id: "dasd_smd",
      name: "Robert Brose",
      title: "Deputy Assistant Secretary of War for Space and Missile Defense",
      abbrev: "DASD(SMD)",
      level: 5,
      reports_to: "USD(P)",
      authorities: [
        { type: "policy", action: "Space and missile defense policy", threshold: "Enterprise-wide" },
        { type: "acquisition", action: "Space/MD acquisition coordination", threshold: "Policy perspective" },
      ]
    },
    {
      id: "dasd_cnsp",
      name: "Michael Buemi",
      title: "Deputy Assistant Secretary of War for Counternarcotics and Stabilization Policy",
      abbrev: "DASD(CN&SP)",
      level: 5,
      reports_to: "ASD(SO/LIC)",
      authorities: [
        { type: "operations", action: "Counternarcotics program oversight", threshold: "DoD CN programs" },
        { type: "policy", action: "Stabilization operations policy", threshold: "Fragile states" },
      ]
    },
    {
      id: "dasd_ssea",
      name: "Dr. Andrew Byers",
      title: "Deputy Assistant Secretary of War for South and Southeast Asia",
      abbrev: "DASD(SSEA)",
      level: 5,
      reports_to: "ASD(IPSA)",
      authorities: [
        { type: "policy", action: "South/Southeast Asia defense policy", threshold: "Regional focus" },
        { type: "operations", action: "Security cooperation coordination", threshold: "India, ASEAN partners" },
      ]
    },
    {
      id: "dasd_sfd",
      name: "Christopher Bassler",
      title: "Performing Duties of DASD for Strategy and Force Development",
      abbrev: "DASD(S&FD)",
      level: 5,
      reports_to: "ASD(SPF)",
      authorities: [
        { type: "policy", action: "Force structure analysis", threshold: "FYDP development" },
        { type: "policy", action: "Capability gap assessments", threshold: "Enterprise-wide" },
      ]
    },
    {
      id: "dasd_cpp",
      name: "Michael A. Cogar",
      title: "Deputy Assistant Secretary of War for Civilian Personnel Policy",
      abbrev: "DASD(CPP)",
      level: 5,
      reports_to: "USD(P&R)",
      authorities: [
        { type: "personnel", action: "Approves term appointment extensions beyond 8 years", threshold: "Individual cases" },
        { type: "personnel", action: "Civilian hiring guidance and policy", threshold: "DoD-wide" },
        { type: "personnel", action: "Performance management policy", threshold: "All DoD civilians" },
      ]
    },
    {
      id: "dasd_nm",
      name: "Casey L. Deering",
      title: "Acting Deputy Assistant Secretary of War for Nuclear Matters",
      abbrev: "DASD(NM)",
      level: 5,
      reports_to: "ASD(NCB)",
      authorities: [
        { type: "operations", action: "Nuclear weapons policy coordination", threshold: "NC3/nuclear enterprise" },
        { type: "policy", action: "Nuclear posture review support", threshold: "Policy development" },
      ]
    },
    {
      id: "dasd_ra",
      name: "Stephen B. Dillard",
      title: "Deputy Assistant Secretary of War for Readiness Analytics",
      abbrev: "DASD(RA)",
      level: 5,
      reports_to: "ASD(Readiness)",
      authorities: [
        { type: "operations", action: "Readiness data analysis", threshold: "Force readiness metrics" },
        { type: "policy", action: "Readiness reporting methodology", threshold: "Enterprise-wide" },
      ]
    },
    {
      id: "dasd_me",
      name: "Michael P. DiMino IV",
      title: "Deputy Assistant Secretary of War for the Middle East",
      abbrev: "DASD(ME)",
      level: 5,
      reports_to: "ASD(ISA)",
      authorities: [
        { type: "policy", action: "Middle East defense policy implementation", threshold: "CENTCOM AOR" },
        { type: "operations", action: "Regional security assistance", threshold: "Partner nations" },
      ]
    },
    {
      id: "dasd_aa",
      name: "Bryan J. Ellis",
      title: "Deputy Assistant Secretary of War for African Affairs",
      abbrev: "DASD(AA)",
      level: 5,
      reports_to: "ASD(ISA)",
      authorities: [
        { type: "policy", action: "African defense policy", threshold: "AFRICOM AOR" },
        { type: "operations", action: "Africa security cooperation", threshold: "Partner nations" },
      ]
    },
    {
      id: "dasd_ri",
      name: "Ted C. Graham",
      title: "Deputy Assistant Secretary of War for Reserve Integration",
      abbrev: "DASD(RI)",
      level: 5,
      reports_to: "ASD(M&RA)",
      authorities: [
        { type: "personnel", action: "Reserve component integration policy", threshold: "All reserve components" },
        { type: "operations", action: "Guard/Reserve mobilization coordination", threshold: "As required" },
      ]
    },
    {
      id: "dasd_soppps",
      name: "Randall L. Harvey",
      title: "Deputy Assistant Secretary of War for Special Operations Policy & Programs",
      abbrev: "DASD(SO P&P)",
      level: 5,
      reports_to: "ASD(SO/LIC)",
      authorities: [
        { type: "policy", action: "Special operations forces policy", threshold: "SOF enterprise" },
        { type: "budget", action: "MFP-11 budget coordination", threshold: "SO-peculiar funding" },
      ]
    },
    {
      id: "dasd_rue",
      name: "Kathleen Heesch-Eccles",
      title: "Acting Deputy Assistant Secretary of War for Russia, Ukraine, and Eurasia",
      abbrev: "DASD(RUE)",
      level: 5,
      reports_to: "ASD(ISA)",
      authorities: [
        { type: "policy", action: "Russia/Eurasia defense policy", threshold: "Regional focus" },
        { type: "operations", action: "Ukraine security assistance coordination", threshold: "USAI programs" },
      ]
    },
    {
      id: "dasd_stpp",
      name: "Robert E. Irie",
      title: "Deputy Assistant Secretary of War for Science and Technology Program Protection",
      abbrev: "DASD(ST-PP)",
      level: 5,
      reports_to: "ASD(S&T)",
      authorities: [
        { type: "policy", action: "Technology protection policy", threshold: "S&T programs" },
        { type: "operations", action: "Anti-tamper and security coordination", threshold: "Critical programs" },
      ]
    },
    {
      id: "dasd_iwct",
      name: "Colby C. Jenkins",
      title: "Deputy Assistant Secretary of War for Irregular Warfare and Counterterrorism",
      abbrev: "DASD(IW&CT)",
      level: 5,
      reports_to: "ASD(SO/LIC)",
      authorities: [
        { type: "policy", action: "Irregular warfare policy", threshold: "DoD-wide" },
        { type: "operations", action: "Counterterrorism coordination", threshold: "CT operations" },
      ]
    },
    {
      id: "dasd_cyp",
      name: "Dr. Paul J. Lyons",
      title: "Performing Duties of DASD for Cyber Policy",
      abbrev: "DASD(Cyber Policy)",
      level: 5,
      reports_to: "ASD(Cyber)",
      authorities: [
        { type: "policy", action: "Cyber operations policy development", threshold: "CYBERCOM coordination" },
        { type: "policy", action: "Cyber workforce policy", threshold: "Enterprise-wide" },
      ]
    },
    {
      id: "dasd_sc",
      name: "Christopher Mamaux",
      title: "Deputy Assistant Secretary of War for Security Cooperation",
      abbrev: "DASD(SC)",
      level: 5,
      reports_to: "USD(P)",
      authorities: [
        { type: "operations", action: "Security cooperation program oversight", threshold: "All SC programs" },
        { type: "policy", action: "FMS/FMF policy coordination", threshold: "DoD equities" },
      ]
    },
    {
      id: "dasd_log",
      name: "Leigh E. Method",
      title: "Deputy Assistant Secretary of War for Logistics",
      abbrev: "DASD(Logistics)",
      level: 5,
      reports_to: "ASD(Sustainment)",
      authorities: [
        { type: "operations", action: "DoD logistics policy", threshold: "Enterprise-wide" },
        { type: "acquisition", action: "Logistics acquisition oversight", threshold: "Sustainment programs" },
      ]
    },
    {
      id: "dasd_sr",
      name: "Ronald J. Moeller",
      title: "Deputy Assistant Secretary of War for Strategic Readiness",
      abbrev: "DASD(SR)",
      level: 5,
      reports_to: "ASD(Readiness)",
      authorities: [
        { type: "operations", action: "Strategic readiness assessments", threshold: "Force posture" },
        { type: "policy", action: "Contingency planning coordination", threshold: "OSD perspective" },
      ]
    },
    {
      id: "dasd_ha",
      name: "Brendan O'Toole",
      title: "Deputy Assistant Secretary of War for House Affairs",
      abbrev: "DASD(House)",
      level: 5,
      reports_to: "ASD(LA)",
      authorities: [
        { type: "policy", action: "House relations coordination", threshold: "Congressional liaison" },
      ]
    },
    {
      id: "dasd_sa",
      name: "Jonathan Broderick",
      title: "Deputy Assistant Secretary of War for Senate Affairs",
      abbrev: "DASD(Senate)",
      level: 5,
      reports_to: "ASD(LA)",
      authorities: [
        { type: "policy", action: "Senate relations coordination", threshold: "Congressional liaison" },
      ]
    },
    {
      id: "dasd_hspo",
      name: "Susan Orsega",
      title: "Deputy Assistant Secretary of War, Health Services Policy and Oversight",
      abbrev: "DASD(HSP&O)",
      level: 5,
      reports_to: "ASD(HA)",
      authorities: [
        { type: "policy", action: "Health services policy development", threshold: "MHS enterprise" },
        { type: "operations", action: "Health program oversight", threshold: "TRICARE programs" },
      ]
    },
    {
      id: "dasd_hrmp",
      name: "Darrell Landreaux",
      title: "Deputy Assistant Secretary of War for Health Resources Management and Policy",
      abbrev: "DASD(HRM&P)",
      level: 5,
      reports_to: "ASD(HA)",
      authorities: [
        { type: "budget", action: "DHP resource management", threshold: "Health budget" },
        { type: "personnel", action: "Medical workforce policy", threshold: "MHS personnel" },
      ]
    },
    {
      id: "dasd_housing",
      name: "Patricia Coury",
      title: "Deputy Assistant Secretary of War for Housing",
      abbrev: "DASD(Housing)",
      level: 5,
      reports_to: "ASD(Sustainment)",
      authorities: [
        { type: "operations", action: "Military housing oversight", threshold: "All DoD housing" },
        { type: "policy", action: "Privatized housing policy", threshold: "MHPI programs" },
      ]
    },
    {
      id: "dasd_mcfp",
      name: "Stephen B. Simmons",
      title: "Deputy Assistant Secretary of War for Military Community and Family Policy",
      abbrev: "DASD(MC&FP)",
      level: 5,
      reports_to: "USD(P&R)",
      authorities: [
        { type: "policy", action: "Military family support programs", threshold: "All services" },
        { type: "operations", action: "MWR and commissary oversight", threshold: "Non-appropriated funds" },
      ]
    },
    {
      id: "dasd_trac",
      name: "Cassandra Simmons-Brown",
      title: "Performing Duties of DASD for Threat Reduction and Arms Control",
      abbrev: "DASD(TR&AC)",
      level: 5,
      reports_to: "USD(P)",
      authorities: [
        { type: "policy", action: "Arms control policy coordination", threshold: "Treaty implementation" },
        { type: "operations", action: "Threat reduction programs", threshold: "CTR programs" },
      ]
    },
    {
      id: "dasd_ctm",
      name: "Alvaro R. Smith",
      title: "Deputy Assistant Secretary of War for China, Taiwan, and Mongolia",
      abbrev: "DASD(CTM)",
      level: 5,
      reports_to: "ASD(IPSA)",
      authorities: [
        { type: "policy", action: "China defense policy implementation", threshold: "Strategic competition" },
        { type: "policy", action: "Taiwan relations coordination", threshold: "TRA implementation" },
      ]
    },
    {
      id: "dasd_ps",
      name: "Lisa P. Smith",
      title: "Deputy Assistant Secretary of War for Product Support",
      abbrev: "DASD(PS)",
      level: 5,
      reports_to: "ASD(Sustainment)",
      authorities: [
        { type: "acquisition", action: "Product support strategy oversight", threshold: "Life-cycle sustainment" },
        { type: "policy", action: "Performance-based logistics policy", threshold: "PBL contracts" },
      ]
    },
    {
      id: "dasd_ndcwmd",
      name: "Dr. Robert Soofer",
      title: "Deputy Assistant Secretary of War for Nuclear Deterrence and Countering Weapons of Mass Destruction Policy",
      abbrev: "DASD(ND&CWMD)",
      level: 5,
      reports_to: "USD(P)",
      authorities: [
        { type: "policy", action: "Nuclear deterrence policy", threshold: "Strategic posture" },
        { type: "policy", action: "WMD counter-proliferation policy", threshold: "Enterprise-wide" },
      ]
    },
    {
      id: "dasd_rp",
      name: "Ron Tickle",
      title: "Deputy Assistant Secretary of War for Real Property",
      abbrev: "DASD(RP)",
      level: 5,
      reports_to: "ASD(Sustainment)",
      authorities: [
        { type: "operations", action: "Installation real property management", threshold: "All DoD real property" },
        { type: "policy", action: "BRAC implementation oversight", threshold: "As applicable" },
      ]
    },
    {
      id: "dasd_cbrnd",
      name: "Ian Watson",
      title: "Deputy Assistant Secretary of War for Chemical, Biological, Radiological, and Nuclear Defense",
      abbrev: "DASD(CBRND)",
      level: 5,
      reports_to: "ASD(NCB)",
      authorities: [
        { type: "acquisition", action: "CBRN defense acquisition coordination", threshold: "CBRN programs" },
        { type: "policy", action: "CBRN defense policy", threshold: "Force protection" },
      ]
    },
    {
      id: "dasd_mi",
      name: "Elmer L. Roman",
      title: "Deputy Assistant Secretary of War for Mission Integration",
      abbrev: "DASD(MI)",
      level: 5,
      reports_to: "USD(I&S)",
      authorities: [
        { type: "operations", action: "Intelligence mission integration", threshold: "IC coordination" },
        { type: "policy", action: "Defense intelligence integration", threshold: "Enterprise-wide" },
      ]
    },
    {
      id: "dasd_stfut",
      name: "Jeffrey D. Singleton",
      title: "Deputy Assistant Secretary of War (Science & Technology Futures)",
      abbrev: "DASD(S&T Futures)",
      level: 5,
      reports_to: "ASD(S&T)",
      authorities: [
        { type: "policy", action: "Emerging technology assessment", threshold: "6.1-6.2 programs" },
        { type: "acquisition", action: "Technology transition planning", threshold: "Lab-to-field" },
      ]
    },
    {
      id: "dasd_stfound",
      name: "Dr. Jagadeesh Pamulapati",
      title: "Deputy Assistant Secretary of War for Science and Technology Foundations",
      abbrev: "DASD(ST Foundations)",
      level: 5,
      reports_to: "ASD(S&T)",
      authorities: [
        { type: "policy", action: "Basic research policy", threshold: "6.1 programs" },
        { type: "operations", action: "University research coordination", threshold: "DoD-academic partnerships" },
      ]
    },
  ],

  // === PRINCIPAL DEPUTIES & KEY STAFF ===
  principals: [
    {
      id: "gc",
      name: "Earl G. Matthews",
      title: "General Counsel of the Department of War",
      abbrev: "GC",
      level: 3,
      authorities: [
        { type: "policy", action: "Legal advice to SECWAR and DoW leadership", threshold: "All legal matters" },
        { type: "operations", action: "Litigation oversight", threshold: "DoD-wide" },
        { type: "policy", action: "Ethics program oversight", threshold: "DoD ethics" },
      ]
    },
    {
      id: "cdao",
      name: "Cameron Stanley",
      title: "Chief Digital and Artificial Intelligence Officer",
      abbrev: "CDAO",
      level: 4,
      authorities: [
        { type: "policy", action: "DoD AI strategy implementation", threshold: "Enterprise AI" },
        { type: "operations", action: "Data governance and analytics", threshold: "DoD data assets" },
        { type: "acquisition", action: "AI/ML program coordination", threshold: "AI acquisition" },
      ]
    },
    {
      id: "dam",
      name: "Robert G. Salesses",
      title: "Director of Administration and Management",
      abbrev: "DA&M",
      level: 4,
      authorities: [
        { type: "operations", action: "OSD administration and management", threshold: "Pentagon operations" },
        { type: "personnel", action: "OSD civilian personnel management", threshold: "OSD workforce" },
      ]
    },
    {
      id: "dusd_re",
      name: "James G. Mazol",
      title: "Deputy Under Secretary of Defense (Research and Engineering)",
      abbrev: "DUSD(R&E)",
      level: 4,
      reports_to: "USD(R&E)",
      authorities: [
        { type: "acquisition", action: "R&E program coordination", threshold: "All R&E programs" },
        { type: "policy", action: "Technology strategy implementation", threshold: "USD(R&E) guidance" },
      ]
    },
    {
      id: "dusd_pr",
      name: "Sean O'Keefe",
      title: "Deputy Under Secretary of Defense for Personnel and Readiness",
      abbrev: "DUSD(P&R)",
      level: 4,
      reports_to: "USD(P&R)",
      authorities: [
        { type: "personnel", action: "P&R policy coordination", threshold: "USD(P&R) guidance" },
        { type: "operations", action: "Readiness program oversight", threshold: "Enterprise-wide" },
      ]
    },
    {
      id: "dusd_p",
      name: "Austin Dahmer",
      title: "Performing the Duties of Deputy Under Secretary of War for Policy",
      abbrev: "DUSD(P)",
      level: 4,
      reports_to: "USD(P)",
      authorities: [
        { type: "policy", action: "Policy coordination and integration", threshold: "USD(P) guidance" },
        { type: "operations", action: "OUSD(P) day-to-day management", threshold: "Staff oversight" },
      ]
    },
    {
      id: "dusd_is",
      name: "Dustin J. Gard-Weiss",
      title: "Performing Duties of Deputy Under Secretary of War for Intelligence and Security",
      abbrev: "DUSD(I&S)",
      level: 4,
      reports_to: "USD(I&S)",
      authorities: [
        { type: "operations", action: "I&S policy coordination", threshold: "USD(I&S) guidance" },
        { type: "personnel", action: "Security policy implementation", threshold: "Clearance programs" },
      ]
    },
    {
      id: "atsd_pa",
      name: "Sean Parnell",
      title: "Assistant to the Secretary of War for Public Affairs and Senior Advisor",
      abbrev: "ATSD(PA)",
      level: 4,
      authorities: [
        { type: "policy", action: "Public affairs strategy", threshold: "DoD communications" },
        { type: "operations", action: "Media relations coordination", threshold: "DoD-wide" },
      ]
    },
  ],

  // === DEFENSE AGENCIES & FIELD ACTIVITIES ===
  agencies: [
    {
      id: "dir_dsca",
      name: "Michael F. Miller",
      title: "Director of the Defense Security Cooperation Agency",
      abbrev: "Dir, DSCA",
      level: 4,
      authorities: [
        { type: "operations", action: "Security cooperation program execution", threshold: "All SC cases" },
        { type: "budget", action: "FMS Trust Fund management", threshold: "~$50B+ annually" },
        { type: "acquisition", action: "FMS case implementation", threshold: "Partner nation sales" },
      ]
    },
    {
      id: "dir_dla",
      name: "LTG Mark T. Simerly",
      title: "Defense Logistics Agency Director",
      abbrev: "Dir, DLA",
      level: 4,
      authorities: [
        { type: "operations", action: "Defense-wide logistics support", threshold: "All DoD components" },
        { type: "acquisition", action: "Consumable item procurement", threshold: "~$40B+ annually" },
        { type: "operations", action: "Strategic material stockpile management", threshold: "National stockpile" },
      ]
    },
    {
      id: "dir_disa",
      name: "LTG Paul T. Stanton",
      title: "DoW Cyber Defense Command Commander and Director, DISA",
      abbrev: "Dir, DISA",
      level: 4,
      authorities: [
        { type: "operations", action: "DoD information network operations", threshold: "DODIN" },
        { type: "acquisition", action: "IT/communications acquisition", threshold: "Enterprise services" },
        { type: "operations", action: "Cyber defense operations", threshold: "Network defense" },
      ]
    },
    {
      id: "dir_dtra",
      name: "MG Lyle K. Drew",
      title: "Acting Director of the Defense Threat Reduction Agency",
      abbrev: "Dir, DTRA",
      level: 4,
      authorities: [
        { type: "operations", action: "WMD threat reduction programs", threshold: "CTR implementation" },
        { type: "acquisition", action: "Counter-WMD technology development", threshold: "CWMD programs" },
      ]
    },
    {
      id: "dir_mda",
      name: "LTG Heath A. Collins",
      title: "Missile Defense Agency Director",
      abbrev: "Dir, MDA",
      level: 4,
      authorities: [
        { type: "acquisition", action: "Missile defense system development", threshold: "All MD programs" },
        { type: "budget", action: "MDA program budget execution", threshold: "~$10B+ annually" },
        { type: "operations", action: "Missile defense testing coordination", threshold: "All MD tests" },
      ]
    },
    {
      id: "dir_sda",
      name: "Derek M. Tournear",
      title: "Director of the Space Development Agency",
      abbrev: "Dir, SDA",
      level: 4,
      authorities: [
        { type: "acquisition", action: "Proliferated warfighter space architecture", threshold: "Transport/tracking layers" },
        { type: "operations", action: "Space capability delivery", threshold: "Tranche deployments" },
      ]
    },
    {
      id: "dir_sco",
      name: "Jay Dryer",
      title: "Director of the Strategic Capabilities Office",
      abbrev: "Dir, SCO",
      level: 4,
      authorities: [
        { type: "acquisition", action: "Rapid capability development", threshold: "SCO portfolio" },
        { type: "operations", action: "Emerging capability demonstrations", threshold: "Prototype fielding" },
      ]
    },
    {
      id: "dir_dha",
      name: "David J. Smith",
      title: "Acting Director, Defense Health Agency",
      abbrev: "Dir, DHA",
      level: 4,
      authorities: [
        { type: "operations", action: "Military treatment facility management", threshold: "All MTFs" },
        { type: "operations", action: "TRICARE program execution", threshold: "9.6M beneficiaries" },
        { type: "budget", action: "DHP execution", threshold: "Health budget" },
      ]
    },
    {
      id: "dir_deca",
      name: "John E. Hall",
      title: "Director and CEO, Defense Commissary Agency",
      abbrev: "Dir, DeCA",
      level: 4,
      authorities: [
        { type: "operations", action: "Commissary system management", threshold: "236 stores worldwide" },
        { type: "budget", action: "Commissary operations", threshold: "~$4B+ sales" },
      ]
    },
    {
      id: "dir_dodea",
      name: "Dr. Beth Schiavino-Narvaez",
      title: "Director of the Department of War Education Activity",
      abbrev: "Dir, DoDEA",
      level: 4,
      authorities: [
        { type: "operations", action: "DoD school system management", threshold: "160+ schools" },
        { type: "personnel", action: "DoD educator workforce", threshold: "~8,700 educators" },
      ]
    },
    {
      id: "dir_pfpa",
      name: "Chris Bargery",
      title: "Director of the Pentagon Force Protection Agency",
      abbrev: "Dir, PFPA",
      level: 4,
      authorities: [
        { type: "operations", action: "Pentagon Reservation security", threshold: "All Pentagon facilities" },
        { type: "personnel", action: "Pentagon police force management", threshold: "PFPA workforce" },
      ]
    },
    {
      id: "dir_whs",
      name: "Regina Meiners",
      title: "Director, Washington Headquarters Services",
      abbrev: "Dir, WHS",
      level: 4,
      authorities: [
        { type: "operations", action: "OSD administrative support", threshold: "NCR operations" },
        { type: "personnel", action: "WHS civilian personnel", threshold: "WHS workforce" },
      ]
    },
    {
      id: "dir_dpaa",
      name: "Kelly K. McKeague",
      title: "Director, Defense POW/MIA Accounting Agency",
      abbrev: "Dir, DPAA",
      level: 4,
      authorities: [
        { type: "operations", action: "POW/MIA recovery operations", threshold: "~81,500 unaccounted" },
        { type: "operations", action: "Family notification coordination", threshold: "Identification cases" },
      ]
    },
    {
      id: "dir_dfas",
      name: "Jonathan Witter",
      title: "Director of the Defense Finance and Accounting Service",
      abbrev: "Dir, DFAS",
      level: 4,
      authorities: [
        { type: "budget", action: "DoD financial operations", threshold: "~$600B+ payments/year" },
        { type: "operations", action: "Military pay processing", threshold: "All service members" },
      ]
    },
  ],

  // === COMBATANT COMMAND COMMANDERS ===
  cocoms: [
    {
      id: "cdr_usindopacom",
      name: "ADM Samuel Paparo",
      title: "Commander, United States Indo-Pacific Command",
      abbrev: "CDR, USINDOPACOM",
      level: 4,
      authorities: [
        { type: "operations", action: "Indo-Pacific theater operations", threshold: "AOR command" },
        { type: "policy", action: "Theater campaign plan execution", threshold: "INDOPACOM TCP" },
      ]
    },
    {
      id: "cdr_uscentcom",
      name: "ADM Brad Cooper",
      title: "Commander, United States Central Command",
      abbrev: "CDR, USCENTCOM",
      level: 4,
      authorities: [
        { type: "operations", action: "Middle East/Central Asia operations", threshold: "AOR command" },
        { type: "operations", action: "CT and deterrence operations", threshold: "Theater requirements" },
      ]
    },
    {
      id: "cdr_ussocom",
      name: "ADM Frank M. Bradley",
      title: "Commander, United States Special Operations Command",
      abbrev: "CDR, USSOCOM",
      level: 4,
      authorities: [
        { type: "acquisition", action: "SO-peculiar acquisition authority", threshold: "MFP-11 programs" },
        { type: "operations", action: "SOF force provider", threshold: "Global SOF" },
        { type: "budget", action: "USSOCOM budget execution", threshold: "~$13B+" },
      ]
    },
    {
      id: "cdr_usnorthcom",
      name: "GEN Gregory M. Guillot",
      title: "Commander, USNORTHCOM and NORAD",
      abbrev: "CDR, USNORTHCOM",
      level: 4,
      authorities: [
        { type: "operations", action: "Homeland defense operations", threshold: "North America" },
        { type: "operations", action: "Defense support to civil authorities", threshold: "DSCA execution" },
      ]
    },
    {
      id: "cdr_ussouthcom",
      name: "ADM Alvin Holsey",
      title: "Commander of United States Southern Command",
      abbrev: "CDR, USSOUTHCOM",
      level: 4,
      authorities: [
        { type: "operations", action: "Latin America/Caribbean operations", threshold: "AOR command" },
        { type: "operations", action: "Counter-narcotics operations", threshold: "JIATF-S" },
      ]
    },
    {
      id: "cdr_usstratcom",
      name: "ADM Richard Correll",
      title: "United States Strategic Command Commander",
      abbrev: "CDR, USSTRATCOM",
      level: 4,
      authorities: [
        { type: "operations", action: "Strategic deterrence operations", threshold: "Nuclear triad" },
        { type: "operations", action: "NC3 operations", threshold: "Command and control" },
      ]
    },
    {
      id: "cdr_ustranscom",
      name: "GEN Randall Reed",
      title: "Commander, United States Transportation Command",
      abbrev: "CDR, USTRANSCOM",
      level: 4,
      authorities: [
        { type: "operations", action: "Global mobility operations", threshold: "Strategic lift" },
        { type: "acquisition", action: "Mobility capability requirements", threshold: "TRANSCOM equities" },
      ]
    },
  ],

  // === JOINT CHIEFS ===
  jcs: [
    {
      id: "cjcs",
      name: "GEN Dan Caine",
      title: "Chairman of the Joint Chiefs of Staff",
      abbrev: "CJCS",
      level: 2,
      authorities: [
        { type: "operations", action: "Principal military advisor to POTUS, SECWAR, NSC", threshold: "Statutory" },
        { type: "policy", action: "Joint strategic planning direction", threshold: "Joint force" },
        { type: "personnel", action: "Joint officer management", threshold: "DOPMA/ROPMA" },
      ]
    },
    {
      id: "vcjcs",
      name: "GEN Christopher J. Mahoney",
      title: "Vice Chairman of the Joint Chiefs of Staff",
      abbrev: "VCJCS",
      level: 3,
      authorities: [
        { type: "acquisition", action: "JROC Chairman", threshold: "Requirements validation" },
        { type: "operations", action: "Acts for CJCS in absence", threshold: "Full authority" },
      ]
    },
  ],
}

// Colors for hierarchy levels
const LEVEL_COLORS: Record<number, string> = {
  1: '#ef4444', // Secretary - Red
  2: '#f97316', // Deputy - Orange
  3: '#eab308', // Under Secretaries - Yellow
  4: '#22c55e', // Assistant Secretaries - Green
  5: '#3b82f6', // Deputy Asst Secretaries - Blue
}

// Colors for authority types
const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  acquisition: { bg: '#8b5cf6', text: '#fff', label: 'Acquisition' },
  budget: { bg: '#10b981', text: '#fff', label: 'Budget' },
  personnel: { bg: '#f59e0b', text: '#000', label: 'Personnel' },
  operations: { bg: '#3b82f6', text: '#fff', label: 'Operations' },
  policy: { bg: '#ec4899', text: '#fff', label: 'Policy' },
}

// Category labels
const CATEGORY_LABELS: Record<OfficialCategory, string> = {
  secretary: 'Secretary',
  deputy: 'Deputy Secretary',
  usd: 'Under Secretaries',
  asd: 'Assistant Secretaries',
  dasd: 'Deputy Assistant Secretaries',
  principals: 'Principal Staff',
  agencies: 'Defense Agencies',
  cocoms: 'Combatant Commands',
  jcs: 'Joint Chiefs',
}

// Domain definitions for clustering
interface DomainDef {
  id: string
  name: string
  color: string
  keywords: string[]
}

const DOMAINS: DomainDef[] = [
  {
    id: 'technology',
    name: 'Technology & R&D',
    color: '#8b5cf6',
    keywords: ['technology', 'S&T', 'research', 'engineering', 'R&E', 'laboratories', 'lab', 'CTO', 'AI', 'artificial intelligence', 'digital', 'cyber', 'innovation', 'emerging', 'critical tech'],
  },
  {
    id: 'special_ops',
    name: 'Special Operations',
    color: '#ef4444',
    keywords: ['special operations', 'SOF', 'SO/LIC', 'irregular warfare', 'counterterrorism', 'CT', 'MFP-11', 'SO-peculiar'],
  },
  {
    id: 'nuclear',
    name: 'Nuclear & Strategic',
    color: '#f97316',
    keywords: ['nuclear', 'NC3', 'strategic', 'deterrence', 'WMD', 'CBRN', 'chemical', 'biological', 'radiological', 'missile defense', 'triad'],
  },
  {
    id: 'intelligence',
    name: 'Intelligence & Security',
    color: '#06b6d4',
    keywords: ['intelligence', 'security', 'clearance', 'counterintelligence', 'DIA', 'NGA', 'NSA', 'NRO', 'I&S'],
  },
  {
    id: 'personnel',
    name: 'Personnel & Readiness',
    color: '#22c55e',
    keywords: ['personnel', 'readiness', 'manpower', 'workforce', 'recruiting', 'health', 'TRICARE', 'medical', 'family', 'MWR', 'commissary', 'reserve', 'mobilization', 'end-strength'],
  },
  {
    id: 'acquisition',
    name: 'Acquisition & Sustainment',
    color: '#eab308',
    keywords: ['acquisition', 'MDAP', 'ACAT', 'milestone', 'contract', 'procurement', 'logistics', 'sustainment', 'industrial base', 'supply chain', 'FMS'],
  },
  {
    id: 'regional',
    name: 'Regional & Allies',
    color: '#ec4899',
    keywords: ['Indo-Pacific', 'European', 'NATO', 'Middle East', 'Africa', 'CENTCOM', 'EUCOM', 'AFRICOM', 'INDOPACOM', 'SOUTHCOM', 'NORTHCOM', 'alliance', 'partner', 'security cooperation', 'China', 'Taiwan', 'Russia', 'Ukraine'],
  },
  {
    id: 'space',
    name: 'Space & Missile Defense',
    color: '#3b82f6',
    keywords: ['space', 'missile defense', 'MDA', 'SDA', 'SPACECOM', 'satellite', 'proliferated'],
  },
  {
    id: 'cyber',
    name: 'Cyber Operations',
    color: '#14b8a6',
    keywords: ['cyber', 'CYBERCOM', 'DODIN', 'network', 'information'],
  },
  {
    id: 'homeland',
    name: 'Homeland Defense',
    color: '#a855f7',
    keywords: ['homeland', 'DSCA', 'civil authorities', 'border', 'NORTHCOM', 'NORAD', 'domestic'],
  },
]

export default function AuthoritiesVisualization() {
  const [view, setView] = useState<'hierarchy' | 'type' | 'domains' | 'matrix' | 'overlaps'>('hierarchy')
  const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [selectedOverlapPair, setSelectedOverlapPair] = useState<[string, string] | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.keys(OFFICIALS_DATA).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  )

  // Get all officials flattened
  const allOfficials = useMemo(() => {
    return (Object.entries(OFFICIALS_DATA) as [OfficialCategory, Official[]][]).flatMap(([category, officials]) =>
      officials.map(o => ({ ...o, category }))
    )
  }, [])

  // Filter officials by search
  const filteredOfficials = useMemo(() => {
    if (!searchTerm) return allOfficials
    const term = searchTerm.toLowerCase()
    return allOfficials.filter(o =>
      o.title.toLowerCase().includes(term) ||
      o.abbrev.toLowerCase().includes(term) ||
      o.name.toLowerCase().includes(term) ||
      o.authorities.some(a => a.action.toLowerCase().includes(term))
    )
  }, [allOfficials, searchTerm])

  // Get authorities by type for the "by type" view
  const getAuthoritiesByType = (type: string) => {
    return allOfficials.flatMap(official =>
      official.authorities
        .filter(a => a.type === type)
        .map(a => ({ ...a, official: official.title, abbrev: official.abbrev }))
    )
  }

  // Count officials by category
  const getCategoryCount = (category: OfficialCategory) => {
    if (!searchTerm) return OFFICIALS_DATA[category].length
    return filteredOfficials.filter(o => o.category === category).length
  }

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  // Get filtered authorities for selected official
  const filteredAuthorities = selectedOfficial
    ? filterType === 'all'
      ? selectedOfficial.authorities
      : selectedOfficial.authorities.filter(a => a.type === filterType)
    : []

  // Map officials to domains based on authority keywords
  const getOfficialDomains = (official: Official): string[] => {
    const domains: Set<string> = new Set()
    const allText = [
      official.title,
      official.abbrev,
      ...official.authorities.map(a => a.action),
    ].join(' ').toLowerCase()

    for (const domain of DOMAINS) {
      for (const keyword of domain.keywords) {
        if (allText.includes(keyword.toLowerCase())) {
          domains.add(domain.id)
          break
        }
      }
    }
    return Array.from(domains)
  }

  // Get officials grouped by domain with overlap info
  const domainData = useMemo(() => {
    const data: Record<string, { officials: (Official & { otherDomains: string[] })[], color: string, name: string }> = {}

    for (const domain of DOMAINS) {
      data[domain.id] = { officials: [], color: domain.color, name: domain.name }
    }

    for (const official of allOfficials) {
      const domains = getOfficialDomains(official)
      for (const domainId of domains) {
        const otherDomains = domains.filter(d => d !== domainId)
        data[domainId].officials.push({ ...official, otherDomains })
      }
    }

    return data
  }, [allOfficials])

  // Get overlap statistics
  const overlapStats = useMemo(() => {
    const officialDomainCounts: Record<string, number> = {}
    for (const official of allOfficials) {
      const domains = getOfficialDomains(official)
      officialDomainCounts[official.id] = domains.length
    }

    const multiDomainOfficials = allOfficials.filter(o => officialDomainCounts[o.id] > 1)
    return {
      totalMultiDomain: multiDomainOfficials.length,
      maxDomains: Math.max(...Object.values(officialDomainCounts)),
    }
  }, [allOfficials])

  // Matrix data: officials with their domain memberships
  const matrixData = useMemo(() => {
    return allOfficials
      .map(official => ({
        ...official,
        domains: getOfficialDomains(official),
      }))
      .filter(o => o.domains.length > 0)
      .sort((a, b) => b.domains.length - a.domains.length)
  }, [allOfficials])

  // Domain pair overlaps: which officials bridge two domains
  const domainPairOverlaps = useMemo(() => {
    const pairs: { domain1: DomainDef; domain2: DomainDef; officials: Official[]; key: string }[] = []

    for (let i = 0; i < DOMAINS.length; i++) {
      for (let j = i + 1; j < DOMAINS.length; j++) {
        const domain1 = DOMAINS[i]
        const domain2 = DOMAINS[j]
        const bridgingOfficials = allOfficials.filter(official => {
          const domains = getOfficialDomains(official)
          return domains.includes(domain1.id) && domains.includes(domain2.id)
        })

        if (bridgingOfficials.length > 0) {
          pairs.push({
            domain1,
            domain2,
            officials: bridgingOfficials,
            key: `${domain1.id}-${domain2.id}`,
          })
        }
      }
    }

    return pairs.sort((a, b) => b.officials.length - a.officials.length)
  }, [allOfficials])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#e2e8f0',
      fontFamily: '"IBM Plex Sans", -apple-system, sans-serif',
      padding: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          margin: 0,
          background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Department of War: Civilian Leadership Authorities
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          {allOfficials.length} officials with concrete decision-making powers from war.gov
        </p>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* View Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          padding: '4px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {([
            { id: 'hierarchy', label: 'Hierarchy' },
            { id: 'type', label: 'Authority Type' },
            { id: 'domains', label: 'Domain Clusters' },
            { id: 'matrix', label: 'Matrix' },
            { id: 'overlaps', label: 'Domain Bridges' },
          ] as const).map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                background: view === v.id ? 'rgba(99,102,241,0.8)' : 'transparent',
                color: view === v.id ? '#fff' : '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search officials or authorities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            color: '#e2e8f0',
            fontSize: '0.85rem',
            width: '280px',
          }}
        />
      </div>

      {view === 'hierarchy' ? (
        /* Hierarchy View */
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem' }}>
          {/* Officials List */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
          }}>
            {(Object.entries(OFFICIALS_DATA) as [OfficialCategory, Official[]][]).map(([category, officials]) => {
              const count = getCategoryCount(category)
              if (searchTerm && count === 0) return null

              return (
                <div key={category}>
                  <div
                    onClick={() => toggleCategory(category)}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {CATEGORY_LABELS[category]}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      background: 'rgba(255,255,255,0.1)',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      {count} {expandedCategories[category] ? '▼' : '▶'}
                    </span>
                  </div>

                  {expandedCategories[category] && (
                    <div>
                      {(searchTerm ? filteredOfficials.filter(o => o.category === category) : officials).map(official => (
                        <div
                          key={official.id}
                          onClick={() => setSelectedOfficial(official)}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            background: selectedOfficial?.id === official.id ? 'rgba(99,102,241,0.2)' : 'transparent',
                            transition: 'background 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: LEVEL_COLORS[official.level],
                              flexShrink: 0,
                            }} />
                            <span style={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              color: LEVEL_COLORS[official.level],
                            }}>
                              {official.abbrev}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', marginLeft: '16px' }}>
                            {official.name}
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: '#64748b',
                            marginTop: '2px',
                            marginLeft: '16px',
                            display: 'flex',
                            gap: '4px',
                            flexWrap: 'wrap',
                          }}>
                            {official.authorities.length} authorities
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Authority Details */}
          <div>
            {selectedOfficial ? (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                {/* Official Header */}
                <div style={{
                  padding: '1.25rem',
                  background: `linear-gradient(135deg, ${LEVEL_COLORS[selectedOfficial.level]}20, transparent)`,
                  borderBottom: `2px solid ${LEVEL_COLORS[selectedOfficial.level]}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: LEVEL_COLORS[selectedOfficial.level],
                    }} />
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.1rem', color: LEVEL_COLORS[selectedOfficial.level] }}>
                        {selectedOfficial.abbrev}
                      </h2>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                        {selectedOfficial.title}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                        {selectedOfficial.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Authority Type Filter */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  flexWrap: 'wrap',
                }}>
                  <button
                    onClick={() => setFilterType('all')}
                    style={{
                      padding: '4px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      background: filterType === 'all' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                      color: '#e2e8f0',
                    }}
                  >
                    All ({selectedOfficial.authorities.length})
                  </button>
                  {Object.entries(TYPE_COLORS).map(([type, config]) => {
                    const count = selectedOfficial.authorities.filter(a => a.type === type).length
                    if (count === 0) return null
                    return (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        style={{
                          padding: '4px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          background: filterType === type ? config.bg : 'rgba(255,255,255,0.05)',
                          color: filterType === type ? config.text : '#e2e8f0',
                        }}
                      >
                        {config.label} ({count})
                      </button>
                    )
                  })}
                </div>

                {/* Authorities List */}
                <div style={{ padding: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {filteredAuthorities.map((auth, i) => (
                    <div key={i} style={{
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${TYPE_COLORS[auth.type].bg}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: TYPE_COLORS[auth.type].bg,
                            color: TYPE_COLORS[auth.type].text,
                            marginBottom: '0.5rem',
                          }}>
                            {TYPE_COLORS[auth.type].label}
                          </span>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>{auth.action}</p>
                        </div>
                        <div style={{
                          padding: '4px 10px',
                          background: 'rgba(251,191,36,0.15)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: '#fbbf24',
                          fontFamily: 'monospace',
                          whiteSpace: 'nowrap',
                          alignSelf: 'flex-start',
                        }}>
                          {auth.threshold}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(255,255,255,0.1)',
              }}>
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>←</div>
                  <p>Select an official to see their concrete authorities</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : view === 'type' ? (
        /* By Type View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {Object.entries(TYPE_COLORS).map(([type, config]) => {
            const authorities = getAuthoritiesByType(type)
            return (
              <div key={type} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '1rem',
                  background: `${config.bg}20`,
                  borderBottom: `2px solid ${config.bg}`,
                }}>
                  <h3 style={{ margin: 0, color: config.bg, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
                    {config.label} Authorities
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    {authorities.length} decision points across DoW
                  </p>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.75rem' }}>
                  {authorities.slice(0, 25).map((auth, i) => (
                    <div key={i} style={{
                      padding: '0.6rem',
                      marginBottom: '0.4rem',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${config.bg}`,
                    }}>
                      <div style={{ fontSize: '0.7rem', color: config.bg, fontWeight: 600 }}>
                        {auth.abbrev}
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>{auth.action}</div>
                      <div style={{ fontSize: '0.65rem', color: '#fbbf24', fontFamily: 'monospace', marginTop: '2px' }}>
                        {auth.threshold}
                      </div>
                    </div>
                  ))}
                  {authorities.length > 25 && (
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem', padding: '0.5rem' }}>
                      +{authorities.length - 25} more...
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : view === 'domains' ? (
        /* Domain Clusters View */
        <div>
          {/* Stats Banner */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '3rem',
            flexWrap: 'wrap',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#60a5fa' }}>{overlapStats.totalMultiDomain}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Officials with Multi-Domain Authority</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#a78bfa' }}>{DOMAINS.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Authority Domains</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f472b6' }}>{overlapStats.maxDomains}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Max Domains per Official</div>
            </div>
          </div>

          {/* Domain Clusters Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
            {DOMAINS.map(domain => {
              const domainInfo = domainData[domain.id]
              if (domainInfo.officials.length === 0) return null

              return (
                <div
                  key={domain.id}
                  style={{
                    background: selectedDomain === domain.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    border: `1px solid ${selectedDomain === domain.id ? domain.color : 'rgba(255,255,255,0.08)'}`,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSelectedDomain(selectedDomain === domain.id ? null : domain.id)}
                >
                  {/* Domain Header */}
                  <div style={{
                    padding: '1rem',
                    background: `${domain.color}20`,
                    borderBottom: `2px solid ${domain.color}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, color: domain.color, fontSize: '0.95rem', fontWeight: 600 }}>
                        {domain.name}
                      </h3>
                      <span style={{
                        background: domain.color,
                        color: '#fff',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        {domainInfo.officials.length} officials
                      </span>
                    </div>
                  </div>

                  {/* Officials in Domain */}
                  <div style={{ padding: '0.75rem', maxHeight: selectedDomain === domain.id ? '500px' : '200px', overflowY: 'auto', transition: 'max-height 0.3s' }}>
                    {domainInfo.officials.map((official, i) => (
                      <div
                        key={official.id + '-' + i}
                        style={{
                          padding: '0.6rem',
                          marginBottom: '0.5rem',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: '6px',
                          borderLeft: `3px solid ${LEVEL_COLORS[official.level]}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: LEVEL_COLORS[official.level] }}>
                              {official.abbrev}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                              {official.name}
                            </div>
                          </div>
                          {/* Overlap indicators */}
                          {official.otherDomains.length > 0 && (
                            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {official.otherDomains.map(otherId => {
                                const otherDomain = DOMAINS.find(d => d.id === otherId)
                                if (!otherDomain) return null
                                return (
                                  <span
                                    key={otherId}
                                    title={otherDomain.name}
                                    style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      background: otherDomain.color,
                                    }}
                                  />
                                )
                              })}
                            </div>
                          )}
                        </div>
                        {/* Show authorities when domain is selected */}
                        {selectedDomain === domain.id && (
                          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            {official.authorities.slice(0, 3).map((auth, ai) => (
                              <div key={ai} style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>
                                • {auth.action.length > 60 ? auth.action.substring(0, 60) + '...' : auth.action}
                              </div>
                            ))}
                            {official.authorities.length > 3 && (
                              <div style={{ fontSize: '0.65rem', color: '#475569' }}>
                                +{official.authorities.length - 3} more authorities
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Domain Legend */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem', fontWeight: 600 }}>
              Domain Colors (colored dots show cross-domain authority):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {DOMAINS.map(domain => (
                <div key={domain.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: domain.color,
                  }} />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{domain.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : view === 'matrix' ? (
        /* Matrix View */
        <div style={{ overflowX: 'auto' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '1rem',
            minWidth: '900px',
          }}>
            {/* Matrix Header */}
            <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
              <div style={{ width: '180px', flexShrink: 0 }} />
              {DOMAINS.map(domain => (
                <div
                  key={domain.id}
                  style={{
                    width: '80px',
                    flexShrink: 0,
                    textAlign: 'center',
                    padding: '0.5rem 0.25rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: domain.color,
                      fontWeight: 600,
                      transform: 'rotate(-45deg)',
                      transformOrigin: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {domain.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {matrixData.map((official, rowIndex) => (
                <div
                  key={official.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: rowIndex % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent',
                    borderRadius: '4px',
                  }}
                >
                  {/* Official name */}
                  <div
                    style={{
                      width: '180px',
                      flexShrink: 0,
                      padding: '0.4rem 0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: LEVEL_COLORS[official.level],
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: LEVEL_COLORS[official.level] }}>
                        {official.abbrev}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#64748b' }}>
                        {official.domains.length} domains
                      </div>
                    </div>
                  </div>

                  {/* Domain cells */}
                  {DOMAINS.map(domain => {
                    const isInDomain = official.domains.includes(domain.id)
                    return (
                      <div
                        key={domain.id}
                        style={{
                          width: '80px',
                          height: '32px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isInDomain && (
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              background: domain.color,
                              boxShadow: `0 0 8px ${domain.color}80`,
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Matrix Legend */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              <strong>Reading the Matrix:</strong> Each row is an official, each column is a domain.
              Colored squares show domain authority. Officials are sorted by number of domains (most to least).
            </div>
          </div>
        </div>
      ) : (
        /* Domain Bridges (Overlap Focus) View */
        <div>
          {/* Stats */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#60a5fa' }}>
              {domainPairOverlaps.length}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Domain pairs with bridging officials
            </div>
          </div>

          {/* Domain Pair Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
            {domainPairOverlaps.map(pair => {
              const isSelected = selectedOverlapPair?.[0] === pair.domain1.id && selectedOverlapPair?.[1] === pair.domain2.id

              return (
                <div
                  key={pair.key}
                  onClick={() => setSelectedOverlapPair(isSelected ? null : [pair.domain1.id, pair.domain2.id])}
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Pair Header */}
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: pair.domain1.color,
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        {pair.domain1.name}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '1.2rem' }}>↔</span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: pair.domain2.color,
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        {pair.domain2.name}
                      </span>
                    </div>
                    <span style={{
                      background: 'rgba(255,255,255,0.15)',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#fff',
                    }}>
                      {pair.officials.length} bridge{pair.officials.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Bridging Officials */}
                  <div style={{
                    padding: '0.75rem',
                    maxHeight: isSelected ? '400px' : '120px',
                    overflowY: 'auto',
                    transition: 'max-height 0.3s',
                  }}>
                    {pair.officials.map(official => (
                      <div
                        key={official.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          marginBottom: '0.4rem',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: '6px',
                          borderLeft: `3px solid ${LEVEL_COLORS[official.level]}`,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: LEVEL_COLORS[official.level] }}>
                            {official.abbrev}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {official.name}
                          </div>
                        </div>
                        {/* Show all domains this official spans */}
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {getOfficialDomains(official).map(domainId => {
                            const domain = DOMAINS.find(d => d.id === domainId)
                            if (!domain) return null
                            return (
                              <span
                                key={domainId}
                                title={domain.name}
                                style={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  background: domain.color,
                                  border: (domainId === pair.domain1.id || domainId === pair.domain2.id)
                                    ? '2px solid #fff'
                                    : 'none',
                                }}
                              />
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Overlap Legend */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              <strong>Domain Bridges:</strong> Shows which officials have authority spanning multiple domains.
              Use this to identify key coordination points. White-bordered dots indicate the bridged domains;
              other dots show additional domains that official spans.
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.5rem',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          <strong style={{ color: '#94a3b8' }}>Levels:</strong>
        </div>
        {[
          { level: 1, label: 'Secretary' },
          { level: 2, label: 'Deputy/CJCS' },
          { level: 3, label: 'Under Secretaries' },
          { level: 4, label: 'Asst Secretaries/Directors' },
          { level: 5, label: 'Deputy Asst Secretaries' },
        ].map(({ level, label }) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: LEVEL_COLORS[level],
            }} />
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Sources */}
      <div style={{
        marginTop: '1rem',
        textAlign: 'center',
        fontSize: '0.65rem',
        color: '#475569',
      }}>
        Source: war.gov/About/Biographies | Authorities from 10 U.S.C. §§ 113, 131-138 | DoD Directives 5100.01, 5111-5118 series |
        DoD Instructions 5000.02, 5000.85 | DFARS | 7000.14-R FMR
      </div>
    </div>
  )
}
