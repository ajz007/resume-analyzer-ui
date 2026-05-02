export const COPY = {
  analyzer: {
    title: 'AI Resume Analyzer',
    subtitle:
      'See how your resume performs against ATS checks, job requirements, and AI-assisted screening.',
    helper:
      'Rethink Resume identifies what the role is really asking for, where your resume is weak, and what to fix first.',
  },
  modeSelector: {
    ats: {
      title: 'ATS Readiness',
      description: 'Check readability, structure, formatting, and parsing risk.',
      outcome: "You'll get: ATS Readiness + fix priorities.",
      action: 'Use ATS Readiness',
    },
    jobMatch: {
      title: 'Job Match',
      description: 'Compare your resume to a specific job description and AI-assisted screening signals.',
      outcome: "You'll get: Job Match + proof gaps.",
      action: 'Use Job Match',
    },
    tip: 'Tip: ATS Readiness and Job Match measure different parts of the screening process.',
  },
  form: {
    uploadLabel: 'Upload your resume',
    uploadHelper: 'PDF or DOCX. Max {maxSize}.',
    ats: {
      header: 'Check ATS Readiness',
      description: "We'll check structure, formatting, and common parsing issues.",
      cta: 'Check ATS Readiness',
      switch: 'Switch to Job Match',
    },
    jobMatch: {
      header: 'Analyze Job Match',
      description:
        'Paste the job description to see requirement-by-requirement match, proof gaps, and what to fix first.',
      cta: 'Analyze Job Match',
      switch: 'Switch to ATS Readiness',
      jdLabel: 'Job description',
      jdPlaceholder: 'Paste the full job post here (responsibilities + requirements).',
      jdHelper: 'Minimum 300 characters for reliable scoring.',
      jdCounterShort: 'Add at least {remaining} more characters.',
      jdCounterOk: 'Looks good.',
    },
    analyzing: {
      title: 'Analyzing...',
      steps: {
        common: ['Reading your resume', 'Extracting skills and experience'],
        ats: 'Checking ATS readiness signals',
        jobMatch: 'Comparing role requirements and proof gaps',
      },
      footer: 'This usually takes under a minute.',
    },
    errors: {
      resumeMissing: 'Please upload your resume to continue.',
      jdMissing: 'Please paste a job description to continue.',
      jdTooShort: 'Job description is too short. Please paste at least 300 characters.',
    },
    detailsLabel: 'Show technical details',
  },
  results: {
    ats: {
      label: 'ATS Readiness',
      explanation:
        'Estimates ATS readiness based on structure, formatting, and keyword clarity.',
      emptyNote:
        'No major ATS readiness issues detected. Consider running Job Match for a specific role.',
    },
    jobMatch: {
      label: 'Job Match',
      explanation: 'Estimates how well your resume aligns with this job description.',
      missingNote:
        'Job description missing. Switch to ATS Readiness or paste a job description and re-run.',
    },
    scoreBreakdownLabel: 'Score',
  },
  errors: {
    retrying: "We're getting a lot of traffic. Retrying automatically...",
    noResume: 'No resume found for this session. Upload a resume to begin.',
    generic: 'Something went wrong while analyzing. Please try again.',
  },
} as const
