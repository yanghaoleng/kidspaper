import { z } from 'zod';
export const profileSchema = z.object({ nickname: z.string().trim().min(1).max(16), age: z.enum(['4–6 岁','7–8 岁','9–10 岁']), guardian: z.enum(['妈妈','爸爸','家人 / 监护人']) });
export const answerSchema = z.object({ id:z.string().min(1).max(80), question:z.string().min(1).max(300), who:z.enum(['child','guardian']), text:z.string().trim().min(1).max(2000) });
export const contextSchema = z.object({ profile:profileSchema, answers:z.array(answerSchema).max(40) });
export const reportSchema = z.object({
 title:z.string().min(1).max(50), subtitle:z.string().min(1).max(150), introduction:z.string().min(1).max(900),
 observations:z.array(z.object({title:z.string().max(35),body:z.string().max(700),evidence:z.array(z.string().max(80)).min(1).max(5),support:z.string().max(500)})).min(2).max(5),
 possibilities:z.array(z.object({title:z.string().max(40),scene:z.string().max(600),connection:z.string().max(400),firstStep:z.string().max(350)})).length(3),
 care:z.array(z.object({title:z.string().max(50),body:z.string().max(600)})).min(2).max(4),
 closing:z.string().max(700)
});
export function checkEvidence(report,answers){const ids=new Set(answers.filter(a=>a.who==='child').map(a=>a.id));return report.observations.every(o=>o.evidence.every(id=>ids.has(id)));}
export const archiveSchema = z.object({ version:z.literal(1), id:z.string().max(80), date:z.string().max(60), profile:profileSchema, answers:z.array(answerSchema).max(40), report:reportSchema.nullable(), images:z.record(z.string().regex(/^[012]$/),z.string().max(16000000).regex(/^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/=\r\n]+$/)).default({}) });
