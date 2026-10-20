export const chapters = [
  {
    title: "小小的日常",
    subtitle: "从最近一件开心的事开始",
    color: "sage",
    questions: [
      {
        id: "joy",
        who: "child",
        title: "最近有什么事，让你开心得不想停下来？",
        hint: "可以是很小的事：一只虫子、一场游戏，或一个只有你知道的发现。",
        tip: "先听完。可以问“后来呢？”，先不评价这件事有没有用。",
      },
      {
        id: "curiosity",
        who: "child",
        title: "如果明天有一整天，可以做任何事，你想怎么过？",
        hint: "不赶时间，也不用做得很好。你想从哪件事开始？",
        tip: "让孩子自己安排。留意他为什么喜欢，而不急着联想到特长或职业。",
      },
    ],
  },
  {
    title: "心里的天气",
    subtitle: "每一种感受，都可以被好好听见",
    color: "blue",
    questions: [
      {
        id: "feelings",
        who: "child",
        title: "有点难过或生气的时候，你希望身边的人怎么陪你？",
        hint: "想抱抱、安静一会儿，还是一起想办法？也可以有自己的答案。",
        tip: "不要求孩子解释所有情绪。可以先说“我想了解你希望我怎么做”。",
      },
      {
        id: "together",
        who: "child",
        title: "和别人一起玩的时候，你最喜欢大家一起做什么？",
        hint: "也可以聊聊自己一个人玩的时候，有什么很棒的地方。",
        tip: "独处和一起玩都很好，不把答案变成内向或外向的标签。",
      },
    ],
  },
  {
    title: "如果世界听你的",
    subtitle: "给想象留一扇很大的窗",
    color: "peach",
    questions: [
      {
        id: "dream",
        who: "child",
        title: "如果可以造一个自己的小世界，里面会有什么？",
        hint: "一间树屋、一座动物医院、一颗会发光的星球……你说了算。",
        tip: "顺着他的画面走：“谁会在那里？你们会做什么？” 不急着纠正不现实。",
      },
      {
        id: "try",
        who: "child",
        title: "有什么事，你还不太会，但很想试试看？",
        hint: "可以很小，也可以很奇怪。不知道也完全没关系。",
        tip: "可以问“你想我怎么帮你？”。避免用答案安排训练计划。",
      },
    ],
  },
  {
    title: "爱是你的底气",
    subtitle: "这一页，请家长慢慢写",
    color: "yellow",
    questions: [
      {
        id: "support",
        who: "guardian",
        title: "当孩子想探索这些事，你愿意给他怎样的支持？",
        hint: "一段不被打扰的时间、一次一起尝试，或允许他改变主意。写一件你真能做到的小事。",
        tip: "区分“我希望他成为……”和“我愿意为他做……”。只写愿意兑现的支持。",
      },
      {
        id: "letter",
        who: "guardian",
        title: "写给长大后的孩子：有些话，想替今天的你留住。",
        hint: "可以写此刻看见的他、想记住的小事，以及不以成绩为条件的爱。",
        tip: "这是家长的心声。孩子不需要回应你的期许，也不需要承担让大人幸福的责任。",
      },
    ],
  },
];
export const allQuestions = chapters.flatMap((c, chapter) =>
  c.questions.map((q) => ({ ...q, chapter })),
);
