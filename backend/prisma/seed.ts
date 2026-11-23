import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.ts';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não definida.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const currentYear = new Date().getFullYear();
const seedDir = path.resolve(process.cwd(), 'uploads', 'seed');

type ClassKey = '7A' | '8A' | '9A';
type TeacherKey = 'helena' | 'rafael' | 'camila' | 'diego' | 'marina';

const classesSeed: Array<{ key: ClassKey; name: string; shift: 'MORNING' }> = [
  { key: '7A', name: '7º Ano A', shift: 'MORNING' },
  { key: '8A', name: '8º Ano A', shift: 'MORNING' },
  { key: '9A', name: '9º Ano A', shift: 'MORNING' },
];

const teachersSeed: Array<{
  key: TeacherKey;
  name: string;
  email: string;
  employeeNumber: string;
  department: string;
}> = [
  {
    key: 'helena',
    name: 'Helena Martins',
    email: 'helena.martins@colegiohorizonte.edu.br',
    employeeNumber: 'PROF-001',
    department: 'Ciências Exatas',
  },
  {
    key: 'rafael',
    name: 'Rafael Costa',
    email: 'rafael.costa@colegiohorizonte.edu.br',
    employeeNumber: 'PROF-002',
    department: 'Linguagens',
  },
  {
    key: 'camila',
    name: 'Camila Rocha',
    email: 'camila.rocha@colegiohorizonte.edu.br',
    employeeNumber: 'PROF-003',
    department: 'Ciências da Natureza',
  },
  {
    key: 'diego',
    name: 'Diego Almeida',
    email: 'diego.almeida@colegiohorizonte.edu.br',
    employeeNumber: 'PROF-004',
    department: 'Ciências Humanas',
  },
  {
    key: 'marina',
    name: 'Marina Souza',
    email: 'marina.souza@colegiohorizonte.edu.br',
    employeeNumber: 'PROF-005',
    department: 'Linguagens',
  },
];

const subjectsSeed: Array<{
  code: string;
  name: string;
  workload: number;
  teacher: TeacherKey;
}> = [
  { code: 'MAT', name: 'Matemática', workload: 120, teacher: 'helena' },
  { code: 'POR', name: 'Língua Portuguesa', workload: 120, teacher: 'rafael' },
  { code: 'CIE', name: 'Ciências', workload: 100, teacher: 'camila' },
  { code: 'HIS', name: 'História', workload: 80, teacher: 'diego' },
  { code: 'GEO', name: 'Geografia', workload: 80, teacher: 'diego' },
  { code: 'ING', name: 'Inglês', workload: 80, teacher: 'marina' },
];

const studentsSeed: Array<{
  name: string;
  email: string;
  registrationNumber: string;
  classKey: ClassKey;
}> = [
  {
    name: 'Ana Beatriz Lima',
    email: 'ana.lima@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-9A-01`,
    classKey: '9A',
  },
  {
    name: 'Bruno Henrique Souza',
    email: 'bruno.souza@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-9A-02`,
    classKey: '9A',
  },
  {
    name: 'Clara Mendes',
    email: 'clara.mendes@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-9A-03`,
    classKey: '9A',
  },
  {
    name: 'Daniel Oliveira',
    email: 'daniel.oliveira@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-9A-04`,
    classKey: '9A',
  },
  {
    name: 'Elisa Ferreira',
    email: 'elisa.ferreira@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-9A-05`,
    classKey: '9A',
  },
  {
    name: 'Felipe Santana',
    email: 'felipe.santana@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-9A-06`,
    classKey: '9A',
  },
  {
    name: 'Gabriela Rocha',
    email: 'gabriela.rocha@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-9A-07`,
    classKey: '9A',
  },
  {
    name: 'Hugo Martins',
    email: 'hugo.martins@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-9A-08`,
    classKey: '9A',
  },
  {
    name: 'Isabela Nunes',
    email: 'isabela.nunes@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-9A-09`,
    classKey: '9A',
  },
  {
    name: 'João Pedro Alves',
    email: 'joao.alves@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-8A-01`,
    classKey: '8A',
  },
  {
    name: 'Larissa Gomes',
    email: 'larissa.gomes@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-8A-02`,
    classKey: '8A',
  },
  {
    name: 'Miguel Barbosa',
    email: 'miguel.barbosa@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-8A-03`,
    classKey: '8A',
  },
  {
    name: 'Natália Castro',
    email: 'natalia.castro@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-8A-04`,
    classKey: '8A',
  },
  {
    name: 'Otávio Ribeiro',
    email: 'otavio.ribeiro@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-8A-05`,
    classKey: '8A',
  },
  {
    name: 'Paula Freitas',
    email: 'paula.freitas@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-8A-06`,
    classKey: '8A',
  },
  {
    name: 'Rafaela Dias',
    email: 'rafaela.dias@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-7A-01`,
    classKey: '7A',
  },
  {
    name: 'Samuel Teixeira',
    email: 'samuel.teixeira@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-7A-02`,
    classKey: '7A',
  },
  {
    name: 'Sofia Cardoso',
    email: 'sofia.cardoso@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-7A-03`,
    classKey: '7A',
  },
  {
    name: 'Théo Moreira',
    email: 'theo.moreira@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-7A-04`,
    classKey: '7A',
  },
  {
    name: 'Valentina Pires',
    email: 'valentina.pires@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-7A-05`,
    classKey: '7A',
  },
  {
    name: 'William Araújo',
    email: 'william.araujo@aluno.colegiohorizonte.edu.br',
    registrationNumber: `${currentYear}-7A-06`,
    classKey: '7A',
  },
];

const resourcesSeed: Array<{
  fileName: string;
  title: string;
  description: string;
  type: 'MATERIAL' | 'ACTIVITY' | 'ASSESSMENT';
  subjectCode: string;
  classKey: ClassKey;
  teacher: TeacherKey;
  paragraphs: string[];
}> = [
  {
    fileName: 'matematica-funcoes-1-grau.pdf',
    title: 'Funções do 1º grau: lista de exercícios',
    description:
      'Atividade complementar com exercícios de interpretação, gráficos e problemas do cotidiano.',
    type: 'ACTIVITY',
    subjectCode: 'MAT',
    classKey: '9A',
    teacher: 'helena',
    paragraphs: [
      'Esta lista retoma os conceitos de função afim, coeficiente angular e coeficiente linear. Leia cada enunciado com atenção e registre o desenvolvimento das soluções.',
      '1) Determine a lei de formação de uma função afim que passa pelos pontos (0, 3) e (2, 9).',
      '2) O valor de uma corrida de aplicativo é composto por uma taxa fixa de R$ 5,00 mais R$ 2,20 por quilômetro rodado. Escreva a função que representa o valor da corrida e calcule o custo de um trajeto de 12 km.',
      '3) Construa o gráfico de f(x) = -2x + 6 e identifique em que ponto a reta corta os eixos x e y.',
      '4) Explique, com suas palavras, o significado do coeficiente angular no contexto de uma função afim.',
      'Entrega: até a próxima aula, no caderno. Em caso de dúvidas, procure a professora Helena.',
    ],
  },
  {
    fileName: 'portugues-roteiro-leitura-cortico.pdf',
    title: 'Roteiro de leitura: O Cortiço',
    description:
      'Material de apoio para a leitura orientada dos capítulos 1 a 5, com perguntas de interpretação.',
    type: 'MATERIAL',
    subjectCode: 'POR',
    classKey: '9A',
    teacher: 'rafael',
    paragraphs: [
      'O Cortiço, de Aluísio Azevedo, é uma obra central do Naturalismo brasileiro. Durante a leitura, observe como o ambiente influencia as escolhas das personagens.',
      'Antes da leitura: pesquise brevemente o contexto histórico do Rio de Janeiro no final do século XIX e anote três informações que ajudem a compreender a obra.',
      'Durante a leitura: registre passagens que mostrem a relação entre o espaço do cortiço e o comportamento das personagens.',
      'Depois da leitura: escolha uma personagem e escreva um parágrafo explicando como ela é transformada pelo ambiente em que vive.',
      'O roteiro será discutido em sala. Traga suas anotações e pelo menos uma pergunta para o grupo.',
    ],
  },
  {
    fileName: 'ciencias-roteiro-laboratorio-ecossistemas.pdf',
    title: 'Roteiro de laboratório: ecossistemas',
    description:
      'Roteiro para a aula prática sobre cadeias alimentares, produtores e decompositores.',
    type: 'ACTIVITY',
    subjectCode: 'CIE',
    classKey: '9A',
    teacher: 'camila',
    paragraphs: [
      'Nesta aula prática, vamos observar como a matéria e a energia circulam em um ecossistema. Organize-se em grupos de quatro estudantes.',
      'Materiais: lupa, pinça, recipiente transparente, amostras de solo e folhas, caderno de campo.',
      'Procedimento: observe as amostras, registre os organismos visíveis e monte um esquema de cadeia alimentar com pelo menos quatro níveis tróficos.',
      'Questões: qual é o papel dos decompositores? O que aconteceria com o ecossistema se os produtores desaparecessem? Como a atividade humana pode alterar esse equilíbrio?',
      'Entregue o relatório do grupo ao final da aula, com desenhos e conclusões.',
    ],
  },
  {
    fileName: 'historia-linha-do-tempo-era-vargas.pdf',
    title: 'Linha do tempo: Era Vargas',
    description:
      'Síntese visual e atividade de linha do tempo sobre os principais acontecimentos de 1930 a 1945.',
    type: 'MATERIAL',
    subjectCode: 'HIS',
    classKey: '9A',
    teacher: 'diego',
    paragraphs: [
      'A Era Vargas (1930-1945) transformou profundamente a política, a economia e as relações de trabalho no Brasil. Use esta linha do tempo como ponto de partida para seus estudos.',
      '1930: fim da República Velha e início do governo provisório de Getúlio Vargas.',
      '1932: Revolução Constitucionalista em São Paulo.',
      '1934: promulgação da Constituição e início do período constitucional.',
      '1937: instauração do Estado Novo, com concentração de poderes no Executivo.',
      '1943: criação da Consolidação das Leis do Trabalho (CLT).',
      '1945: fim do Estado Novo e deposição de Vargas.',
      'Atividade: escolha três acontecimentos e explique, em um parágrafo para cada, como eles afetaram a vida da população brasileira.',
    ],
  },
  {
    fileName: 'geografia-mapa-mundi-politico.pdf',
    title: 'Mapa-múndi político comentado',
    description:
      'Material de consulta para a atividade de regionalização e leitura de mapas.',
    type: 'MATERIAL',
    subjectCode: 'GEO',
    classKey: '9A',
    teacher: 'diego',
    paragraphs: [
      'Este material acompanha a atividade de leitura e interpretação de mapas políticos. Observe as legendas, as escalas e os limites representados.',
      '1) Identifique três países que fazem fronteira com o Brasil e localize suas capitais.',
      '2) Explique a diferença entre continente e região geográfica.',
      '3) Escolha um conflito territorial recente e pesquise em que continente ele ocorre.',
      '4) Compare a projeção de Mercator com uma projeção que preserve áreas. Que distorções cada uma apresenta?',
      'Use o mapa para registrar suas respostas e traga-o para a próxima aula.',
    ],
  },
  {
    fileName: 'ingles-vocabulary-booklet-unit-3.pdf',
    title: 'Vocabulary booklet: Unit 3',
    description:
      'Vocabulário essencial da unidade 3, com expressões para prática de conversação.',
    type: 'MATERIAL',
    subjectCode: 'ING',
    classKey: '9A',
    teacher: 'marina',
    paragraphs: [
      'Unit 3: School life and future plans. Study the expressions below and practice them with a classmate.',
      'Key vocabulary: assignment, deadline, achievement, scholarship, career, skill, goal, challenge.',
      'Useful expressions: I am planning to... / I hope to... / I am good at... / I need to improve...',
      'Speaking practice: talk about your plans for next year using at least five expressions from this booklet.',
      'Writing task: write a short paragraph (80-100 words) about a goal you want to achieve and the steps you will take.',
    ],
  },
  {
    fileName: 'matematica-fracoes-8ano.pdf',
    title: 'Frações e números decimais: atividades',
    description:
      'Atividade de revisão com operações, comparação e problemas envolvendo frações.',
    type: 'ACTIVITY',
    subjectCode: 'MAT',
    classKey: '8A',
    teacher: 'helena',
    paragraphs: [
      'Esta atividade revisa operações com frações e a relação entre frações e números decimais.',
      '1) Calcule: 3/4 + 2/5; 7/8 - 1/2; 2/3 x 9/10; 5/6 ÷ 10/12.',
      '2) Transforme as frações 1/2, 3/4 e 7/8 em números decimais.',
      '3) Em uma receita, são necessários 3/4 de xícara de açúcar. Se você fizer três receitas, quantas xícaras serão necessárias?',
      '4) Explique como você compara 2/3 e 3/5 sem transformá-las em números decimais.',
    ],
  },
  {
    fileName: 'portugues-producao-cronica-7ano.pdf',
    title: 'Produção textual: crônica',
    description:
      'Guia de escrita para a crônica do cotidiano, com critérios de avaliação.',
    type: 'ACTIVITY',
    subjectCode: 'POR',
    classKey: '7A',
    teacher: 'rafael',
    paragraphs: [
      'A crônica parte de uma situação cotidiana para revelar algo maior sobre a vida. Nesta atividade, você escreverá uma crônica de 20 a 30 linhas.',
      'Passo 1: escolha um acontecimento simples do seu dia. Pode ser uma fila, uma conversa, um ônibus atrasado ou um detalhe da escola.',
      'Passo 2: descreva a cena com detalhes sensoriais. Quem estava presente? O que se ouvia? O que chamou sua atenção?',
      'Passo 3: construa um pequeno conflito ou reflexão. O narrador pode ser você ou uma personagem inventada.',
      'Critérios: uso de primeira pessoa (se escolher narrador pessoal), coerência, criatividade e revisão ortográfica.',
      'Traga a versão final impressa ou escrita à mão na próxima aula.',
    ],
  },
];

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines;
}

async function ensurePdf(
  fileName: string,
  title: string,
  subtitle: string,
  paragraphs: string[],
) {
  const filePath = path.join(seedDir, fileName);

  if (fs.existsSync(filePath)) return filePath;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.039, 0.145, 0.251);
  const gold = rgb(0.949, 0.722, 0.294);
  const slate = rgb(0.18, 0.23, 0.29);
  const muted = rgb(0.42, 0.47, 0.53);

  page.drawRectangle({ x: 0, y: height - 160, width, height: 160, color: navy });
  page.drawCircle({ x: width - 62, y: height - 62, size: 36, color: gold });
  page.drawText('COLÉGIO HORIZONTE', {
    x: 50,
    y: height - 52,
    size: 10,
    font: bold,
    color: gold,
    characterSpacing: 2,
  });
  page.drawText(title, {
    x: 50,
    y: height - 88,
    size: 20,
    font: bold,
    color: rgb(1, 1, 1),
    maxWidth: width - 140,
    lineHeight: 24,
  });
  page.drawText(subtitle, {
    x: 50,
    y: height - 134,
    size: 10,
    font: regular,
    color: rgb(0.82, 0.88, 0.93),
    maxWidth: width - 140,
  });

  let y = height - 200;

  for (const paragraph of paragraphs) {
    const lines = wrapText(paragraph, regular, 11, width - 100);

    for (const line of lines) {
      page.drawText(line, {
        x: 50,
        y,
        size: 11,
        font: regular,
        color: slate,
      });
      y -= 18;
    }

    y -= 10;
  }

  page.drawLine({
    start: { x: 50, y: 62 },
    end: { x: width - 50, y: 62 },
    thickness: 1,
    color: rgb(0.86, 0.89, 0.92),
  });
  page.drawText('Material de apoio · Colégio Horizonte', {
    x: 50,
    y: 44,
    size: 9,
    font: regular,
    color: muted,
  });

  fs.mkdirSync(seedDir, { recursive: true });
  fs.writeFileSync(filePath, await pdf.save());
  return filePath;
}

async function main() {
  console.log('[seed] Preparando dados de demonstração...');

  const [adminHash, teacherHash, studentHash] = await Promise.all([
    bcrypt.hash('Admin@123', 10),
    bcrypt.hash('Professor@123', 10),
    bcrypt.hash('Aluno@123', 10),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@colegiohorizonte.edu.br' },
    update: { name: 'Beatriz Albuquerque', role: 'ADMIN', active: true },
    create: {
      name: 'Beatriz Albuquerque',
      email: 'admin@colegiohorizonte.edu.br',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const classMap = new Map<ClassKey, { id: string; name: string; year: number }>();

  for (const item of classesSeed) {
    const schoolClass = await prisma.schoolClass.upsert({
      where: { name_year: { name: item.name, year: currentYear } },
      update: { shift: item.shift },
      create: { name: item.name, year: currentYear, shift: item.shift },
    });

    classMap.set(item.key, {
      id: schoolClass.id,
      name: schoolClass.name,
      year: schoolClass.year,
    });
  }

  const teacherProfiles = new Map<
    TeacherKey,
    { id: string; userId: string; name: string }
  >();

  for (const item of teachersSeed) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: { name: item.name, role: 'TEACHER', active: true },
      create: {
        name: item.name,
        email: item.email,
        passwordHash: teacherHash,
        role: 'TEACHER',
      },
    });

    const profile = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {
        employeeNumber: item.employeeNumber,
        department: item.department,
      },
      create: {
        userId: user.id,
        employeeNumber: item.employeeNumber,
        department: item.department,
      },
    });

    teacherProfiles.set(item.key, {
      id: profile.id,
      userId: user.id,
      name: user.name,
    });
  }

  const subjectMap = new Map<string, { id: string; name: string; code: string }>();

  for (const item of subjectsSeed) {
    const subject = await prisma.subject.upsert({
      where: { code: item.code },
      update: { name: item.name, workload: item.workload },
      create: {
        code: item.code,
        name: item.name,
        workload: item.workload,
      },
    });

    subjectMap.set(item.code, {
      id: subject.id,
      name: subject.name,
      code: subject.code,
    });
  }

  const assignmentMap = new Map<
    string,
    { id: string; teacherId: string; subjectId: string; classId: string }
  >();

  for (const schoolClass of classesSeed) {
    const classInfo = classMap.get(schoolClass.key)!;

    for (const subjectItem of subjectsSeed) {
      const subject = subjectMap.get(subjectItem.code)!;
      const teacher = teacherProfiles.get(subjectItem.teacher)!;

      const assignment = await prisma.teachingAssignment.upsert({
        where: {
          teacherId_subjectId_classId: {
            teacherId: teacher.id,
            subjectId: subject.id,
            classId: classInfo.id,
          },
        },
        update: {},
        create: {
          teacherId: teacher.id,
          subjectId: subject.id,
          classId: classInfo.id,
        },
      });

      assignmentMap.set(`${schoolClass.key}:${subjectItem.code}`, {
        id: assignment.id,
        teacherId: assignment.teacherId,
        subjectId: assignment.subjectId,
        classId: assignment.classId,
      });
    }
  }

  const studentProfiles: Array<{
    id: string;
    name: string;
    email: string;
    classKey: ClassKey;
    indexInClass: number;
  }> = [];

  const classCounters = new Map<ClassKey, number>();

  for (const item of studentsSeed) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: { name: item.name, role: 'STUDENT', active: true },
      create: {
        name: item.name,
        email: item.email,
        passwordHash: studentHash,
        role: 'STUDENT',
      },
    });

    const profile = await prisma.student.upsert({
      where: { userId: user.id },
      update: { registrationNumber: item.registrationNumber },
      create: {
        userId: user.id,
        registrationNumber: item.registrationNumber,
      },
    });

    const classInfo = classMap.get(item.classKey)!;

    await prisma.enrollment.upsert({
      where: {
        studentId_year: { studentId: profile.id, year: currentYear },
      },
      update: { classId: classInfo.id, status: 'ACTIVE' },
      create: {
        studentId: profile.id,
        classId: classInfo.id,
        year: currentYear,
        status: 'ACTIVE',
      },
    });

    const indexInClass = classCounters.get(item.classKey) ?? 0;
    classCounters.set(item.classKey, indexInClass + 1);

    studentProfiles.push({
      id: profile.id,
      name: user.name,
      email: user.email,
      classKey: item.classKey,
      indexInClass,
    });
  }

  for (const student of studentProfiles) {
    const enrollment = await prisma.enrollment.findUniqueOrThrow({
      where: {
        studentId_year: { studentId: student.id, year: currentYear },
      },
    });

    for (const [subjectIndex, subjectItem] of subjectsSeed.entries()) {
      const assignment = assignmentMap.get(`${student.classKey}:${subjectItem.code}`);

      if (!assignment) continue;

      for (const period of [1, 2]) {
        const raw = 6.4 + ((student.indexInClass * 2 + subjectIndex * 3 + period) % 30) / 10;
        let value = Math.round(raw * 10) / 10;

        if (
          student.email === 'ana.lima@aluno.colegiohorizonte.edu.br' &&
          subjectItem.code === 'HIS' &&
          period === 2
        ) {
          value = 5.6;
        }

        await prisma.grade.upsert({
          where: {
            enrollmentId_subjectId_period: {
              enrollmentId: enrollment.id,
              subjectId: assignment.subjectId,
              period,
            },
          },
          update: {},
          create: {
            enrollmentId: enrollment.id,
            subjectId: assignment.subjectId,
            teacherId: assignment.teacherId,
            period,
            value,
          },
        });
      }
    }
  }

  for (const item of resourcesSeed) {
    const classInfo = classMap.get(item.classKey)!;
    const subject = subjectMap.get(item.subjectCode)!;
    const teacher = teacherProfiles.get(item.teacher)!;
    const filePath = await ensurePdf(
      item.fileName,
      item.title,
      `${subject.name} · ${classInfo.name} · ${currentYear}`,
      item.paragraphs,
    );
    const storedName = path.posix.join('seed', item.fileName);
    const sizeBytes = fs.statSync(filePath).size;
    const content = fs.readFileSync(filePath);

    const existing = await prisma.libraryResource.findUnique({
      where: { storedName },
      include: { file: { select: { id: true } } },
    });

    if (!existing) {
      await prisma.libraryResource.create({
        data: {
          title: item.title,
          description: item.description,
          type: item.type,
          subjectId: subject.id,
          classId: classInfo.id,
          uploadedById: teacher.userId,
          fileName: item.fileName,
          storedName,
          mimeType: 'application/pdf',
          sizeBytes,
          file: { create: { content } },
        },
      });
    } else if (!existing.file) {
      await prisma.libraryFile.create({
        data: { resourceId: existing.id, content },
      });
    }
  }

  const [studentsCount, teachersCount, subjectsCount, resourcesCount, gradesCount] =
    await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.subject.count(),
      prisma.libraryResource.count(),
      prisma.grade.count(),
    ]);

  console.log('[seed] Dados prontos.');
  console.log(
    `[seed] ${studentsCount} alunos, ${teachersCount} professores, ${subjectsCount} disciplinas, ${gradesCount} notas e ${resourcesCount} materiais.`,
  );
  console.log(`[seed] Admin: ${admin.email} / Admin@123`);
  console.log('[seed] Professor: helena.martins@colegiohorizonte.edu.br / Professor@123');
  console.log('[seed] Aluno: ana.lima@aluno.colegiohorizonte.edu.br / Aluno@123');
}

main()
  .catch((error) => {
    console.error('[seed] Falha ao preparar os dados:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
