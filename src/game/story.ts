import type { Ending, Metrics, StoryEvent } from "./types";

export const initialMetrics: Metrics = {
  resources: 60,
  technology: 40,
  stability: 65,
  legacy: 45,
};

export const metricInfo = {
  resources: {
    label: "资源",
    english: "RESOURCES",
    description: "可用于建设与生存的物资",
  },
  technology: {
    label: "科技",
    english: "TECHNOLOGY",
    description: "文明解决未知问题的能力",
  },
  stability: {
    label: "稳定",
    english: "STABILITY",
    description: "社会对共同未来的信任",
  },
  legacy: {
    label: "传承",
    english: "LEGACY",
    description: "文明记忆与文化的保存程度",
  },
};

export const prologue = {
  year: 2847,
  title: "一百年之后，恒星将不再升起。",
  paragraphs: [
    "2847 年，深空观测阵列捕捉到一组不可能的频谱。三十七座研究站独立复核后，得到同一个结论：我们的恒星将在一百年内发生灾变。没有第二个答案。",
    "一百年。足够一个孩子长大，足够一座城市被遗忘，却不足以让所有人离开。此刻，消息只存在于这间会议室。窗外的城市依旧亮着灯。",
    "你被任命为文明最后一百年的执政官。你无法挽救这颗恒星，但你可以决定：我们如何度过余下的时间，以及让什么抵达时间的另一端。",
  ],
};

export const events: StoryEvent[] = [
  {
    id: "truth",
    year: 2848,
    title: "真相的重量",
    subtitle: "回合一 · 信息与信任",
    paragraphs: [
      "观测结果已经锁入最高级别档案。与此同时，一份未经证实的末日预言正在城市间流传。交易所短暂停摆，学校仍在讲授下一百年的历史。",
      "你面前的公报只有一页。如何说出这件事，将决定人们把未来视为共同的任务，还是一场漫长的恐惧。",
    ],
    advisor: {
      name: "林序",
      role: "首席科学顾问",
      quote: "真相不会因为沉默而消失。但人们需要的，也不只是一个日期。",
    },
    choices: [
      {
        id: "truth-open",
        title: "向所有人公开完整真相",
        description:
          "公布观测数据与倒计时，让公众参与讨论。承受眼前的动荡，换取共同的知情权。",
        delta: { resources: -5, technology: 10, stability: -15, legacy: 10 },
        consequence:
          "公报发布的那一夜，广场上挤满了人。有人愤怒，有人相拥。开放的数据吸引了民间研究者，也让最初的恐慌付出了物资代价。人们第一次知道，自己正在参与文明的最后一章。",
      },
      {
        id: "truth-gradual",
        title: "分阶段公布，建立应对秩序",
        description:
          "先说明危机，再公开时间表；为公众提供可执行的计划。秩序得以维持，但完整记录被延迟。",
        delta: { resources: -5, technology: 5, stability: 5, legacy: -5 },
        consequence:
          "广播先谈应对措施，随后才谈灾变。城市没有停止运转，首批研究计划得到稳定支持。但一部分原始记录被暂时封存，后来的历史学家将不得不拼合这段沉默。",
      },
      {
        id: "truth-secret",
        title: "暂时保密，交由专家处理",
        description:
          "以恒星研究计划为名，集中专家秘密应对。维持日常生活，也把文明的命运交给少数人。",
        delta: { resources: 0, technology: 5, stability: 10, legacy: -20 },
        consequence:
          "公报没有离开会议室。科研团队开始秘密工作，城市仍相信明天与昨天没有不同。平静得以延续，但那些本应属于所有人的证词，被留在了上锁的抽屉里。",
      },
    ],
  },
  {
    id: "scarcity",
    year: 2862,
    title: "稀缺的未来",
    subtitle: "回合二 · 生存与记忆",
    paragraphs: [
      "十四年过去了。新的计算表明，远航船队无法载走所有人。轨道工厂与地面城市争用同一批稀有材料，文明的预算第一次有了清晰的终点。",
      "工程师请求扩建方舟船坞。档案馆请求保存语言、艺术与普通人的一生。两份计划都值得一整个世界，却只有一份预算。",
    ],
    advisor: {
      name: "沈砚",
      role: "资源统筹官",
      quote:
        "每一吨钢都有两个去处：成为一艘船的骨架，或保护一段不会再发生的生活。",
    },
    choices: [
      {
        id: "scarcity-ark",
        title: "优先投入方舟工程",
        description:
          "将物资集中于推进技术与船坞，争取远航的机会。地面配给收紧，文化保存被推迟。",
        delta: { resources: -20, technology: 25, stability: -10, legacy: -5 },
        consequence:
          "轨道船坞第一次亮起整圈灯光。推进器测试取得突破，地面居民却开始排队领取更少的配给。方舟越来越真实，留下的人也越来越清楚自己的位置。",
      },
      {
        id: "scarcity-book",
        title: "优先建立文明档案",
        description:
          "保存知识、生态样本与个人记忆，让每个人被记住。远航技术的进展将放缓。",
        delta: { resources: -10, technology: 5, stability: 5, legacy: 25 },
        consequence:
          "遍布城市的记录站开始接收故事。一首方言童谣、一份食谱、一张家庭照片，都获得了永久编号。档案压缩技术有所进展，方舟船坞的建设却不得不等待。",
      },
      {
        id: "scarcity-balance",
        title: "让远航与档案共同推进",
        description:
          "建立两条有限的建设线，保留生存与传承的可能。两项计划都需要后续支持才能成熟。",
        delta: { resources: -15, technology: 15, stability: 0, legacy: 10 },
        consequence:
          "预算被分成两半。船坞与档案馆共享基础设施，进展缓慢，却没有任何一方被放弃。这是一份保留可能性的决定，也让下一次资源调配变得更加关键。",
      },
    ],
  },
  {
    id: "fracture",
    year: 2889,
    title: "第一道裂痕",
    subtitle: "回合三 · 分歧与共同体",
    paragraphs: [
      "距离灾变还有五十八年。关于谁能够登船、谁应当留下的争论，已经越过议事厅的门槛。外环城市宣布停止向中央交付物资，广场上的标语写着：未来不属于少数人。",
      "没有足够的时间让每一道裂痕自然愈合。你必须决定，文明在终点之前，是否还能以同一个名字前行。",
    ],
    advisor: {
      name: "周遥",
      role: "公民议会代表",
      quote: "我们争论的不只是席位。我们想知道，留下的人是否仍然属于这个文明。",
    },
    choices: [
      {
        id: "fracture-assembly",
        title: "召开公民议会，重建共识",
        description:
          "公开席位与配给规则，让各地代表共同决议。投入剩余资源，换取信任与共同记忆。",
        delta: { resources: -5, technology: 5, stability: 15, legacy: 10 },
        consequence:
          "议会持续了四十七天。规则没有让每个人满意，却终于让每个人可以发言。补偿计划消耗了最后一批储备，争论与和解则一同被写进了文明档案。",
      },
      {
        id: "fracture-control",
        title: "集中权力，强制推进计划",
        description:
          "以紧急法令统一生产和科研，保住工程速度。社会信任与地方记忆将承受损失。",
        delta: { resources: 0, technology: 10, stability: -20, legacy: -10 },
        consequence:
          "紧急法令恢复了工厂的运转。工程进度迅速追上时间表，外环的沉默却比抗议更深。被取消的地方记录与被压下的声音，留下了无法计算的空白。",
      },
      {
        id: "fracture-pact",
        title: "签订自治契约，交换资源",
        description:
          "允许外环自行分配部分席位，换取物资与研究协作。中央协调变弱，文明得以继续合作。",
        delta: { resources: 15, technology: 5, stability: -5, legacy: 5 },
        consequence:
          "中央与外环签下了第一份自治契约。运输线重新开放，地方实验室加入联合研究。文明不再整齐划一，但它的各个部分仍愿意互相递出一只手。",
      },
    ],
  },
];

export const arkRequirements: Pick<
  Metrics,
  "resources" | "technology" | "stability"
> = { resources: 50, technology: 65, stability: 45 };

export const endings: Record<Ending["id"], Ending> = {
  ark: {
    id: "ark",
    title: "方舟计划",
    subtitle: "测试结局 01 · 将余晖带向群星",
    paragraphs: [
      "2947 年，最后一艘方舟离开轨道。它的舷窗映着恒星渐渐失真的光，船上没有人知道，下一次日出会属于哪一颗星球。",
      "你留下的资源足以支撑远航，科技跨过了深空航行的门槛，而社会仍愿意履行共同的契约。人类的一部分得以出发。并非所有人都登上了船，这份成功始终带着重量。",
      "启航前，船员将地面传来的最后一段声音编入导航信标。那不是命令，也不是坐标。那是有人在说：记得我们。",
    ],
    lastLine: "我们没有带走整个世界。但世界的一部分，仍在前行。",
  },
  book: {
    id: "book",
    title: "文明之书",
    subtitle: "测试结局 02 · 让曾经存在成为永恒",
    paragraphs: [
      "2947 年，完整的远航条件未能同时达成。人们把最后的时光转向记录：为每一座城市编写索引，为每一种语言保留声音，为普通人的生活留下位置。",
      "封存舱与无人信标承载着这部文明之书。它不是逃生船，也不承诺一定会有读者。它只证明，这里曾有人建造、争论、爱与告别。",
      "最后一页没有写下你的名字。它留给了一位孩子的画：一颗金色的恒星，下方站着许多牵手的人。",
    ],
    lastLine: "如果有人翻开这一页，请知道：我们曾在这里。",
  },
};
