export const COPY = {
  analyzer: {
    title: 'AI Resume Analyzer',
    subtitle: 'Choose a goal to get the right score and recommendations.',
    helper:
      'ATS Check scores resume readability for ATS systems. Job Match scores alignment to a specific job description.',
  },
  modeSelector: {
    ats: {
      title: 'ATS Check',
      description: 'Check ATS readability, structure, and formatting.',
      outcome: "You’ll get: ATS Score + top fixes.",
      action: 'Use ATS Check',
    },
    jobMatch: {
      title: 'Job Match',
      description: 'Compare your resume to a specific job description.',
      outcome: "You’ll get: Match Score + gaps to fix.",
      action: 'Use Job Match',
    },
    tip: 'Tip: You can run both. The scores measure different things.',
  },
  form: {
    uploadLabel: 'Upload your resume',
    uploadHelper: 'PDF or DOCX. Max {maxSize}.',
    ats: {
      header: 'Run an ATS Check',
      description: 'We’ll check structure, formatting, and common ATS parsing issues.',
      cta: 'Run ATS Check',
      switch: 'Switch to Job Match',
    },
    jobMatch: {
      header: 'Analyze Job Match',
      description: 'Paste the job description to get an accurate match score and gap analysis.',
      cta: 'Analyze Job Match',
      switch: 'Switch to ATS Check',
      jdLabel: 'Job description',
      jdPlaceholder: 'Paste the full job post here (responsibilities + requirements).',
      jdHelper: 'Minimum 300 characters for reliable scoring.',
      jdCounterShort: 'Add at least {remaining} more characters.',
      jdCounterOk: 'Looks good.',
    },
    analyzing: {
      title: 'Analyzing…',
      steps: {
        common: ['Reading your resume', 'Extracting skills and experience'],
        ats: 'Checking ATS structure and parsing',
        jobMatch: 'Comparing to job requirements',
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
      label: 'ATS Score',
      explanation:
        'Estimates ATS friendliness based on structure, formatting, and keyword hygiene.',
      emptyNote:
        'No major ATS issues detected. Consider running Job Match for a specific role.',
    },
    jobMatch: {
      label: 'Match Score',
      explanation: 'Estimates how well your resume aligns with this job description.',
      missingNote:
        'Job description missing — switch to ATS Check or paste a job description and re-run.',
    },
    scoreBreakdownLabel: 'Score',
  },
  errors: {
    retrying: 'We’re getting a lot of traffic. Retrying automatically…',
    noResume: 'No resume found for this session. Upload a resume to begin.',
    generic: 'Something went wrong while analyzing. Please try again.',
  },
} as const
