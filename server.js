require('dotenv').config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { NlpManager } = require('node-nlp');
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',') 
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST']
}));

app.use(express.json());

// File paths for persistent storage
const KNOWLEDGE_FILE = path.join(__dirname, 'knowledgeStore.json');
const GENERATED_INSIGHTS_FILE = path.join(__dirname, 'generatedInsights.json');

// Enhanced knowledge base with learning capabilities
let knowledgeBase = {
  name: "Dev Shah",
  title: "B.E. IT Student",
  education: {
    degree: "B.E. in Information Technology",
    university: "SVIT, Vasad",
    graduationYear: "2026",
    cgpa: "8.65",
    bestInsight: ["AI/ML", "IoT", "Computer Vision", "Software Development"]
  },
  experience: [
    {
      position: "AI/ML Intern",
      company: "Sparks to Ideas",
      period: "Feb 2025 - Mar 2025",
      responsibilities: [
        "Learned AI/ML functions in numpy, pandas",
        "Applied Python for efficient implementation in projects"
      ]
    }
  ],
  skills: {
    programming: ["C", "Java", "Python"],
    domains: ["AI/ML", "IoT", "Computer Vision"],
    softSkills: ["Quick Learner", "Learning in Depth", "Problem Solving"],
    // Added missing skill categories
    frontend: ["HTML", "CSS", "JavaScript", "React"],
    backend: ["Node.js", "Express"],
    databases: ["MySQL", "MongoDB"],
    devops: ["Git", "Docker"],
    other: ["REST APIs", "WebSockets"]
  },
  projects: [
    {
      name: "Smart Door Lock System",
      description: "IoT-based system with face and audio recognition for door security",
      technologies: ["Python", "Raspberry Pi", "OpenCV", "IoT Sensors"],
      impact: "Provides secure access through biometric recognition and auto-locking",
      period: "Jan 2025 - Mar 2025"
    },
    {
      name: "Library Management System",
      description: "Web application for managing books digitally",
      technologies: ["React.js", "Node.js", "Express", "MongoDB"],
      impact: "Eliminates paperwork with intuitive digital management",
      period: "Jan 2024 - Mar 2024"
    }
  ],
  contact: {
    email: "DevShah4956@gmail.com",
    phone: "8000401487",
    address: "Adajan, Surat",
    linkedin: "linkedin.com/in/DevShah4956",
    github: "github.com/DevShah4956"
  },
  achievements: [
    "JEE Qualified with 91 Percentile"
  ],
  certifications: [
    {
      name: "Code Unnati Program",
      issuer: "SAP & Edunet",
      skills: ["IoT", "AI/ML", "Computer Vision", "Data Science"]
    },
    {
      name: "Ethical Hacking",
      issuer: "NPTEL",
      skills: ["Networking Basics", "Vulnerability Scanning", "Kali Linux"]
    },
    {
      name: "IoT Workshop",
      skills: ["Arduino", "IoT Sensors"]
    }
  ],
  summary: "Pre-final year IT engineering student passionate about AI/ML integration in software development. Gained industry insights through internship and project experience. Eager to learn new technologies and contribute to real-world projects.",
  
  // Personality traits
  personality: {
    traits: {
      enthusiasm: 8,
      professionalism: 9,
      curiosity: 9,
      humor: 5
    },
    responseStyles: [
      "insightful", 
      "concise", 
      "detailed"
    ]
  },
  
  // Updated Q&A based on resume
  qna: {
    "what can you do": [
      "I can tell you about Dev's education, skills, projects, and internship experience!",
      "Ask me about Dev's technical expertise in AI/ML, IoT, or software development",
      "I can share details about Dev's academic background and professional certifications"
    ],
    "projects": [
      `Dev has built practical projects including:
      * Smart Door Lock System (IoT/Python/OpenCV)
      * Library Management System (React.js/Node.js)
      Which one would you like to know more about?`,
      `Notable projects in Dev's portfolio:
      - IoT-based Security System with facial recognition
      - Digital Library Management Solution
      Ask about any that interest you!`
    ],
    "skills": [
      `Dev's technical skills include:
      Programming: C, Java, Python
      Domains: AI/ML, IoT, Computer Vision
      Frontend: HTML, CSS, JavaScript, React
      Would you like details on any specific area?`,
      `His technical expertise includes:
      • Programming Languages: C, Java, Python
      • Specializations: AI/ML, IoT, Computer Vision
      • Frontend: React, JavaScript
      • Backend: Node.js, Express`
    ],
    "experience": [
      "Dev completed an AI/ML internship at Sparks to Ideas where he learned numpy, pandas and practical AI implementation",
      "During his internship, Dev gained industry insights and applied Python for AI projects"
    ],
    "education": [
      "Pursuing B.E. in IT from SVIT, Vasad with current CGPA of 8.65",
      "Completed 12th Science with 88 PR and SSC with 79%"
    ]
  },

  // Response templates updated with resume content
  responseTemplates: {
    greeting: [
      "Hello! I'm Dev's AI assistant. What would you like to know about his IT background?",
      "Hi there! Ready to explore Dev's skills in AI/ML and IoT?",
      "Greetings! How can I help you learn about Dev's technical education and projects?"
    ],
    projectDetails: [
      "Dev worked on {project} which uses {tech}. It {description}",
      "The {project} project demonstrates Dev's {specialty} skills using {tech} to {description}",
      "In {project}, Dev implemented {tech} to create {description}"
    ],
    skillHighlight: [
      "Dev specializes in {primary} with experience in {secondary}",
      "His core expertise includes {primary}, complemented by {secondary}",
      "Dev combines skills in {primary} with knowledge of {secondary}"
    ],
    experienceDetail: [
      "At {company}, Dev worked as {position} where he {responsibilities}",
      "During his internship at {company}, he {responsibilities}"
    ],
    educationDetail: [
      "Dev is pursuing his {degree} from {university} with current CGPA of {gpa}",
      "His academic background includes {degree} from {university} with {gpa} CGPA"
    ]
  },

  // Other knowledge components
  generatedInsights: [],
  learnedFacts: {},
  unansweredQuestions: [],
  conceptGraph: {},
  conversations: [
    "Dev is passionate about applying AI/ML to solve real-world problems",
    "His technical skills combine both theoretical knowledge and practical application",
    "Dev enjoys exploring new technologies and frameworks to expand his skill set",
    "He believes in continuous learning and staying updated with industry trends",
    "Dev approaches problems with analytical thinking and creative solutions"
  ]
};

// Load stored knowledge on startup
try {
  if (fs.existsSync(KNOWLEDGE_FILE)) {
    const storedData = JSON.parse(fs.readFileSync(KNOWLEDGE_FILE, 'utf8'));
    knowledgeBase.generatedInsights = storedData.generatedInsights || [];
    knowledgeBase.learnedFacts = storedData.learnedFacts || {};
    knowledgeBase.unansweredQuestions = storedData.unansweredQuestions || [];
    knowledgeBase.conceptGraph = storedData.conceptGraph || {};
  }
  
  if (fs.existsSync(GENERATED_INSIGHTS_FILE)) {
    const insights = JSON.parse(fs.readFileSync(GENERATED_INSIGHTS_FILE, 'utf8'));
    knowledgeBase.generatedInsights = [...knowledgeBase.generatedInsights, ...insights];
  }
} catch (e) {
  console.error('Error loading knowledge files:', e);
}

// Initialize NLP manager
const manager = new NlpManager({ 
  languages: ['en'], 
  nlu: { log: false },
  autoSave: false,
  modelFileName: 'model.nlp'
});
const handleSuggestedQuestion = async (question) => {
  setInput('');
  
  // Add user message
  const userMessage = { 
    text: question, 
    sender: 'user',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  setMessages(prev => [...prev, userMessage]);
  
  // Get response from backend
  const botResponse = await sendToBackend(question);
  
  // Add bot response
  setMessages(prev => [...prev, { 
    text: botResponse, 
    sender: 'bot',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);
};

// Enhanced conversation memory with learning capabilities
const conversationMemory = new Map();

// Engagement tracking and learning metrics
const engagementMetrics = {
  sessionCount: 0,
  popularTopics: new Map(),
  responseQuality: new Map(),
  totalInteractions: 0,
  usedResponses: new Map(),
  personalityAdjustments: new Map()
};

// Train the NLP model with enhanced data including generated insights
async function trainModel() {
  // Add more variations to existing intents
  manager.addDocument('en', 'hello', 'greeting');
  manager.addDocument('en', 'hi there', 'greeting');
  manager.addDocument('en', 'good morning', 'greeting');
  manager.addDocument('en', 'hey', 'greeting');
  manager.addDocument('en', 'greetings', 'greeting');
  manager.addDocument('en', "what's up", 'greeting');
  
  manager.addDocument('en', 'what is your name', 'bot.name');
  manager.addDocument('en', 'who are you', 'bot.name');
  manager.addDocument('en', 'identify yourself', 'bot.name');
  manager.addDocument('en', 'are you a human', 'bot.name');
  
  // Add documents for generative responses
  manager.addDocument('en', 'tell me more', 'generate.more');
  manager.addDocument('en', 'what else', 'generate.more');
  manager.addDocument('en', 'continue', 'generate.more');
  manager.addDocument('en', 'go on', 'generate.more');
  manager.addDocument('en', 'elaborate', 'generate.more');
  
  manager.addDocument('en', 'tell me about a project', 'project.detail');
  manager.addDocument('en', 'what projects have you done', 'project.list');
  manager.addDocument('en', 'explain your skills', 'skill.detail');
  manager.addDocument('en', 'describe your experience', 'experience.detail');
  manager.addDocument('en', 'education background', 'education.detail');
  
  // Add answers with variations
  knowledgeBase.responseTemplates.greeting.forEach(response => 
    manager.addAnswer('en', 'greeting', response));
  
  const botNameResponses = [
    "I'm an AI assistant created to showcase Dev Shah's technical expertise",
    "I'm your guide to Dev's professional journey - a digital portfolio assistant",
    "Think of me as Dev's virtual representative. How can I assist?",
    "I'm Dev's AI counterpart, here to answer questions about his career and skills"
  ];
  
  botNameResponses.forEach(response => 
    manager.addAnswer('en', 'bot.name', response));
  
  // Add Q&A answers
  for (const [question, answers] of Object.entries(knowledgeBase.qna)) {
    const intentName = `qna.${question.replace(/\s+/g, '_')}`;
    manager.addDocument('en', question, intentName);
    
    // Add all variations as possible answers
    if (Array.isArray(answers)) {
      answers.forEach(answer => manager.addAnswer('en', intentName, answer));
    } else {
      manager.addAnswer('en', intentName, answers);
    }
  }
  
  // Add training for generated insights
  knowledgeBase.generatedInsights.forEach(insight => {
    const intentName = `insight.${insight.type || 'fact'}`;
    manager.addDocument('en', insight.question, intentName);
    manager.addAnswer('en', intentName, insight.response);
  });
  
  // Add training for learned facts
  Object.entries(knowledgeBase.learnedFacts).forEach(([question, response]) => {
    const intentName = `learned.${question.substring(0, 15).replace(/\s+/g, '_')}`;
    manager.addDocument('en', question, intentName);
    manager.addAnswer('en', intentName, response);
  });

  // Train and save the model
  console.time('Training time');
  await manager.train();
  console.timeEnd('Training time');
  manager.save();
}

// Save knowledge to file
function saveKnowledge() {
  const knowledgeToSave = {
    generatedInsights: knowledgeBase.generatedInsights,
    learnedFacts: knowledgeBase.learnedFacts,
    unansweredQuestions: knowledgeBase.unansweredQuestions,
    conceptGraph: knowledgeBase.conceptGraph
  };
  
  try {
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(knowledgeToSave, null, 2));
    console.log('Knowledge saved successfully');
  } catch (e) {
    console.error('Error saving knowledge:', e);
  }
}

// Save generated insights to separate file
function saveGeneratedInsights() {
  try {
    fs.writeFileSync(GENERATED_INSIGHTS_FILE, JSON.stringify(knowledgeBase.generatedInsights, null, 2));
    console.log('Generated insights saved');
  } catch (e) {
    console.error('Error saving insights:', e);
  }
}

// Helper function to get all skills
function getAllSkills() {
  return [
    ...knowledgeBase.skills.programming,
    ...knowledgeBase.skills.domains,
    ...knowledgeBase.skills.softSkills,
    ...knowledgeBase.skills.frontend,
    ...knowledgeBase.skills.backend,
    ...knowledgeBase.skills.databases,
    ...knowledgeBase.skills.devops,
    ...knowledgeBase.skills.other
  ];
}

// Generate new knowledge from existing information
function generateNewKnowledge() {
  // 1. Generate project-skill connections
  knowledgeBase.projects.forEach(project => {
    const insight = {
      type: 'project-skill',
      question: `How did ${project.name} use ${project.technologies.join(', ')}?`,
      response: `In the ${project.name} project, Dev used ${project.technologies.join(', ')} ` +
                `to ${project.description}. The project resulted in ${project.impact}.`,
      entities: {
        projects: [project.name],
        skills: project.technologies
      }
    };
    
    if (!knowledgeBase.generatedInsights.some(i => i.question === insight.question)) {
      knowledgeBase.generatedInsights.push(insight);
    }
    
    // Add to concept graph
    project.technologies.forEach(skill => {
      if (!knowledgeBase.conceptGraph[skill]) {
        knowledgeBase.conceptGraph[skill] = [];
      }
      if (!knowledgeBase.conceptGraph[skill].includes(project.name)) {
        knowledgeBase.conceptGraph[skill].push(project.name);
      }
    });
  });
  
  // 2. Generate experience-skill connections
  knowledgeBase.experience.forEach(exp => {
    const skillsUsed = [];
    const allSkills = getAllSkills();
    
    exp.responsibilities.forEach(resp => {
      allSkills.forEach(skill => {
        if (resp.toLowerCase().includes(skill.toLowerCase()) && !skillsUsed.includes(skill)) {
          skillsUsed.push(skill);
        }
      });
    });
    
    if (skillsUsed.length > 0) {
      const insight = {
        type: 'experience-skill',
        question: `What skills did Dev use at ${exp.company}?`,
        response: `At ${exp.company} as a ${exp.position}, Dev used ${skillsUsed.join(', ')} ` +
                  `to accomplish tasks like: ${exp.responsibilities.slice(0, 2).join(' and ')}.`,
        entities: {
          companies: [exp.company],
          skills: skillsUsed
        }
      };
      
      if (!knowledgeBase.generatedInsights.some(i => i.question === insight.question)) {
        knowledgeBase.generatedInsights.push(insight);
      }
      
      // Add to concept graph
      skillsUsed.forEach(skill => {
        if (!knowledgeBase.conceptGraph[skill]) {
          knowledgeBase.conceptGraph[skill] = [];
        }
        if (!knowledgeBase.conceptGraph[skill].includes(exp.company)) {
          knowledgeBase.conceptGraph[skill].push(exp.company);
        }
      });
    }
  });
  
  // 3. Generate education-skill connections
  const allSkills = getAllSkills();
  // Get up to 5 unique skills
  const educationSkills = [...new Set(allSkills)].slice(0, 5);
  
  const insight = {
    type: 'education-skill',
    question: "How did Dev's education prepare him for technical work?",
    response: `Dev's ${knowledgeBase.education.degree} from ${knowledgeBase.education.university} ` +
              `provided a strong foundation in ${educationSkills.join(', ')}, which he applied ` +
              `in projects and professional experience.`,
    entities: {
      education: [knowledgeBase.education.degree],
      skills: educationSkills
    }
  };
  
  if (!knowledgeBase.generatedInsights.some(i => i.question === insight.question)) {
    knowledgeBase.generatedInsights.push(insight);
  }
  
  // Save generated insights
  saveGeneratedInsights();
}

// Answer previously unanswered questions using new knowledge
function answerUnansweredQuestions() {
  knowledgeBase.unansweredQuestions.forEach((q, index) => {
    // Try to answer using concept graph
    const tokens = tokenizer.tokenize(q.question.toLowerCase());
    let bestMatch = null;
    let bestMatchScore = 0;
    
    // Search generated insights
    knowledgeBase.generatedInsights.forEach(insight => {
      const insightTokens = tokenizer.tokenize(insight.question.toLowerCase());
      const commonTokens = tokens.filter(t => insightTokens.includes(t));
      
      if (commonTokens.length > bestMatchScore) {
        bestMatchScore = commonTokens.length;
        bestMatch = insight;
      }
    });
    
    // Search concept graph
    if (!bestMatch) {
      Object.entries(knowledgeBase.conceptGraph).forEach(([concept, connections]) => {
        if (q.question.toLowerCase().includes(concept.toLowerCase())) {
          const response = `Based on Dev's experience, ${concept} was used in relation to: ` +
                           `${connections.slice(0, 3).join(', ')}.`;
          bestMatch = { response };
        }
      });
    }
    
    // If we found an answer, store it as a learned fact
    if (bestMatch) {
      knowledgeBase.learnedFacts[q.question] = bestMatch.response;
      knowledgeBase.unansweredQuestions.splice(index, 1);
      
      // Retrain model with new knowledge
      setTimeout(() => {
        trainModel().then(() => console.log('Retrained with new knowledge'));
      }, 5000);
    }
  });
  
  saveKnowledge();
}

// Health check
app.get("/", (req, res) => {
  res.send("Server is up and running ✅");
});

// Email route
app.post("/api/send-email", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASS
      },
    });

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.USER_EMAIL,
      subject: subject,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully!" });

  } catch (error) {
    console.error("Email sending failed:", error);
    res.status(500).json({ 
      message: "Failed to send email.", 
      error: error.message 
    });
  }
});

// Enhanced generative response functions with uniqueness
function generateProjectDetail(project, sessionId) {
  // Get unused templates for this session
  let availableTemplates = [...knowledgeBase.responseTemplates.projectDetails];
  const usedTemplates = engagementMetrics.usedResponses.get(sessionId)?.projectTemplates || [];
  
  // Filter out recently used templates
  if (usedTemplates.length > 0) {
    availableTemplates = availableTemplates.filter(
      t => !usedTemplates.includes(t)
    );
  }
  
  // If all templates have been used, reset
  if (availableTemplates.length === 0) {
    availableTemplates = [...knowledgeBase.responseTemplates.projectDetails];
    usedTemplates.length = 0;
  }
  
  // Select a random unused template
  const templateIndex = Math.floor(Math.random() * availableTemplates.length);
  const template = availableTemplates[templateIndex];
  
  // Track used template
  usedTemplates.push(template);
  if (!engagementMetrics.usedResponses.has(sessionId)) {
    engagementMetrics.usedResponses.set(sessionId, { projectTemplates: [] });
  }
  engagementMetrics.usedResponses.get(sessionId).projectTemplates = usedTemplates;
  
  // Get a random specialty based on technologies
  const specialties = {
    "React": "UI/UX development",
    "Node.js": "backend architecture",
    "Python": "data processing",
    "Express": "API development",
    "MongoDB": "database design",
    "OpenCV": "computer vision",
    "IoT Sensors": "hardware integration"
  };
  
  const specialty = project.technologies.map(t => specialties[t] || t)
    .filter((v, i, a) => a.indexOf(v) === i) // Unique values
    .slice(0, 2)
    .join(' and ');
  
  return template
    .replace('{project}', project.name)
    .replace('{tech}', project.technologies.join(', '))
    .replace('{description}', project.description)
    .replace('{impact}', project.impact || 'delivered significant value')
    .replace('{specialty}', specialty || 'technical');
}

function generateSkillHighlight(sessionId) {
  // Get unused templates for this session
  let availableTemplates = [...knowledgeBase.responseTemplates.skillHighlight];
  const usedTemplates = engagementMetrics.usedResponses.get(sessionId)?.skillTemplates || [];
  
  // Filter out recently used templates
  if (usedTemplates.length > 0) {
    availableTemplates = availableTemplates.filter(
      t => !usedTemplates.includes(t)
    );
  }
  
  // If all templates have been used, reset
  if (availableTemplates.length === 0) {
    availableTemplates = [...knowledgeBase.responseTemplates.skillHighlight];
    usedTemplates.length = 0;
  }
  
  // Select a random unused template
  const templateIndex = Math.floor(Math.random() * availableTemplates.length);
  const template = availableTemplates[templateIndex];
  
  // Track used template
  usedTemplates.push(template);
  if (!engagementMetrics.usedResponses.has(sessionId)) {
    engagementMetrics.usedResponses.set(sessionId, { skillTemplates: [] });
  }
  engagementMetrics.usedResponses.get(sessionId).skillTemplates = usedTemplates;
  
  // Select random primary and secondary skills
  const primary = [
    ...knowledgeBase.skills.frontend.slice(0, 2),
    ...knowledgeBase.skills.backend.slice(0, 1)
  ]
  .sort(() => 0.5 - Math.random()) // Shuffle
  .slice(0, 2 + Math.floor(Math.random() * 2)) // 2-4 skills
  .join(', ');
  
  const secondary = [
    ...knowledgeBase.skills.databases.slice(0, 1),
    ...knowledgeBase.skills.devops.slice(0, 1),
    ...knowledgeBase.skills.other.slice(0, 2)
  ]
  .sort(() => 0.5 - Math.random()) // Shuffle
  .slice(0, 2 + Math.floor(Math.random() * 2)) // 2-4 skills
  .join(', ');
  
  return template
    .replace('{primary}', primary)
    .replace('{secondary}', secondary);
}

function generateExperienceDetail(experience, sessionId) {
  // Get unused templates for this session
  let availableTemplates = [...knowledgeBase.responseTemplates.experienceDetail];
  const usedTemplates = engagementMetrics.usedResponses.get(sessionId)?.experienceTemplates || [];
  
  // Filter out recently used templates
  if (usedTemplates.length > 0) {
    availableTemplates = availableTemplates.filter(
      t => !usedTemplates.includes(t)
    );
  }
  
  // If all templates have been used, reset
  if (availableTemplates.length === 0) {
    availableTemplates = [...knowledgeBase.responseTemplates.experienceDetail];
    usedTemplates.length = 0;
  }
  
  // Select a random unused template
  const templateIndex = Math.floor(Math.random() * availableTemplates.length);
  const template = availableTemplates[templateIndex];
  
  // Track used template
  usedTemplates.push(template);
  if (!engagementMetrics.usedResponses.has(sessionId)) {
    engagementMetrics.usedResponses.set(sessionId, { experienceTemplates: [] });
  }
  engagementMetrics.usedResponses.get(sessionId).experienceTemplates = usedTemplates;
  
  // Select 1-3 random responsibilities
  const responsibilities = [...experience.responsibilities]
    .sort(() => 0.5 - Math.random())
    .slice(0, 1 + Math.floor(Math.random() * 2))
    .map(r => r.replace(/\.$/, '').toLowerCase())
    .join(', and ');
  
  return template
    .replace('{company}', experience.company)
    .replace('{position}', experience.position)
    .replace('{responsibilities}', responsibilities);
}

function generateEducationDetail(sessionId) {
  // Get unused templates for this session
  let availableTemplates = [...knowledgeBase.responseTemplates.educationDetail];
  const usedTemplates = engagementMetrics.usedResponses.get(sessionId)?.educationTemplates || [];
  
  // Filter out recently used templates
  if (usedTemplates.length > 0) {
    availableTemplates = availableTemplates.filter(
      t => !usedTemplates.includes(t)
    );
  }
  
  // If all templates have been used, reset
  if (availableTemplates.length === 0) {
    availableTemplates = [...knowledgeBase.responseTemplates.educationDetail];
    usedTemplates.length = 0;
  }
  
  // Select a random unused template
  const templateIndex = Math.floor(Math.random() * availableTemplates.length);
  const template = availableTemplates[templateIndex];
  
  // Track used template
  usedTemplates.push(template);
  if (!engagementMetrics.usedResponses.has(sessionId)) {
    engagementMetrics.usedResponses.set(sessionId, { educationTemplates: [] });
  }
  engagementMetrics.usedResponses.get(sessionId).educationTemplates = usedTemplates;
  
  return template
    .replace('{degree}', knowledgeBase.education.degree)
    .replace('{university}', knowledgeBase.education.university)
    .replace('{year}', knowledgeBase.education.graduationYear)
    .replace('{gpa}', knowledgeBase.education.cgpa);
}

// Generate knowledge-based responses connecting different topics
function generateKnowledgeResponse(sessionId, currentTopic, context) {
  // Map of topics and their connections
  const bridgeTopics = {
    "project": ["skills", "experience", "education"],
    "skills": ["projects", "experience", "education"],
    "experience": ["projects", "skills", "education"],
    "education": ["projects", "skills", "experience"]
  };
  
  // Get related topics for knowledge bridging
  const relatedTopics = bridgeTopics[currentTopic] || [];
  const randomTopic = relatedTopics[Math.floor(Math.random() * relatedTopics.length)];
  
  // Get personality adjustments or use base traits
  const personality = context.personalityAdjustments || knowledgeBase.personality.traits;
  
  // Personality-based response modifiers
  const enthusiasmMod = personality.enthusiasm || 5;
  const style = knowledgeBase.personality.responseStyles[
    Math.floor(Math.random() * knowledgeBase.personality.responseStyles.length)
  ];
  
  // Response frameworks based on style
  const responseFrameworks = {
    insightful: `This connects to {relatedTopic} where {insight}`,
    concise: `Related to this: {keyPoint}`,
    detailed: `Let me expand: {detail}. This relates to {relatedTopic} because {connection}`,
    analogical: `Think of it like {analogy}. Similarly in {relatedTopic}, {parallel}`,
    storytelling: `That reminds me when {story}. This experience helped with {relatedTopic} through {lesson}`
  };
  
  let framework = responseFrameworks[style];
  
  // Enthusiasm modifiers
  const enthusiasmPhrases = [
    "",
    "Interestingly, ",
    "Fascinatingly, ",
    "Excitingly, ",
    "Remarkably, "
  ];
  
  const enthusiasmLevel = Math.min(Math.floor(enthusiasmMod / 2), 4);
  const introPhrase = enthusiasmPhrases[enthusiasmLevel];
  
  // Knowledge elements for response generation
  const insights = [
    "optimization techniques can be applied across domains",
    "the core problem-solving approach remains consistent",
    "this demonstrates transferable skills in action",
    "the underlying principles connect different technical domains"
  ];
  
  const connections = {
    "project-skills": "the technical capabilities developed were essential",
    "project-experience": "professional experience provided valuable context",
    "skills-education": "academic foundations enabled skill development",
    "education-projects": "theoretical knowledge was applied practically"
  };
  
  const keyPoint = knowledgeBase.conversations[
    Math.floor(Math.random() * knowledgeBase.conversations.length)
  ];
  
  // Select random elements based on topic
  let detail = "";
  if (currentTopic === "project") {
    const project = knowledgeBase.projects[
      Math.floor(Math.random() * knowledgeBase.projects.length)
    ];
    detail = `the ${project.name} project ${project.description}`;
  } else if (currentTopic === "skills") {
    const skillType = Object.keys(knowledgeBase.skills)[
      Math.floor(Math.random() * Object.keys(knowledgeBase.skills).length)
    ];
    detail = `${skillType} skills like ${knowledgeBase.skills[skillType].slice(0, 2).join(', ')}`;
  }
  
  // Specialties mapping
  const specialties = {
    "React": "UI development",
    "Node.js": "backend architecture",
    "Python": "data solutions",
    "Express": "API development",
    "MongoDB": "database design",
    "OpenCV": "computer vision",
    "IoT Sensors": "hardware integration"
  };
  
  // Generate specialty based on project technologies
  let specialty = "";
  if (currentTopic === "project") {
    const project = knowledgeBase.projects[
      Math.floor(Math.random() * knowledgeBase.projects.length)
    ];
    specialty = project.technologies.map(t => specialties[t] || t)
      .slice(0, 1)
      .join(' ');
  }
  
  // Construct response
  let response = framework
    .replace('{insight}', insights[Math.floor(Math.random() * insights.length)])
    .replace('{keyPoint}', keyPoint)
    .replace('{detail}', detail)
    .replace('{relatedTopic}', randomTopic)
    .replace('{connection}', connections[`${currentTopic}-${randomTopic}`] || 'they share common technical foundations')
    .replace('{analogy}', 'building with LEGO blocks')
    .replace('{parallel}', 'careful planning creates stable structures')
    .replace('{story}', 'Dev worked on a complex system integration challenge')
    .replace('{lesson}', 'the importance of modular design')
    .replace('{specialty}', specialty);
  
  return introPhrase + response;
}

// Track engagement metrics
function trackEngagement(sessionId, topic, quality = 1) {
  engagementMetrics.totalInteractions++;
  
  if (!conversationMemory.has(sessionId)) {
    engagementMetrics.sessionCount++;
  }
  
  // Track popular topics
  const count = engagementMetrics.popularTopics.get(topic) || 0;
  engagementMetrics.popularTopics.set(topic, count + 1);
  
  // Track response quality
  if (quality !== 1) {
    const current = engagementMetrics.responseQuality.get(topic) || { total: 0, sum: 0 };
    engagementMetrics.responseQuality.set(topic, {
      total: current.total + 1,
      sum: current.sum + quality
    });
  }
}

// Get average quality for a topic
function getTopicQuality(topic) {
  const data = engagementMetrics.responseQuality.get(topic);
  if (!data || data.total === 0) return 3; // Default to neutral rating
  return data.sum / data.total;
}

// Get a unique response from array
function getUniqueResponse(responses, sessionId, type) {
  if (!responses || responses.length === 0) return null;
  
  // Get or create used responses tracker for this type
  const sessionResponses = engagementMetrics.usedResponses.get(sessionId) || {};
  const usedResponses = sessionResponses[type] || [];
  
  // Filter out used responses
  const availableResponses = responses.filter(
    r => !usedResponses.includes(r)
  );
  
  let selectedResponse;
  
  if (availableResponses.length > 0) {
    // Select a random unused response
    selectedResponse = availableResponses[
      Math.floor(Math.random() * availableResponses.length)
    ];
  } else {
    // All responses used, reset and select random
    selectedResponse = responses[
      Math.floor(Math.random() * responses.length)
    ];
    usedResponses.length = 0; // Reset
  }
  
  // Track used response
  usedResponses.push(selectedResponse);
  sessionResponses[type] = usedResponses;
  engagementMetrics.usedResponses.set(sessionId, sessionResponses);
  
  return selectedResponse;
}

// Enhanced AI Chatbot endpoint with knowledge generation and learning
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;
    if (!message) return res.status(400).json({ reply: "Empty message received" });
    
    // Get or create context for this session
    const context = conversationMemory.get(sessionId) || { 
      history: [],
      lastTopic: null,
      engagement: 0, // Engagement score (0-10)
      sentiment: 0,  // Sentiment tracking (-5 to 5)
      lastProject: null,
      lastSkill: null,
      lastExperience: null,
      interactionCount: 0,
      conversationDepth: 0, // Track conversation depth on topic
      personalityAdjustments: engagementMetrics.personalityAdjustments.get(sessionId) || 
        {...knowledgeBase.personality.traits}, // Start with base personality
      unansweredQuestions: []
    };
    
    context.interactionCount++;
    context.conversationDepth++;
    
    // Update engagement based on message length and complexity
    const wordCount = message.split(/\s+/).length;
    const complexity = wordCount > 8 ? 2 : wordCount > 4 ? 1 : 0.5;
    context.engagement = Math.min(10, context.engagement + complexity);
    trackEngagement(sessionId, "message", 1);
    
    // Get response from NLP model
    const response = await manager.process('en', message);
    
    let reply = "";
    let topic = "general";
    
    // Confident NLP response
    if (response.intent !== 'None' && response.score > 0.7) {
      // Get unique response from possible answers
      if (response.answer && Array.isArray(response.answer)) {
        reply = getUniqueResponse(response.answer, sessionId, response.intent);
      } else {
        reply = response.answer;
      }
      
      // Store context
      context.lastTopic = response.intent;
      topic = response.intent;
      
      // Handle generative intents
      if (response.intent === 'project.list') {
        const projects = knowledgeBase.projects.map(p => p.name).join(', ');
        reply = getUniqueResponse(knowledgeBase.qna.projects, sessionId, 'projectList') || 
          `Dev has built several projects including: ${projects}. Which one interests you most?`;
      }
      else if (response.intent === 'project.detail') {
        const project = knowledgeBase.projects[
          Math.floor(Math.random() * knowledgeBase.projects.length)
        ];
        context.lastProject = project;
        reply = generateProjectDetail(project, sessionId);
      }
      else if (response.intent === 'skill.detail') {
        context.lastSkill = knowledgeBase.skills.frontend[0];
        reply = generateSkillHighlight(sessionId);
      }
      else if (response.intent === 'experience.detail') {
        const exp = knowledgeBase.experience[
          Math.floor(Math.random() * knowledgeBase.experience.length)
        ];
        context.lastExperience = exp;
        reply = generateExperienceDetail(exp, sessionId);
      }
      else if (response.intent === 'education.detail') {
        reply = generateEducationDetail(sessionId);
      }
    } else {
      // Check for follow-up questions
      if (context.lastTopic && /tell me more|what else|continue|elaborate|go on/i.test(message)) {
        // Get a unique conversational response related to the last topic
        topic = context.lastTopic.split('.')[0];
        const topicResponses = knowledgeBase.conversations.filter(
          resp => resp.toLowerCase().includes(topic)
        );
        
        if (topicResponses.length > 0) {
          reply = getUniqueResponse(topicResponses, sessionId, 'followUp') || 
            topicResponses[Math.floor(Math.random() * topicResponses.length)];
        }
      }
      
      // Fallback: Enhanced generative approach
      if (!reply) {
        const fallbackResponse = "I'm not sure about that. For more specific questions, email devshah4956@gmail.com";
        const lowerMessage = message.toLowerCase();
        
        // 1. Check Q&A knowledge base
        for (const [question, answers] of Object.entries(knowledgeBase.qna)) {
          if (lowerMessage.includes(question)) {
            reply = Array.isArray(answers) ? 
              answers[Math.floor(Math.random() * answers.length)] : 
              answers;
            break;
          }
        }
        
        // 2. Context-based matching (enhanced)
        if (!reply) {
          const contextMap = {
            'work|job|experience|company': () => {
              const exp = knowledgeBase.experience[
                Math.floor(Math.random() * knowledgeBase.experience.length)
              ];
              return `At ${exp.company}, Dev worked as ${exp.position} focusing on ${exp.responsibilities[0].toLowerCase()}`;
            },
            'skill|tech|technology|stack': () => {
              const skills = [
                ...knowledgeBase.skills.frontend.slice(0, 2),
                ...knowledgeBase.skills.backend.slice(0, 1)
              ];
              return `Dev's technical skills include ${skills.join(', ')}, and he's constantly learning new technologies`;
            },
            'project|portfolio|app|application': () => {
              const project = knowledgeBase.projects[
                Math.floor(Math.random() * knowledgeBase.projects.length)
              ];
              return `The ${project.name} project showcases Dev's ability to ${project.description.toLowerCase()}`;
            },
            'contact|email|reach|connect': () => 
              `Connect with Dev via email (${knowledgeBase.contact.email}), GitHub (${knowledgeBase.contact.github}), or LinkedIn (${knowledgeBase.contact.linkedin})`,
            'resume|cv': () => 
              "Dev's resume is available on his portfolio site. He's open to new opportunities!",
            'education|school|college|degree': () => 
              `Dev earned his ${knowledgeBase.education.degree} from ${knowledgeBase.education.university}, graduating in ${knowledgeBase.education.graduationYear}`
          };
          
          for (const [pattern, generator] of Object.entries(contextMap)) {
            if (new RegExp(pattern).test(lowerMessage)) {
              // Store context for follow-up
              context.lastTopic = pattern.split('|')[0];
              reply = generator();
              break;
            }
          }
        }
        
        // 3. Try to generate a relevant response from conversational data
        if (!reply) {
          const keywords = tokenizer.tokenize(lowerMessage).filter(word => word.length > 3);
          if (keywords.length > 0) {
            // Find responses containing any of the keywords
            const relevantResponses = knowledgeBase.conversations.filter(response => 
              keywords.some(keyword => response.toLowerCase().includes(keyword))
            );
            
            if (relevantResponses.length > 0) {
              reply = relevantResponses[
                Math.floor(Math.random() * relevantResponses.length)
              ];
            }
          }
        }
        
        // 4. Check generated insights and learned facts
        if (!reply) {
          const tokens = tokenizer.tokenize(message.toLowerCase());
          let bestInsight = null;
          let bestScore = 0;
          
          // Search generated insights
          knowledgeBase.generatedInsights.forEach(insight => {
            const insightTokens = tokenizer.tokenize(insight.question.toLowerCase());
            const common = tokens.filter(t => insightTokens.includes(t)).length;
            if (common > bestScore) {
              bestScore = common;
              bestInsight = insight;
            }
          });
          
          // Search learned facts
          if (!bestInsight) {
            for (const [factQuestion, factAnswer] of Object.entries(knowledgeBase.learnedFacts)) {
              if (message.toLowerCase().includes(factQuestion.toLowerCase())) {
                bestInsight = { response: factAnswer };
                break;
              }
            }
          }
          
          // Search concept graph
          if (!bestInsight) {
            Object.entries(knowledgeBase.conceptGraph).forEach(([concept, connections]) => {
              if (message.toLowerCase().includes(concept.toLowerCase())) {
                reply = `I've learned that ${concept} relates to: ${connections.slice(0, 3).join(', ')}. ` +
                        `Would you like more details about any of these?`;
              }
            });
          }
          
          if (bestInsight) {
            reply = bestInsight.response;
          }
        }
        
        // 5. Final fallback - store as unanswered question
        if (!reply) {
          reply = "I'm still learning about that. I've noted your question and will try to provide a better answer in the future!";
          
          // Store unanswered question
          if (!context.unansweredQuestions.includes(message) && 
              !knowledgeBase.unansweredQuestions.some(q => q.question === message)) {
            knowledgeBase.unansweredQuestions.push({
              question: message,
              sessionId,
              timestamp: new Date().toISOString()
            });
            saveKnowledge();
            context.unansweredQuestions.push(message);
          }
        }
      }
    }
    
    // Add knowledge generation for high engagement conversations
    if (context.engagement > 4 && context.conversationDepth > 1) {
      const currentTopic = context.lastTopic ? context.lastTopic.split('.')[0] : 'general';
      const knowledgeResponse = generateKnowledgeResponse(sessionId, currentTopic, context);
      
      // Blend with existing response
      const blendFormats = [
        `${reply}. ${knowledgeResponse}`,
        `${reply} - which connects to ${knowledgeResponse}`,
        `${reply}. Expanding on this, ${knowledgeResponse}`
      ];
      
      reply = blendFormats[Math.floor(Math.random() * blendFormats.length)];
    }
    
    // Update context
    context.history.push({user: message, bot: reply});
    conversationMemory.set(sessionId, context);
    
    // Track engagement for this topic
    trackEngagement(sessionId, topic);
    
    res.json({ reply });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      reply: "I'm having technical difficulties. Please email devshah4956@gmail.com"
    });
  }
});

// Feedback endpoint to improve responses and store knowledge
app.post("/api/feedback", (req, res) => {
  const { sessionId, message, response, rating, feedback } = req.body;
  
  if (!sessionId || !response || rating === undefined) {
    return res.status(400).json({ success: false });
  }
  
  try {
    // Track response quality
    const context = conversationMemory.get(sessionId) || {};
    const topic = context.lastTopic || 'general';
    trackEngagement(sessionId, topic, parseInt(rating));
    
    console.log(`Feedback received: 
      Session: ${sessionId}
      Topic: ${topic}
      Rating: ${rating}/5
      Feedback: ${feedback || 'No additional feedback'}
    `);
    
    // Adjust engagement score based on feedback
    if (context.engagement !== undefined) {
      const adjustment = rating > 3 ? 1 : -1;
      context.engagement = Math.max(0, Math.min(10, context.engagement + adjustment));
      conversationMemory.set(sessionId, context);
    }
    
    // Personality adjustment based on feedback
    if (feedback) {
      const personality = context.personalityAdjustments || {...knowledgeBase.personality.traits};
      
      if (feedback.toLowerCase().includes("enthusiastic")) {
        personality.enthusiasm = Math.min(10, (personality.enthusiasm || 5) + 1);
      } else if (feedback.toLowerCase().includes("too much")) {
        personality.enthusiasm = Math.max(1, (personality.enthusiasm || 5) - 1);
      }
      
      if (feedback.toLowerCase().includes("professional")) {
        personality.professionalism = Math.min(10, (personality.professionalism || 5) + 1);
      }
      
      if (feedback.toLowerCase().includes("detailed")) {
        personality.curiosity = Math.min(10, (personality.curiosity || 5) + 1);
      } else if (feedback.toLowerCase().includes("too long")) {
        personality.curiosity = Math.max(1, (personality.curiosity || 5) - 1);
      }
      
      context.personalityAdjustments = personality;
      engagementMetrics.personalityAdjustments.set(sessionId, personality);
      conversationMemory.set(sessionId, context);
    }
    
    // Store high-quality responses as learned facts
    if (rating >= 4) {
      // Check if this is a novel response
      if (!knowledgeBase.learnedFacts[message] && 
          !Object.values(knowledgeBase.learnedFacts).includes(response)) {
        
        knowledgeBase.learnedFacts[message] = response;
        
        // Add to concept graph
        const concepts = tokenizer.tokenize(message.toLowerCase())
          .filter(word => word.length > 3);
        
        concepts.forEach(concept => {
          if (!knowledgeBase.conceptGraph[concept]) {
            knowledgeBase.conceptGraph[concept] = [];
          }
          
          // Extract key entities from response
          const responseConcepts = tokenizer.tokenize(response.toLowerCase())
            .filter(word => word.length > 3 && !concepts.includes(word));
            
          responseConcepts.forEach(rConcept => {
            if (!knowledgeBase.conceptGraph[concept].includes(rConcept)) {
              knowledgeBase.conceptGraph[concept].push(rConcept);
            }
          });
        });
        
        saveKnowledge();
        
        // Retrain model with new knowledge
        setTimeout(() => {
          trainModel().then(() => console.log('Retrained with new learned fact'));
        }, 5000);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ success: false });
  }
});

// Personality insights endpoint
app.get("/api/personality", (req, res) => {
  try {
    const personalityData = {
      base: knowledgeBase.personality.traits,
      learnedAdjustments: {},
      sessionAdjustments: {}
    };
    
    // Collect learned adjustments across sessions
    for (const [sessionId, traits] of engagementMetrics.personalityAdjustments.entries()) {
      personalityData.learnedAdjustments[sessionId] = traits;
    }
    
    // Collect session-specific adjustments
    for (const [sessionId, context] of conversationMemory.entries()) {
      if (context.personalityAdjustments) {
        personalityData.sessionAdjustments[sessionId] = context.personalityAdjustments;
      }
    }
    
    res.json(personalityData);
  } catch (error) {
    console.error('Personality insights error:', error);
    res.status(500).json({ error: "Failed to retrieve personality data" });
  }
});

// New endpoint to get learning status
app.get("/api/learning-status", (req, res) => {
  res.json({
    generatedInsights: knowledgeBase.generatedInsights.length,
    learnedFacts: Object.keys(knowledgeBase.learnedFacts).length,
    unansweredQuestions: knowledgeBase.unansweredQuestions.length,
    conceptGraphSize: Object.keys(knowledgeBase.conceptGraph).length,
    lastUpdated: new Date().toISOString()
  });
});

// New endpoint to trigger knowledge generation
app.post("/api/generate-knowledge", (req, res) => {
  generateNewKnowledge();
  answerUnansweredQuestions();
  res.json({ 
    status: "Knowledge generation started",
    insights: knowledgeBase.generatedInsights.length,
    facts: Object.keys(knowledgeBase.learnedFacts).length
  });
});

// Start server with knowledge initialization
trainModel().then(() => {
  // Generate initial knowledge
  generateNewKnowledge();
  answerUnansweredQuestions();
  
  // Schedule regular knowledge generation
  setInterval(() => {
    generateNewKnowledge();
    answerUnansweredQuestions();
  }, 24 * 60 * 60 * 1000); // Every 24 hours
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`✅ Allowed origins: ${allowedOrigins.join(',')}`);
    console.log("🤖 Advanced learning chatbot ready");
    console.log("🧠 Knowledge generation system active");
    console.log(`💡 Generated insights: ${knowledgeBase.generatedInsights.length}`);
    console.log(`❓ Unanswered questions: ${knowledgeBase.unansweredQuestions.length}`);
  });
});

// Save knowledge on exit
process.on('SIGINT', () => {
  saveKnowledge();
  process.exit();
});