import { z } from "zod";
import {
  workContextSchema,
  workReportSchema,
  workFoundation,
  workReportPrompt,
  checkWorkEvidence,
} from "../shared/workplace.mjs";

export function registerWorkplace(app, { prefix, session, route, chat }) {
  app.post(
    prefix + "/api/work/followup",
    session,
    route(async (req, res) => {
      const input = workContextSchema
        .refine((x) => x.answers.length > 0)
        .parse(req.body);
      const result = z
        .object({
          reflection: z.string().min(1).max(500),
          question: z.string().min(1).max(300),
        })
        .parse(
          await chat(
            `${workFoundation}\n回应最后一条回答，提到用户实际说过的具体内容，再提出一个开放问题，帮助厘清事实、个人贡献、限制或选择。不要重复主问题，不提是非题或“是A还是B”的二选一问题。只返回JSON {"reflection":"不超过80字","question":"不超过60字的一个问题"}。`,
            { profile: input.profile, answer: input.answers.at(-1) },
            true,
            700,
          ),
        );
      result.question = result.question.split(/[？?]/)[0].trim() + "？";
      if (/吗[？?]?$|是不是|有没有|是.{0,40}还是/.test(result.question))
        result.question =
          "这段经历里，你最想在下一次继续保留或调整的具体做法是什么？";
      res.json(result);
    }),
  );
  app.post(
    prefix + "/api/work/report",
    session,
    route(async (req, res) => {
      const input = workContextSchema.parse(req.body);
      if (input.answers.length < 4)
        return res
          .status(400)
          .json({ error: "至少留下四个不同问题的回答，再来编排这一期。" });
      const report = workReportSchema.parse(
        await chat(workReportPrompt, input, true, 6000),
      );
      if (!checkWorkEvidence(report, input.answers))
        throw new Error("invalid_work_evidence");
      res.json({ report });
    }),
  );
  app.post(
    prefix + "/api/work/memory",
    session,
    route(async (req, res) => {
      const input = workContextSchema
        .extend({
          messages: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string().trim().min(1).max(1500),
              }),
            )
            .min(1)
            .max(16),
        })
        .parse(req.body);
      const text = await chat(
        `${workFoundation}\n担任私人复盘档案的导览员，只引用这份档案和用户当前明确补充的内容。未记录的事直接说明没有记录。不要把建议当成已完成的事实。回答100至220字，最后至多一个开放问题。`,
        input,
        false,
        1100,
      );
      res.json({ text });
    }),
  );
}
