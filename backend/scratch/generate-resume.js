const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument();
const outputPath = path.join(__dirname, '../sample_resume.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Add content
doc.fontSize(25).text('Alex Rivera', { align: 'center' });
doc.fontSize(12).text('Senior Full Stack Engineer', { align: 'center' });
doc.moveDown();

doc.fontSize(14).text('Summary', { underline: true });
doc.fontSize(10).text('Innovative Full Stack Engineer with 8+ years of experience building scalable web applications. Expert in React, Node.js, and Cloud Infrastructure.');
doc.moveDown();

doc.fontSize(14).text('Technical Skills', { underline: true });
doc.fontSize(10).text('• Languages: JavaScript, TypeScript, Python, Go, Rust');
doc.text('• Frontend: React, Next.js, TailwindCSS, Redux');
doc.text('• Backend: Node.js, Express, NestJS, PostgreSQL, MongoDB');
doc.text('• DevOps: Docker, Kubernetes, AWS, GitHub Actions, Terraform');
doc.moveDown();

doc.fontSize(14).text('Experience', { underline: true });
doc.fontSize(12).text('Senior Software Engineer | TechFlow Corp (2020 - Present)');
doc.fontSize(10).text('• Led the migration of a legacy monolithic app to a microservices architecture using Node.js and Docker.');
doc.text('• Improved system performance by 40% through advanced caching strategies with Redis.');
doc.text('• Mentored 5 junior developers and implemented a new CI/CD pipeline reducing deployment time by 50%.');
doc.moveDown();

doc.fontSize(12).text('Software Engineer | InnovateAI (2017 - 2020)');
doc.fontSize(10).text('• Developed responsive user interfaces using React and TailwindCSS for a high-traffic SaaS platform.');
doc.text('• Built real-time collaboration features using WebSockets and Redis Pub/Sub.');
doc.moveDown();

doc.fontSize(14).text('Soft Skills', { underline: true });
doc.fontSize(10).text('Leadership, Communication, Problem Solving, Agile Methodologies, Mentoring.');

doc.end();

console.log(`✅ Sample PDF resume generated at: ${outputPath}`);
