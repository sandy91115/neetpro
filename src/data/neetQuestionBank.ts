import neet2020PyqRaw from './neet_2020_e1_pyq.json';
import neet2015To2025PyqRaw from './neet_2015_2025_pyq.json';
import neet2021PracticeRaw from './neet_2021_pattern_practice.json';
import { OFFICIAL_NEET_2026_SYLLABUS } from './officialNeet2026Syllabus';
import type {
  DailyTask,
  Difficulty,
  MistakeNotebookEntry,
  Question,
  QuestionOption,
  ScheduledSeriesTest,
  SubjectId,
  TestAttemptResult,
} from '../types/neet';

// Map between the 32 chapter slugs in INITIAL_NEET_SYLLABUS and the 50 official unit codes
export const CHAPTER_TO_OFFICIAL_UNITS: Record<string, string[]> = {
  'phy-units-measurements': ['physics-unit-01', 'physics-unit-01-physics', 'physics-unit-20', 'physics-unit-20-physics'],
  'phy-kinematics': ['physics-unit-02', 'physics-unit-02-physics'],
  'phy-laws-of-motion': ['physics-unit-03', 'physics-unit-03-physics'],
  'phy-work-energy-power': ['physics-unit-04', 'physics-unit-04-physics'],
  'phy-rotational-motion': ['physics-unit-05', 'physics-unit-05-physics'],
  'phy-gravitation': ['physics-unit-06', 'physics-unit-06-physics', 'physics-unit-07', 'physics-unit-07-physics'],
  'phy-thermodynamics': ['physics-unit-08', 'physics-unit-08-physics', 'physics-unit-09', 'physics-unit-09-physics', 'physics-unit-10', 'physics-unit-10-physics'],
  'phy-electrostatics': ['physics-unit-11', 'physics-unit-11-physics'],
  'phy-current-electricity': ['physics-unit-12', 'physics-unit-12-physics'],
  'phy-magnetism-emi-ac': ['physics-unit-13', 'physics-unit-13-physics', 'physics-unit-14', 'physics-unit-14-physics', 'physics-unit-15', 'physics-unit-15-physics'],
  'phy-optics': ['physics-unit-16', 'physics-unit-16-physics'],
  'phy-modern-semiconductors': ['physics-unit-17', 'physics-unit-17-physics', 'physics-unit-18', 'physics-unit-18-physics', 'physics-unit-19', 'physics-unit-19-physics'],

  'chem-mole-atomic': ['chemistry-unit-01', 'chemistry-unit-01-chemistry', 'chemistry-unit-02', 'chemistry-unit-02-chemistry'],
  'chem-bonding-periodic': ['chemistry-unit-03', 'chemistry-unit-03-chemistry', 'chemistry-unit-09', 'chemistry-unit-09-chemistry'],
  'chem-thermo-equilibrium': ['chemistry-unit-04', 'chemistry-unit-04-chemistry', 'chemistry-unit-06', 'chemistry-unit-06-chemistry'],
  'chem-goc-hydrocarbons': ['chemistry-unit-13', 'chemistry-unit-13-chemistry', 'chemistry-unit-14', 'chemistry-unit-14-chemistry', 'chemistry-unit-15', 'chemistry-unit-15-chemistry'],
  'chem-solutions-electro-kinetics': ['chemistry-unit-05', 'chemistry-unit-05-chemistry', 'chemistry-unit-07', 'chemistry-unit-07-chemistry', 'chemistry-unit-08', 'chemistry-unit-08-chemistry'],
  'chem-dblock-coordination': ['chemistry-unit-10', 'chemistry-unit-10-chemistry', 'chemistry-unit-11', 'chemistry-unit-11-chemistry', 'chemistry-unit-12', 'chemistry-unit-12-chemistry'],
  'chem-organic-12': [
    'chemistry-unit-16',
    'chemistry-unit-16-chemistry',
    'chemistry-unit-17',
    'chemistry-unit-17-chemistry',
    'chemistry-unit-18',
    'chemistry-unit-18-chemistry',
    'chemistry-unit-19',
    'chemistry-unit-19-chemistry',
    'chemistry-unit-20',
    'chemistry-unit-20-chemistry',
  ],

  'bot-living-classification-plant-kingdom': ['biology-unit-01', 'biology-unit-01-botany'],
  'bot-morphology-anatomy': ['biology-unit-02', 'biology-unit-02-botany', 'biology-unit-06', 'biology-unit-06-botany'],
  'bot-cell-cycle': ['biology-unit-03', 'biology-unit-03-botany'],
  'bot-plant-physiology': ['biology-unit-04', 'biology-unit-04-botany'],
  'bot-genetics-molecular': ['biology-unit-07', 'biology-unit-07-botany', 'biology-unit-08', 'biology-unit-08-botany', 'biology-unit-09', 'biology-unit-09-botany'],
  'bot-ecology': ['biology-unit-10', 'biology-unit-10-botany'],

  'zoo-animal-kingdom': ['biology-unit-01', 'biology-unit-01-zoology', 'biology-unit-02', 'biology-unit-02-zoology'],
  'zoo-biomolecules': ['biology-unit-03', 'biology-unit-03-zoology'],
  'zoo-human-physiology-1': ['biology-unit-05', 'biology-unit-05-zoology'],
  'zoo-human-physiology-2': ['biology-unit-05', 'biology-unit-05-zoology'],
  'zoo-reproduction': ['biology-unit-06', 'biology-unit-06-zoology'],
  'zoo-evolution-health': ['biology-unit-07', 'biology-unit-07-zoology', 'biology-unit-08', 'biology-unit-08-zoology', 'biology-unit-10', 'biology-unit-10-zoology'],
  'zoo-biotechnology': ['biology-unit-09', 'biology-unit-09-zoology'],
};

const OFFICIAL_UNIT_TITLES: Record<string, string> = Object.fromEntries(
  OFFICIAL_NEET_2026_SYLLABUS.flatMap((subject) =>
    subject.units.flatMap((unit) => [
      [unit.id, unit.title],
      [`${unit.id}-${subject.id}`, unit.title],
      [`${unit.id}-botany`, unit.title],
      [`${unit.id}-zoology`, unit.title],
    ])
  )
);

function expandChapterIds(chapterIds: string[]): Set<string> {
  const expanded = new Set<string>();
  for (const id of chapterIds) {
    expanded.add(id);
    // If id is a syllabus chapter like 'phy-rotational-motion', add its official units
    if (CHAPTER_TO_OFFICIAL_UNITS[id]) {
      CHAPTER_TO_OFFICIAL_UNITS[id].forEach((u) => expanded.add(u));
    }
    // If id is an official unit like 'physics-unit-01' or 'physics-unit-01-physics', add matching syllabus chapters
    const normalizedUnit = id.replace(/-(physics|chemistry|botany|zoology)$/, '');
    expanded.add(normalizedUnit);
    expanded.add(`${normalizedUnit}-physics`);
    expanded.add(`${normalizedUnit}-chemistry`);
    expanded.add(`${normalizedUnit}-botany`);
    expanded.add(`${normalizedUnit}-zoology`);
    for (const [chSlug, unitList] of Object.entries(CHAPTER_TO_OFFICIAL_UNITS)) {
      if (unitList.includes(id) || unitList.includes(normalizedUnit)) {
        expanded.add(chSlug);
      }
    }
  }
  return expanded;
}

export const CORE_CURATED_QUESTIONS: Question[] = [
  // ================= PHYSICS QUESTIONS =================
  {
    id: 'q-phy-1',
    subjectId: 'physics',
    chapterId: 'phy-units-measurements',
    chapterName: 'Units and Measurements',
    topicName: 'Errors in Measurement',
    difficulty: 'easy',
    questionType: 'single_correct',
    stem: 'In a physical quantity P = (a³ b²) / (√c · d), the percentage errors in measurements of a, b, c and d are 1%, 3%, 4% and 2% respectively. What is the maximum percentage error in P?',
    options: [
      { id: 'A', text: '10%' },
      { id: 'B', text: '13%' },
      { id: 'C', text: '14%' },
      { id: 'D', text: '11%' },
    ],
    correctOption: 'B',
    explanation:
      'ΔP/P × 100 = 3(Δa/a) + 2(Δb/b) + (1/2)(Δc/c) + 1(Δd/d) = 3(1%) + 2(3%) + 0.5(4%) + 2% = 3 + 6 + 2 + 2 = 13%.',
    ncertReference: 'NCERT Class 11 Physics Part 1, Ch 1, Section 1.6',
    isPyq: true,
    pyqYear: 2023,
    sourceLabel: 'NEET 2023 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet F1',
    sourceQuestionNumber: '12',
    reviewStatus: 'approved',
    bookmarked: true,
  },
  {
    id: 'q-phy-2',
    subjectId: 'physics',
    chapterId: 'phy-rotational-motion',
    chapterName: 'System of Particles & Rotational Motion',
    topicName: 'Moment of Inertia & Rolling Motion',
    difficulty: 'hard',
    questionType: 'single_correct',
    stem: 'A solid sphere and a hollow cylinder of the same mass and same radius roll down an inclined plane without slipping from the same height. The ratio of their linear accelerations down the incline (a_sphere : a_hollow_cylinder) is:',
    options: [
      { id: 'A', text: '10 : 7' },
      { id: 'B', text: '7 : 10' },
      { id: 'C', text: '5 : 7' },
      { id: 'D', text: '14 : 15' },
    ],
    correctOption: 'A',
    explanation:
      'For rolling without slipping, a = g sinθ / (1 + I / mR²). For solid sphere, I/mR² = 2/5, so a_sphere = (5/7) g sinθ. For hollow cylinder, I/mR² = 1, so a_cyl = (1/2) g sinθ. Ratio a_sphere / a_cyl = (5/7) / (1/2) = 10 : 7.',
    ncertReference: 'NCERT Class 11 Physics Part 1, Ch 6, Rolling Motion',
    isPyq: true,
    pyqYear: 2024,
    sourceLabel: 'NEET 2024 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q1',
    sourceQuestionNumber: '19',
    reviewStatus: 'approved',
    bookmarked: true,
  },
  {
    id: 'q-phy-3',
    subjectId: 'physics',
    chapterId: 'phy-laws-of-motion',
    chapterName: 'Laws of Motion & Friction',
    topicName: 'Conservation of Linear Momentum',
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'A bullet of mass 20 g moving horizontally with a velocity of 400 m/s gets embedded in a wooden block of mass 1.98 kg suspended by a light vertical string. The vertical height through which the block rises is (take g = 10 m/s²):',
    options: [
      { id: 'A', text: '0.4 m' },
      { id: 'B', text: '0.8 m' },
      { id: 'C', text: '1.2 m' },
      { id: 'D', text: '1.6 m' },
    ],
    correctOption: 'B',
    explanation:
      'By conservation of linear momentum: m u = (m + M) V => 0.02 × 400 = (0.02 + 1.98) V => 8 = 2 V => V = 4 m/s. Height risen h = V² / (2g) = 16 / (2 × 10) = 0.8 m.',
    ncertReference: 'NCERT Class 11 Physics Part 1, Ch 5, Section 5.6',
    isPyq: true,
    pyqYear: 2022,
    sourceLabel: 'NEET 2022 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q2',
    sourceQuestionNumber: '24',
    reviewStatus: 'approved',
  },
  {
    id: 'q-phy-4',
    subjectId: 'physics',
    chapterId: 'phy-thermodynamics',
    chapterName: 'Thermodynamics & Kinetic Theory',
    topicName: 'Thermodynamic Processes',
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'An ideal diatomic gas (γ = 7/5) undergoes an isobaric expansion in which 350 J of heat is supplied to the gas. The work done by the gas during this expansion is:',
    options: [
      { id: 'A', text: '100 J' },
      { id: 'B', text: '140 J' },
      { id: 'C', text: '250 J' },
      { id: 'D', text: '210 J' },
    ],
    correctOption: 'A',
    explanation:
      'In an isobaric process, W / Q = nRΔT / nCpΔT = R / Cp = 1 - 1/γ. For diatomic gas γ = 7/5, so W / Q = 1 - 5/7 = 2/7. Thus W = (2/7) × 350 J = 100 J.',
    ncertReference: 'NCERT Class 11 Physics Part 2, Ch 11, Section 11.8',
    isPyq: true,
    pyqYear: 2024,
    sourceLabel: 'NEET 2024 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q1',
    sourceQuestionNumber: '28',
    reviewStatus: 'approved',
  },
  {
    id: 'q-phy-5',
    subjectId: 'physics',
    chapterId: 'phy-electrostatics',
    chapterName: 'Electrostatics & Capacitance',
    topicName: 'Parallel Plate Capacitor & Dielectrics',
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'A parallel plate air capacitor of capacitance C is charged to a potential V by a battery. The battery is then disconnected and a dielectric slab of dielectric constant K = 4 is completely filled between the plates. The new electrostatic energy stored in the capacitor becomes:',
    options: [
      { id: 'A', text: '4 × (½ CV²)' },
      { id: 'B', text: '(1/4) × (½ CV²)' },
      { id: 'C', text: '½ CV² (remains unchanged)' },
      { id: 'D', text: '(1/16) × (½ CV²)' },
    ],
    correctOption: 'B',
    explanation:
      "Since battery is disconnected, charge Q = CV remains constant. New capacitance C' = KC = 4C. New energy U' = Q² / (2C') = (Q² / 2C) × (1/K) = (1/4) × (½ CV²).",
    ncertReference: 'NCERT Class 12 Physics Part 1, Ch 2, Section 2.14',
    isPyq: true,
    pyqYear: 2023,
    sourceLabel: 'NEET 2023 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet F1',
    sourceQuestionNumber: '31',
    reviewStatus: 'approved',
  },
  {
    id: 'q-phy-6',
    subjectId: 'physics',
    chapterId: 'phy-current-electricity',
    chapterName: 'Current Electricity',
    topicName: 'Wheatstone Bridge & Meter Bridge',
    difficulty: 'easy',
    questionType: 'single_correct',
    stem: 'In a meter bridge experiment, the null point is obtained at 40 cm from the left end when resistance R is in the left gap and S = 12 Ω is in the right gap. The value of unknown resistance R is:',
    options: [
      { id: 'A', text: '6 Ω' },
      { id: 'B', text: '8 Ω' },
      { id: 'C', text: '9 Ω' },
      { id: 'D', text: '18 Ω' },
    ],
    correctOption: 'B',
    explanation:
      'For a balanced meter bridge: R / S = l / (100 - l) => R / 12 = 40 / 60 = 2/3 => R = 8 Ω.',
    ncertReference: 'NCERT Class 12 Physics Part 1, Ch 3, Section 3.14',
    isPyq: true,
    pyqYear: 2021,
    sourceLabel: 'NEET 2021 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet M2',
    sourceQuestionNumber: '36',
    reviewStatus: 'approved',
  },
  {
    id: 'q-phy-7',
    subjectId: 'physics',
    chapterId: 'phy-magnetism-emi-ac',
    chapterName: 'Moving Charges, Magnetism, EMI & AC',
    topicName: 'LCR Series Circuit & Resonance',
    difficulty: 'hard',
    questionType: 'single_correct',
    stem: 'In a series LCR circuit with R = 40 Ω, XL = 100 Ω and XC = 70 Ω connected across a 200 V (rms) AC source, the average power dissipated and power factor of the circuit are respectively:',
    options: [
      { id: 'A', text: '640 W and 0.8' },
      { id: 'B', text: '800 W and 0.6' },
      { id: 'C', text: '640 W and 0.6' },
      { id: 'D', text: '1000 W and 0.8' },
    ],
    correctOption: 'A',
    explanation:
      'Impedance Z = √[R² + (XL - XC)²] = √[40² + (100 - 70)²] = √(1600 + 900) = 50 Ω. Power factor cosφ = R / Z = 40 / 50 = 0.8. I_rms = V_rms / Z = 200 / 50 = 4 A. Average power P = I_rms² R = 16 × 40 = 640 W.',
    ncertReference: 'NCERT Class 12 Physics Part 1, Ch 7, Section 7.6',
    isPyq: true,
    pyqYear: 2024,
    sourceLabel: 'NEET 2024 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q1',
    sourceQuestionNumber: '41',
    reviewStatus: 'approved',
  },
  {
    id: 'q-phy-8',
    subjectId: 'physics',
    chapterId: 'phy-modern-semiconductors',
    chapterName: 'Modern Physics & Semiconductor Electronics',
    topicName: 'Photoelectric Effect & de Broglie Waves',
    difficulty: 'easy',
    questionType: 'single_correct',
    stem: 'An electron and a proton are accelerated through the same potential difference V. The ratio of their de Broglie wavelengths (λ_e : λ_p) is:',
    options: [
      { id: 'A', text: 'm_p / m_e' },
      { id: 'B', text: '√(m_p / m_e)' },
      { id: 'C', text: '√(m_e / m_p)' },
      { id: 'D', text: '1 : 1' },
    ],
    correctOption: 'B',
    explanation:
      'de Broglie wavelength λ = h / √(2mqV). Since both have same magnitude of charge q and accelerating voltage V, λ ∝ 1 / √m. Therefore λ_e / λ_p = √(m_p / m_e).',
    ncertReference: 'NCERT Class 12 Physics Part 2, Ch 11, Section 11.7',
    isPyq: true,
    pyqYear: 2022,
    sourceLabel: 'NEET 2022 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q2',
    sourceQuestionNumber: '44',
    reviewStatus: 'approved',
  },

  // ================= CHEMISTRY QUESTIONS =================
  {
    id: 'q-chem-1',
    subjectId: 'chemistry',
    chapterId: 'chem-bonding-periodic',
    chapterName: 'Periodic Table & Chemical Bonding',
    topicName: 'Molecular Orbital Theory (MOT)',
    difficulty: 'easy',
    questionType: 'single_correct',
    stem: 'According to Molecular Orbital Theory, which of the following species has the highest bond order and is diamagnetic in nature?',
    options: [
      { id: 'A', text: 'O₂⁺' },
      { id: 'B', text: 'N₂⁺' },
      { id: 'C', text: 'CN⁻' },
      { id: 'D', text: 'O₂⁻' },
    ],
    correctOption: 'C',
    explanation:
      'CN⁻ has 6 + 7 + 1 = 14 electrons (isoelectronic with N₂). Its bond order is 3.0 and all electrons are paired, making it diamagnetic. O₂⁺ (B.O. 2.5), N₂⁺ (B.O. 2.5), and O₂⁻ (B.O. 1.5) are all paramagnetic.',
    ncertReference: 'NCERT Class 11 Chemistry Part 1, Ch 4, Section 4.7',
    isPyq: true,
    pyqYear: 2024,
    sourceLabel: 'NEET 2024 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q1',
    sourceQuestionNumber: '52',
    reviewStatus: 'approved',
  },
  {
    id: 'q-chem-2',
    subjectId: 'chemistry',
    chapterId: 'chem-thermo-equilibrium',
    chapterName: 'Chemical Thermodynamics & Equilibrium',
    topicName: 'Ionic Equilibrium: Solubility Product (Ksp)',
    difficulty: 'hard',
    questionType: 'single_correct',
    stem: 'The solubility product (Ksp) of CaF₂ in pure water at 298 K is 3.2 × 10⁻¹¹. What will be its molar solubility in a 0.1 M NaF solution?',
    options: [
      { id: 'A', text: '3.2 × 10⁻⁹ M' },
      { id: 'B', text: '3.2 × 10⁻¹⁰ M' },
      { id: 'C', text: '1.6 × 10⁻⁹ M' },
      { id: 'D', text: '2.0 × 10⁻⁴ M' },
    ],
    correctOption: 'A',
    explanation:
      'CaF₂(s) ⇌ Ca²⁺ + 2F⁻. In 0.1 M NaF, [F⁻] ≈ 0.1 M due to common ion effect. Ksp = [Ca²⁺][F⁻]² => 3.2 × 10⁻¹¹ = s × (0.1)² = s × 10⁻² => s = 3.2 × 10⁻⁹ M.',
    ncertReference: 'NCERT Class 11 Chemistry Part 1, Ch 6, Section 6.13',
    isPyq: true,
    pyqYear: 2023,
    sourceLabel: 'NEET 2023 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet F1',
    sourceQuestionNumber: '61',
    reviewStatus: 'approved',
    bookmarked: true,
  },
  {
    id: 'q-chem-3',
    subjectId: 'chemistry',
    chapterId: 'chem-goc-hydrocarbons',
    chapterName: 'General Organic Chemistry (GOC) & Hydrocarbons',
    topicName: 'Carbocations & Hyperconjugation',
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'Arrange the following carbocations in order of decreasing stability: (I) (CH₃)₃C⁺  (II) C₆H₅CH₂⁺  (III) CH₃CH₂⁺  (IV) CH₂=CH⁺',
    options: [
      { id: 'A', text: 'I > II > III > IV' },
      { id: 'B', text: 'II > I > III > IV' },
      { id: 'C', text: 'I > III > II > IV' },
      { id: 'D', text: 'IV > III > II > I' },
    ],
    correctOption: 'B',
    explanation:
      'The benzyl carbocation is resonance-stabilized and is more stable than the tertiary butyl carbocation. The ethyl carbocation is less stable, and the vinyl carbocation is least stable because the positive charge is on an sp² carbon.',
    ncertReference: 'NCERT Class 11 Chemistry Part 2, Ch 8, Section 8.7',
    isPyq: true,
    pyqYear: 2023,
    sourceLabel: 'NEET 2023 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet F1',
    sourceQuestionNumber: '68',
    reviewStatus: 'approved',
  },
  {
    id: 'q-chem-4',
    subjectId: 'chemistry',
    chapterId: 'chem-solutions-electro-kinetics',
    chapterName: 'Solutions, Electrochemistry & Chemical Kinetics',
    topicName: 'First Order Kinetics',
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'For a first-order reaction, the time required for 99% completion is how many times the time required for 90% completion of the reaction?',
    options: [
      { id: 'A', text: '1.5 times' },
      { id: 'B', text: '2 times' },
      { id: 'C', text: '3 times' },
      { id: 'D', text: '4 times' },
    ],
    correctOption: 'B',
    explanation:
      'For a first-order reaction, t = (2.303/k) log([A]₀/[A]). t_99% = (2.303/k) log(100/1) = 2 × (2.303/k). t_90% = (2.303/k) log(100/10) = 1 × (2.303/k). Hence t_99% = 2 × t_90%.',
    ncertReference: 'NCERT Class 12 Chemistry Part 1, Ch 3, Section 3.3',
    isPyq: true,
    pyqYear: 2022,
    sourceLabel: 'NEET 2022 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q2',
    sourceQuestionNumber: '74',
    reviewStatus: 'approved',
  },
  {
    id: 'q-chem-5',
    subjectId: 'chemistry',
    chapterId: 'chem-dblock-coordination',
    chapterName: 'p-Block, d & f-Block & Coordination Compounds',
    topicName: 'Crystal Field Theory (CFT)',
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'The spin-only magnetic moment and hybridization of [CoF₆]³⁻ complex ion (Atomic no. of Co = 27) are respectively:',
    options: [
      { id: 'A', text: '0 BM and d²sp³' },
      { id: 'B', text: '4.90 BM and sp³d²' },
      { id: 'C', text: '3.87 BM and sp³d²' },
      { id: 'D', text: '4.90 BM and d²sp³' },
    ],
    correctOption: 'B',
    explanation:
      'In [CoF₆]³⁻, Co is in +3 oxidation state (3d⁶ configuration). Since F⁻ is a weak field ligand, pairing does not occur. There are n = 4 unpaired electrons in 3d orbitals. Outer 4d orbitals are used -> sp³d² hybridization. μ = √[4(4+2)] = √24 ≈ 4.90 BM.',
    ncertReference: 'NCERT Class 12 Chemistry Part 1, Ch 5, Section 5.5',
    isPyq: true,
    pyqYear: 2024,
    sourceLabel: 'NEET 2024 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q1',
    sourceQuestionNumber: '82',
    reviewStatus: 'approved',
  },
  {
    id: 'q-chem-6',
    subjectId: 'chemistry',
    chapterId: 'chem-organic-12',
    chapterName: 'Haloalkanes, Alcohols, Carbonyls, Amines & Biomolecules',
    topicName: 'Aldol & Cannizzaro Reactions',
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'Which aldehyde has no α-hydrogen and therefore undergoes the Cannizzaro reaction with concentrated NaOH?',
    options: [
      { id: 'A', text: 'Acetaldehyde (CH₃CHO)' },
      { id: 'B', text: '2,2-Dimethylpropanal ((CH₃)₃C-CHO)' },
      { id: 'C', text: 'Propanal (CH₃CH₂CHO)' },
      { id: 'D', text: '2-Methylpropanal ((CH₃)₂CHCHO)' },
    ],
    correctOption: 'B',
    explanation:
      '2,2-Dimethylpropanal has no hydrogen on the carbon next to the aldehyde group, so it undergoes the Cannizzaro reaction. The other listed aldehydes have α-hydrogens.',
    ncertReference: 'NCERT Class 12 Chemistry Part 2, Ch 8, Section 8.4',
    isPyq: true,
    pyqYear: 2023,
    sourceLabel: 'NEET 2023 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet F1',
    sourceQuestionNumber: '89',
    reviewStatus: 'approved',
  },

  // ================= BOTANY QUESTIONS =================
  {
    id: 'q-bot-1',
    subjectId: 'botany',
    chapterId: 'bot-living-classification-plant-kingdom',
    chapterName: 'Biological Classification & Plant Kingdom',
    topicName: 'Algae (Chlorophyceae, Phaeophyceae, Rhodophyceae)',
    difficulty: 'easy',
    questionType: 'single_correct',
    stem: 'Mannitol and Laminarin are the stored food materials in which of the following algae?',
    options: [
      { id: 'A', text: 'Chara and Volvox' },
      { id: 'B', text: 'Fucus and Sargassum' },
      { id: 'C', text: 'Porphyra and Polysiphonia' },
      { id: 'D', text: 'Gracilaria and Gelidium' },
    ],
    correctOption: 'B',
    explanation:
      'Mannitol and laminarin are complex carbohydrates stored as reserve food in Phaeophyceae (Brown algae), which include Ectocarpus, Dictyota, Laminaria, Sargassum, and Fucus.',
    ncertReference: 'NCERT Class 11 Biology, Ch 3, Page 32, Table 3.1',
    isPyq: true,
    pyqYear: 2024,
    sourceLabel: 'NEET 2024 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q1',
    sourceQuestionNumber: '104',
    reviewStatus: 'approved',
  },
  {
    id: 'q-bot-2',
    subjectId: 'botany',
    chapterId: 'bot-cell-cycle',
    chapterName: 'Cell: The Unit of Life, Cell Cycle & Division',
    topicName: 'Meiosis I (Prophase I Stages)',
    difficulty: 'easy',
    questionType: 'single_correct',
    stem: 'During which stage of Prophase I of Meiosis does crossing over occur between non-sister chromatids of homologous chromosomes, mediated by the enzyme recombinase?',
    options: [
      { id: 'A', text: 'Leptotene' },
      { id: 'B', text: 'Zygotene' },
      { id: 'C', text: 'Pachytene' },
      { id: 'D', text: 'Diplotene' },
    ],
    correctOption: 'C',
    explanation:
      'Pachytene is characterized by the appearance of recombination nodules, the sites at which crossing over occurs between non-sister chromatids of the homologous chromosomes via recombinase enzyme.',
    ncertReference: 'NCERT Class 11 Biology, Ch 10, Page 168',
    isPyq: true,
    pyqYear: 2023,
    sourceLabel: 'NEET 2023 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet F1',
    sourceQuestionNumber: '112',
    reviewStatus: 'approved',
  },
  {
    id: 'q-bot-3',
    subjectId: 'botany',
    chapterId: 'bot-plant-physiology',
    chapterName: 'Photosynthesis, Respiration & Plant Growth Regulators',
    topicName: 'C3 & C4 Pathways',
    difficulty: 'medium',
    questionType: 'statement_based',
    stem: 'Statement I: In C₄ plants, the primary CO₂ acceptor is a 3-carbon molecule phosphoenolpyruvate (PEP) and is present in the mesophyll cells.\nStatement II: Mesophyll cells of C₄ plants possess RuBisCO enzyme while bundle sheath cells lack RuBisCO.',
    options: [
      { id: 'A', text: 'Both Statement I and Statement II are correct' },
      { id: 'B', text: 'Both Statement I and Statement II are incorrect' },
      { id: 'C', text: 'Statement I is correct but Statement II is incorrect' },
      { id: 'D', text: 'Statement I is incorrect but Statement II is correct' },
    ],
    correctOption: 'C',
    explanation:
      'In C₄ plants (Hatch and Slack pathway), PEP (3C) is the primary CO₂ acceptor in mesophyll cells. Mesophyll cells LACK RuBisCO; instead, bundle sheath cells are rich in RuBisCO but lack PEPcase.',
    ncertReference: 'NCERT Class 11 Biology, Ch 11, Page 218',
    isPyq: true,
    pyqYear: 2024,
    sourceLabel: 'NEET 2024 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q1',
    sourceQuestionNumber: '118',
    reviewStatus: 'approved',
    bookmarked: true,
  },
  {
    id: 'q-bot-4',
    subjectId: 'botany',
    chapterId: 'bot-genetics-molecular',
    chapterName: 'Principles of Inheritance & Molecular Basis of Inheritance',
    topicName: 'Lac Operon & Transcription',
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'In the lac operon of E. coli, what do the structural genes z, y, and a code for respectively?',
    options: [
      { id: 'A', text: 'β-galactosidase, permease, and transacetylase' },
      { id: 'B', text: 'Permease, β-galactosidase, and transacetylase' },
      { id: 'C', text: 'β-galactosidase, transacetylase, and permease' },
      { id: 'D', text: 'Repressor protein, β-galactosidase, and permease' },
    ],
    correctOption: 'A',
    explanation:
      'In the lac operon: the z gene codes for β-galactosidase (hydrolyzes lactose into galactose + glucose), the y gene codes for permease (increases cell permeability to β-galactosides), and the a gene encodes a transacetylase.',
    ncertReference: 'NCERT Class 12 Biology, Ch 5, Page 116',
    isPyq: true,
    pyqYear: 2023,
    sourceLabel: 'NEET 2023 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet F1',
    sourceQuestionNumber: '127',
    reviewStatus: 'approved',
  },
  {
    id: 'q-bot-5',
    subjectId: 'botany',
    chapterId: 'bot-ecology',
    chapterName: 'Organisms & Populations, Ecosystem & Biodiversity',
    topicName: 'Ecological Pyramids & Energy Flow',
    difficulty: 'easy',
    questionType: 'single_correct',
    stem: 'Which of the following ecological pyramids is ALWAYS upright and can never be inverted in any natural ecosystem?',
    options: [
      { id: 'A', text: 'Pyramid of numbers in a tree ecosystem' },
      { id: 'B', text: 'Pyramid of biomass in an aquatic (sea) ecosystem' },
      { id: 'C', text: 'Pyramid of energy' },
      { id: 'D', text: 'Both pyramid of biomass and pyramid of numbers' },
    ],
    correctOption: 'C',
    explanation:
      'Pyramid of energy is always upright and can never be inverted, because when energy flows from a particular trophic level to the next trophic level, some energy is always lost as heat at each step (10% law).',
    ncertReference: 'NCERT Class 12 Biology, Ch 12, Page 249',
    isPyq: true,
    pyqYear: 2022,
    sourceLabel: 'NEET 2022 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q2',
    sourceQuestionNumber: '134',
    reviewStatus: 'approved',
  },

  // ================= ZOOLOGY QUESTIONS =================
  {
    id: 'q-zoo-1',
    subjectId: 'zoology',
    chapterId: 'zoo-human-physiology-1',
    chapterName: 'Breathing, Body Fluids & Excretory Products',
    topicName: 'Oxygen Dissociation Curve',
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'Which of the following conditions in the tissues favors the dissociation of oxygen from oxyhaemoglobin (right shift of the oxygen-haemoglobin dissociation curve)?',
    options: [
      { id: 'A', text: 'High pO₂, low pCO₂, lower H⁺ concentration and lower temperature' },
      { id: 'B', text: 'Low pO₂, high pCO₂, higher H⁺ concentration (low pH) and higher temperature' },
      { id: 'C', text: 'High pO₂, high pCO₂, lower H⁺ concentration and higher temperature' },
      { id: 'D', text: 'Low pO₂, low pCO₂, lower H⁺ concentration (high pH) and lower temperature' },
    ],
    correctOption: 'B',
    explanation:
      'In the tissues, where low pO₂, high pCO₂, high H⁺ concentration (acidic pH) and higher temperature exist, the conditions are favorable for dissociation of oxygen from oxyhaemoglobin (Bohr effect / right shift).',
    ncertReference: 'NCERT Class 11 Biology, Ch 14, Page 274',
    isPyq: true,
    pyqYear: 2024,
    sourceLabel: 'NEET 2024 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q1',
    sourceQuestionNumber: '154',
    reviewStatus: 'approved',
  },
  {
    id: 'q-zoo-2',
    subjectId: 'zoology',
    chapterId: 'zoo-human-physiology-2',
    chapterName: 'Locomotion, Neural Control & Chemical Coordination',
    topicName: 'Sliding Filament Theory & Sarcomere',
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'During muscular contraction in a skeletal muscle fibre, which of the following events does NOT occur?',
    options: [
      { id: 'A', text: 'Length of I-band gets reduced' },
      { id: 'B', text: 'Length of A-band remains unchanged' },
      { id: 'C', text: 'Z-lines attached to actin filaments are pulled inwards, shortening the sarcomere' },
      { id: 'D', text: 'Length of A-band gets significantly shortened' },
    ],
    correctOption: 'D',
    explanation:
      'According to the sliding filament theory, during muscle contraction, the thin (actin) filaments slide over the thick (myosin) filaments. The I-band and H-zone shorten, the sarcomere shortens, while the A-band retains its original length.',
    ncertReference: 'NCERT Class 11 Biology, Ch 17, Page 307',
    isPyq: true,
    pyqYear: 2023,
    sourceLabel: 'NEET 2023 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet F1',
    sourceQuestionNumber: '162',
    reviewStatus: 'approved',
  },
  {
    id: 'q-zoo-3',
    subjectId: 'zoology',
    chapterId: 'zoo-reproduction',
    chapterName: 'Human Reproduction & Reproductive Health',
    topicName: 'Menstrual Cycle & Hormones',
    difficulty: 'easy',
    questionType: 'single_correct',
    stem: 'Rapid secretion of which hormone during the mid-cycle (around the 14th day) induces rupture of the Graafian follicle and thereby the release of ovum (ovulation)?',
    options: [
      { id: 'A', text: 'Progesterone' },
      { id: 'B', text: 'Luteinizing Hormone (LH Surge)' },
      { id: 'C', text: 'Oxytocin' },
      { id: 'D', text: 'Relaxin' },
    ],
    correctOption: 'B',
    explanation:
      'Both LH and FSH attain a peak level in the middle of the cycle (about 14th day). Rapid secretion of LH leading to its maximum level during the mid-cycle called LH surge induces rupture of Graafian follicle and ovulation.',
    ncertReference: 'NCERT Class 12 Biology, Ch 2, Page 35',
    isPyq: true,
    pyqYear: 2022,
    sourceLabel: 'NEET 2022 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q2',
    sourceQuestionNumber: '168',
    reviewStatus: 'approved',
  },
  {
    id: 'q-zoo-4',
    subjectId: 'zoology',
    chapterId: 'zoo-biotechnology',
    chapterName: 'Biotechnology: Principles, Processes & Applications',
    topicName: 'Genetically Engineered Insulin & Gene Therapy',
    difficulty: 'easy',
    questionType: 'single_correct',
    stem: 'During the maturation of pro-insulin into functional mature insulin in humans, which peptide segment is removed and is NOT present in mature insulin?',
    options: [
      { id: 'A', text: 'A-peptide chain' },
      { id: 'B', text: 'B-peptide chain' },
      { id: 'C', text: 'C-peptide stretch' },
      { id: 'D', text: 'Disulphide bridges between A and B chains' },
    ],
    correctOption: 'C',
    explanation:
      'In mammals, insulin is synthesized as a pro-hormone containing an extra stretch called the C-peptide. This C-peptide is not present in the mature insulin and is removed during maturation into insulin (leaving A and B chains linked by disulphide bonds).',
    ncertReference: 'NCERT Class 12 Biology, Ch 10, Page 211',
    isPyq: true,
    pyqYear: 2024,
    sourceLabel: 'NEET 2024 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet Q1',
    sourceQuestionNumber: '174',
    reviewStatus: 'approved',
  },
  {
    id: 'q-zoo-5',
    subjectId: 'zoology',
    chapterId: 'zoo-evolution-health',
    chapterName: 'Evolution & Human Health and Disease',
    topicName: 'Hardy-Weinberg Principle',
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'In a population in Hardy-Weinberg equilibrium, the frequency of the recessive allele (q) for a certain autosomal trait is 0.4. What percentage of individuals in this population are heterozygous carriers (2pq)?',
    options: [
      { id: 'A', text: '16%' },
      { id: 'B', text: '36%' },
      { id: 'C', text: '48%' },
      { id: 'D', text: '24%' },
    ],
    correctOption: 'C',
    explanation:
      'Since p + q = 1 and q = 0.4, dominant allele frequency p = 1 - 0.4 = 0.6. Frequency of heterozygous carriers = 2pq = 2 × 0.6 × 0.4 = 0.48, which corresponds to 48% of the population.',
    ncertReference: 'NCERT Class 12 Biology, Ch 6, Page 137',
    isPyq: true,
    pyqYear: 2023,
    sourceLabel: 'NEET 2023 PYQ',
    sourceUrl: 'https://neet.nta.nic.in/archive/',
    sourcePage: 'Booklet F1',
    sourceQuestionNumber: '179',
    reviewStatus: 'approved',
  },

  // Pending AI Generated Questions for Admin Review Queue demonstration
  {
    id: 'q-ai-pending-1',
    subjectId: 'physics',
    chapterId: 'phy-optics',
    chapterName: 'Ray Optics & Wave Optics',
    topicName: "Young's Double Slit Experiment (YDSE)",
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'In a Young’s double-slit experiment using monochromatic light of wavelength λ, the intensity of light at a point on the screen where path difference is λ is K units. What is the intensity of light at a point where path difference is λ/3?',
    options: [
      { id: 'A', text: 'K / 4' },
      { id: 'B', text: 'K / 2' },
      { id: 'C', text: '3K / 4' },
      { id: 'D', text: 'K / 3' },
    ],
    correctOption: 'A',
    explanation:
      'Phase difference φ = (2π / λ) × Δx. For Δx = λ, φ = 2π => I_max = 4 I₀ = K. For Δx = λ/3, φ = 2π/3. Intensity I = I_max cos²(φ/2) = K cos²(π/3) = K × (1/2)² = K/4.',
    ncertReference: 'NCERT Class 12 Physics Part 2, Ch 10, Section 10.5',
    isPyq: false,
    sourceLabel: 'AI Generated (NEET 2027 Pattern)',
    reviewStatus: 'pending_review',
  },
  {
    id: 'q-ai-pending-2',
    subjectId: 'botany',
    chapterId: 'bot-plant-physiology',
    chapterName: 'Photosynthesis, Respiration & Plant Growth Regulators',
    topicName: 'Krebs Cycle (TCA) & ETS',
    difficulty: 'medium',
    questionType: 'single_correct',
    stem: 'In the mitochondrial Electron Transport System (ETS), Complex IV refers to which of the following, and which two copper centres does it contain?',
    options: [
      { id: 'A', text: 'Cytochrome bc₁ complex; contains Fe-S centres' },
      { id: 'B', text: 'Cytochrome c oxidase complex; contains cytochromes a and a₃, and two copper centres' },
      { id: 'C', text: 'NADH dehydrogenase; contains FMN and Fe-S' },
      { id: 'D', text: 'Succinate dehydrogenase; bound to inner mitochondrial membrane' },
    ],
    correctOption: 'B',
    explanation:
      'Complex IV refers to cytochrome c oxidase complex containing cytochromes a and a₃, and two copper centres. It transfers electrons to molecular oxygen (the ultimate H-acceptor).',
    ncertReference: 'NCERT Class 11 Biology, Ch 12, Page 233',
    isPyq: false,
    sourceLabel: 'AI Generated (NCERT Line-by-Line)',
    reviewStatus: 'pending_review',
  },
];

// Convert all 180 Official NEET 2020 Set E1 PYQs into Question objects
const BUNDLED_2020_PYQS: Question[] = (neet2020PyqRaw as Array<{
  question_number: string;
  pdf_page: string;
  subject_id: SubjectId;
  chapter_id: string;
  topic_name: string;
  difficulty: Difficulty;
  stem: string;
  options: QuestionOption[];
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}>).map((row) => ({
  id: `pyq-2020-e1-${row.question_number}`,
  subjectId: row.subject_id,
  chapterId: row.chapter_id,
  chapterName: OFFICIAL_UNIT_TITLES[row.chapter_id] || row.topic_name,
  topicName: row.topic_name,
  difficulty: row.difficulty,
  questionType: 'single_correct',
  stem: row.stem,
  options: row.options,
  correctOption: row.correct_option,
  explanation: row.explanation,
  ncertReference: `NCERT ${row.subject_id.toUpperCase()} · ${row.topic_name}`,
  isPyq: true,
  pyqYear: 2020,
  sourceLabel: 'NTA - NEET (UG) 2020 - English and Hindi Set E1',
  sourceUrl: 'https://neet.nta.nic.in/document/eng-hindi-set-e1-neet-qp-2020/',
  sourcePage: `PDF page ${row.pdf_page} - Booklet E1`,
  sourceQuestionNumber: String(row.question_number),
  reviewStatus: 'approved',
}));

// Convert all 28 NEET 2021-pattern practice questions into Question objects
const BUNDLED_2021_PRACTICE: Question[] = (neet2021PracticeRaw as Array<{
  subject_id: SubjectId;
  chapter_id: string;
  topic_name: string;
  difficulty: Difficulty;
  stem: string;
  options: QuestionOption[];
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  ncert_reference?: string;
}>).map((row, idx) => ({
  id: `prac-2021-${idx + 1}`,
  subjectId: row.subject_id,
  chapterId: row.chapter_id,
  chapterName: OFFICIAL_UNIT_TITLES[row.chapter_id] || row.topic_name,
  topicName: row.topic_name,
  difficulty: row.difficulty,
  questionType: 'single_correct',
  stem: row.stem,
  options: row.options,
  correctOption: row.correct_option,
  explanation: row.explanation,
  ncertReference: row.ncert_reference || `NCERT ${row.subject_id.toUpperCase()} · ${row.topic_name}`,
  isPyq: false,
  sourceLabel: 'NEET 2021-Pattern High-Yield Practice',
  sourceUrl: 'https://ncert.nic.in/exemplar-problems.php?ln=en',
  reviewStatus: 'approved',
}));

// Convert all 98 multi-year NEET PYQs (2015–2025 across all 60 chapters) into Question objects
const BUNDLED_2015_2025_PYQS: Question[] = (neet2015To2025PyqRaw as Array<{
  id: string;
  pyq_year: number;
  question_number: string | number;
  pdf_page: string | number;
  subject_id: SubjectId;
  chapter_id: string;
  topic_name: string;
  difficulty: Difficulty;
  stem: string;
  options: QuestionOption[];
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  ncert_reference?: string;
  source_label: string;
  source_url: string;
}>).map((row) => ({
  id: row.id,
  subjectId: row.subject_id,
  chapterId: row.chapter_id,
  chapterName: OFFICIAL_UNIT_TITLES[row.chapter_id] || row.topic_name,
  topicName: row.topic_name,
  difficulty: row.difficulty,
  questionType: 'single_correct',
  stem: row.stem,
  options: row.options,
  correctOption: row.correct_option,
  explanation: row.explanation,
  ncertReference: row.ncert_reference || `NCERT ${row.subject_id.toUpperCase()} · ${row.topic_name}`,
  isPyq: true,
  pyqYear: row.pyq_year,
  sourceLabel: row.source_label,
  sourceUrl: row.source_url,
  sourcePage: `PDF page ${row.pdf_page}`,
  sourceQuestionNumber: String(row.question_number),
  reviewStatus: 'approved',
}));

// Combined 332-question master bank (330 Approved including 300 PYQs across 2015–2025 + 2 Pending Review)
export const INITIAL_QUESTIONS: Question[] = [
  ...CORE_CURATED_QUESTIONS,
  ...BUNDLED_2020_PYQS,
  ...BUNDLED_2015_2025_PYQS,
  ...BUNDLED_2021_PRACTICE,
];

export function generateTestQuestionSet(options: {
  allQuestions: Question[];
  subjects: SubjectId[];
  questionsPerSubject: number;
  chapterIds?: string[];
  pyqOnly?: boolean;
  difficultyFilter?: 'all' | Difficulty;
}): Question[] {
  const {
    allQuestions,
    subjects,
    questionsPerSubject,
    chapterIds,
    pyqOnly = false,
    difficultyFilter = 'all',
  } = options;

  // Always merge with INITIAL_QUESTIONS so even if localStorage has an older partial bank, we never run out
  const combinedMap = new Map<string, Question>();
  allQuestions.forEach((q) => combinedMap.set(q.id, q));
  INITIAL_QUESTIONS.forEach((q) => {
    if (!combinedMap.has(q.id)) combinedMap.set(q.id, q);
  });

  const approvedPool = [...combinedMap.values()].filter((q) => q.reviewStatus === 'approved');
  const expandedChapterSet =
    chapterIds && chapterIds.length > 0 ? expandChapterIds(chapterIds) : null;

  const result: Question[] = [];

  subjects.forEach((subjectId) => {
    const subjectPool = approvedPool.filter((q) => q.subjectId === subjectId);
    const pickedIds = new Set<string>();
    const picked: Question[] = [];

    const addFromList = (list: Question[]) => {
      const shuffled = [...list].sort(() => Math.random() - 0.5);
      for (const q of shuffled) {
        if (picked.length >= questionsPerSubject) break;
        if (!pickedIds.has(q.id)) {
          pickedIds.add(q.id);
          picked.push(q);
        }
      }
    };

    // Tier 1: Exact match (Subject + Chapter/Unit + PYQ filter + Difficulty filter)
    const tier1 = subjectPool.filter((q) => {
      if (expandedChapterSet && !expandedChapterSet.has(q.chapterId)) return false;
      if (pyqOnly && !q.isPyq) return false;
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
      return true;
    });
    addFromList(tier1);

    // Tier 2: Same Subject + Chapter/Unit + PYQ filter (relax difficulty if needed)
    if (picked.length < questionsPerSubject && difficultyFilter !== 'all') {
      const tier2 = subjectPool.filter((q) => {
        if (expandedChapterSet && !expandedChapterSet.has(q.chapterId)) return false;
        if (pyqOnly && !q.isPyq) return false;
        return true;
      });
      addFromList(tier2);
    }

    // Tier 3: Same Subject + PYQ + Difficulty (relax chapter filter if single chapter had fewer than requested)
    if (picked.length < questionsPerSubject) {
      const tier3 = subjectPool.filter((q) => {
        if (pyqOnly && !q.isPyq) return false;
        if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
        return true;
      });
      addFromList(tier3);
    }

    // Tier 4: Any approved PYQ in the same subject
    if (picked.length < questionsPerSubject && pyqOnly) {
      addFromList(subjectPool.filter((q) => q.isPyq));
    }

    // Tier 5: Any approved question in the same subject (58 unique questions per subject available!)
    if (picked.length < questionsPerSubject) {
      addFromList(subjectPool);
    }

    result.push(...picked);
  });

  return result;
}

export const INITIAL_SERIES_TESTS: ScheduledSeriesTest[] = [
  {
    id: 'series-pyq-2020-full',
    code: 'NTA-2020-E1',
    title: 'Official NEET (UG) 2020 Set E1 — Complete 180-Q PYQ Paper (720 Marks)',
    seriesType: 'Major Full Test',
    syllabusSummary: 'Complete Official NEET 2020 Set E1 Paper (45 Physics + 45 Chemistry + 45 Botany + 45 Zoology)',
    questionCount: 180,
    maxMarks: 720,
    durationMinutes: 180,
    scheduledDate: 'Available Anytime',
    status: 'available',
    subjects: ['physics', 'chemistry', 'botany', 'zoology'],
  },
  {
    id: 'series-major-1',
    code: 'LDR-MAJ-01',
    title: 'ALLEN-Pattern Full Syllabus Mock #01 (Target NEET 2027 — 180 Qs / 720 Marks)',
    seriesType: 'Major Full Test',
    syllabusSummary: 'Complete NEET UG Syllabus (45 Physics + 45 Chemistry + 45 Botany + 45 Zoology)',
    questionCount: 180,
    maxMarks: 720,
    durationMinutes: 200,
    scheduledDate: 'Available Anytime',
    status: 'available',
    subjects: ['physics', 'chemistry', 'botany', 'zoology'],
  },
  {
    id: 'series-minor-1',
    code: 'LDR-MIN-01',
    title: 'Leader Minor Test #01 — Mechanics I, Mole & Atomic, Cell & Animal Kingdom',
    seriesType: 'Minor Test',
    syllabusSummary: 'Units, Kinematics, NLM | Mole, Atomic Structure | Cell Cycle | Animal Kingdom',
    questionCount: 20,
    maxMarks: 80,
    durationMinutes: 25,
    scheduledDate: 'Completed · Retake Anytime',
    status: 'completed',
    lastScore: 68,
    subjects: ['physics', 'chemistry', 'botany', 'zoology'],
  },
  {
    id: 'series-minor-2',
    code: 'LDR-MIN-02',
    title: 'Leader Minor Test #02 — Rotational, Thermodynamics, Equilibrium & Plant Physio',
    seriesType: 'Minor Test',
    syllabusSummary: 'Rotational Motion, Thermo | Chemical & Ionic Eqm | Photosynthesis & Respiration | Human Physio I',
    questionCount: 20,
    maxMarks: 80,
    durationMinutes: 25,
    scheduledDate: 'Completed · Retake Anytime',
    status: 'completed',
    lastScore: 64,
    subjects: ['physics', 'chemistry', 'botany', 'zoology'],
  },
  {
    id: 'series-semi-1',
    code: 'LDR-SMJ-01',
    title: 'Leader Semi-Major Test #01 — High-Yield Class 11th + 12th Revision Mock (40 Qs)',
    seriesType: 'Semi-Major Test',
    syllabusSummary: 'Balanced 4-Subject Revision Mock (10 Physics + 10 Chemistry + 10 Botany + 10 Zoology)',
    questionCount: 40,
    maxMarks: 160,
    durationMinutes: 50,
    scheduledDate: 'Available Anytime',
    status: 'available',
    subjects: ['physics', 'chemistry', 'botany', 'zoology'],
  },
  {
    id: 'series-semi-2',
    code: 'LDR-SMJ-02',
    title: 'Leader Semi-Major Test #02 — Electrodynamics, Organic Chemistry, Genetics & Biotech (60 Qs)',
    seriesType: 'Semi-Major Test',
    syllabusSummary: '15 Physics + 15 Chemistry + 15 Botany + 15 Zoology High-Weightage Units',
    questionCount: 60,
    maxMarks: 240,
    durationMinutes: 75,
    scheduledDate: 'Available Anytime',
    status: 'available',
    subjects: ['physics', 'chemistry', 'botany', 'zoology'],
  },
  {
    id: 'series-aiot-1',
    code: 'AIOT-2027-01',
    title: 'All India Open Test (AIOT) — High-Yield NCERT + PYQ Benchmark (180 Qs)',
    seriesType: 'AIOT (All India Open Test)',
    syllabusSummary: 'Full NEET 2027 High-Weightage Syllabus with Rank Predictor (180 Questions · 720 Marks)',
    questionCount: 180,
    maxMarks: 720,
    durationMinutes: 200,
    scheduledDate: 'Available Anytime',
    status: 'available',
    subjects: ['physics', 'chemistry', 'botany', 'zoology'],
  },
];

export const INITIAL_PAST_ATTEMPTS: TestAttemptResult[] = [
  {
    id: 'att-hist-1',
    testId: 'series-minor-1',
    testTitle: 'Full Syllabus Revision Mock #01 (NEET 720 Pattern)',
    category: 'full_syllabus',
    attemptedAt: '28 Oct 2026',
    durationMinutes: 200,
    timeTakenSeconds: 10920,
    totalQuestions: 180,
    correctCount: 158,
    incorrectCount: 14,
    unattemptedCount: 8,
    totalScore: 618,
    maxScore: 720,
    accuracyPercent: 91.9,
    predictedAir: 4850,
    percentile: 99.62,
    subjectBreakdowns: [
      {
        subjectId: 'physics',
        subjectName: 'Physics',
        totalQuestions: 45,
        correct: 37,
        incorrect: 5,
        unattempted: 3,
        score: 143,
        maxScore: 180,
        accuracy: 88.1,
        timeSpentSeconds: 3900,
      },
      {
        subjectId: 'chemistry',
        subjectName: 'Chemistry',
        totalQuestions: 45,
        correct: 39,
        incorrect: 4,
        unattempted: 2,
        score: 152,
        maxScore: 180,
        accuracy: 90.7,
        timeSpentSeconds: 2950,
      },
      {
        subjectId: 'botany',
        subjectName: 'Botany',
        totalQuestions: 45,
        correct: 41,
        incorrect: 3,
        unattempted: 1,
        score: 161,
        maxScore: 180,
        accuracy: 93.2,
        timeSpentSeconds: 2050,
      },
      {
        subjectId: 'zoology',
        subjectName: 'Zoology',
        totalQuestions: 45,
        correct: 41,
        incorrect: 2,
        unattempted: 2,
        score: 162,
        maxScore: 180,
        accuracy: 95.3,
        timeSpentSeconds: 2020,
      },
    ],
    responses: {
      'q-phy-2': {
        questionId: 'q-phy-2',
        selectedOption: 'C',
        status: 'answered',
        timeSpentSeconds: 95,
      },
      'q-chem-2': {
        questionId: 'q-chem-2',
        selectedOption: 'B',
        status: 'answered',
        timeSpentSeconds: 80,
      },
      'q-bot-3': {
        questionId: 'q-bot-3',
        selectedOption: 'A',
        status: 'answered',
        timeSpentSeconds: 45,
      },
    },
    questions: CORE_CURATED_QUESTIONS.filter((q) => q.reviewStatus === 'approved'),
  },
  {
    id: 'att-hist-2',
    testId: 'series-minor-2',
    testTitle: 'Full Syllabus Revision Mock #02 (NEET 720 Pattern)',
    category: 'full_syllabus',
    attemptedAt: '01 Nov 2026',
    durationMinutes: 200,
    timeTakenSeconds: 10680,
    totalQuestions: 180,
    correctCount: 164,
    incorrectCount: 11,
    unattemptedCount: 5,
    totalScore: 645,
    maxScore: 720,
    accuracyPercent: 93.7,
    predictedAir: 2190,
    percentile: 99.84,
    subjectBreakdowns: [
      {
        subjectId: 'physics',
        subjectName: 'Physics',
        totalQuestions: 45,
        correct: 39,
        incorrect: 4,
        unattempted: 2,
        score: 152,
        maxScore: 180,
        accuracy: 90.7,
        timeSpentSeconds: 3780,
      },
      {
        subjectId: 'chemistry',
        subjectName: 'Chemistry',
        totalQuestions: 45,
        correct: 40,
        incorrect: 4,
        unattempted: 1,
        score: 156,
        maxScore: 180,
        accuracy: 90.9,
        timeSpentSeconds: 2880,
      },
      {
        subjectId: 'botany',
        subjectName: 'Botany',
        totalQuestions: 45,
        correct: 42,
        incorrect: 2,
        unattempted: 1,
        score: 166,
        maxScore: 180,
        accuracy: 95.5,
        timeSpentSeconds: 2010,
      },
      {
        subjectId: 'zoology',
        subjectName: 'Zoology',
        totalQuestions: 45,
        correct: 43,
        incorrect: 1,
        unattempted: 1,
        score: 171,
        maxScore: 180,
        accuracy: 97.7,
        timeSpentSeconds: 2010,
      },
    ],
    responses: {
      'q-phy-1': {
        questionId: 'q-phy-1',
        selectedOption: 'B',
        status: 'answered',
        timeSpentSeconds: 50,
      },
      'q-phy-2': {
        questionId: 'q-phy-2',
        selectedOption: 'C',
        status: 'answered',
        timeSpentSeconds: 110,
      },
      'q-chem-2': {
        questionId: 'q-chem-2',
        selectedOption: 'B',
        status: 'answered',
        timeSpentSeconds: 90,
      },
    },
    questions: CORE_CURATED_QUESTIONS.filter((q) => q.reviewStatus === 'approved'),
  },
];

export const INITIAL_MISTAKE_NOTEBOOK: MistakeNotebookEntry[] = [
  {
    id: 'mistake-1',
    question: CORE_CURATED_QUESTIONS[1], // Rotational motion rolling acceleration ratio
    selectedOption: 'C',
    category: 'conceptual',
    userNote:
      'Forgot that for hollow cylinder I = mR² (so 1 + I/mR² = 2), whereas for solid sphere I = 2/5 mR².',
    testTitle: 'Full Syllabus Revision Mock #02',
    addedAt: '01 Nov 2026',
    resolved: false,
    repeatCount: 2,
  },
  {
    id: 'mistake-2',
    question: CORE_CURATED_QUESTIONS[9], // Ksp common ion effect CaF2
    selectedOption: 'B',
    category: 'calculation',
    userNote: 'Took (0.1)² as 10⁻¹ instead of 10⁻² while dividing 3.2 × 10⁻¹¹.',
    testTitle: 'Full Syllabus Revision Mock #02',
    addedAt: '01 Nov 2026',
    resolved: false,
    repeatCount: 1,
  },
  {
    id: 'mistake-3',
    question: CORE_CURATED_QUESTIONS[16], // C4 plants Statement I & II
    selectedOption: 'A',
    category: 'silly',
    userNote:
      'Misread Statement II in hurry — Mesophyll cells lack RuBisCO, Bundle sheath cells have RuBisCO!',
    testTitle: 'Full Syllabus Revision Mock #01',
    addedAt: '28 Oct 2026',
    resolved: false,
    repeatCount: 1,
  },
  {
    id: 'mistake-4',
    question: CORE_CURATED_QUESTIONS[6], // LCR Series Circuit Power & Power Factor
    selectedOption: 'C',
    category: 'calculation',
    userNote: 'Used XL - XC = 30 to compute cosφ = 30/50 instead of R/Z = 40/50 = 0.8.',
    testTitle: 'Full Syllabus Revision Mock #01',
    addedAt: '28 Oct 2026',
    resolved: false,
    repeatCount: 1,
  },
  {
    id: 'mistake-5',
    question: CORE_CURATED_QUESTIONS[20], // Sliding Filament Theory
    selectedOption: 'A',
    category: 'silly',
    userNote: 'Missed the word "NOT" in the question stem — A-band length remains constant!',
    testTitle: 'Full Syllabus Revision Mock #01',
    addedAt: '28 Oct 2026',
    resolved: false,
    repeatCount: 1,
  },
];

export const INITIAL_DAILY_TASKS: DailyTask[] = [
  {
    id: 'task-1',
    title: 'Revise Rotational Motion Moment of Inertia & Rolling Formula Sheet',
    subjectId: 'physics',
    type: 'formula_drill',
    durationMinutes: 45,
    completed: true,
  },
  {
    id: 'task-2',
    title: 'Solve 35 PYQs of Ionic Equilibrium (Buffer & Solubility Product Ksp)',
    subjectId: 'chemistry',
    type: 'pyq_practice',
    durationMinutes: 60,
    completed: true,
  },
  {
    id: 'task-3',
    title: 'NCERT Line-by-Line Revision: Plant Physiology (C3/C4 & Krebs Cycle)',
    subjectId: 'botany',
    type: 'ncert_revision',
    durationMinutes: 50,
    completed: false,
  },
  {
    id: 'task-4',
    title: 'Attempt 20-Question High-Yield 4-Subject Revision Mock & Analyze Mistakes',
    subjectId: 'zoology',
    type: 'mock_analysis',
    durationMinutes: 30,
    completed: false,
  },
  {
    id: 'task-5',
    title: 'Solve NEET 2020 Set E1 Electrostatics & Current Electricity PYQs',
    subjectId: 'physics',
    type: 'pyq_practice',
    durationMinutes: 45,
    completed: false,
  },
];
