# 同路人 · 人物场景主图

2026-10-23。首页与样刊主图使用内置 image_gen 绘制，参考本项目亲子版 `public/images/childhood-panorama.webp` 的棉纸、水彩、铅笔与灰蓝/鼠尾草绿风格。网站素材：`public/images/partner-work-world-v1.webp`，1672×941，约285KB。生成原图保留在默认生成目录。

虚构样刊林溪的画像线索：整理零散信息、画出问题地图、交换协作限制、保护专注时间。通过成年主角的活动、工具、花园工作室和协作场景来表达。外貌和环境是概念想象，不还原真实身份。

## 首页主图最终提示词

生成工具：内置 image_gen。参考图仅用于风格与构图。

> Use case: illustration-story / style-transfer. Create one horizontal 16:9 illustrated main scene for the Chinese adult workplace reflection website 同路人 Partner. The supplied image is a STYLE AND COMPOSITION REFERENCE ONLY: match its cream cotton paper, delicate graphite contours, soft transparent watercolor, sage grasses, muted dusty blue foliage, warm rust accents, quiet atmosphere and large airy upper-left negative space. Replace the childhood/family subject with an entirely new ADULT workplace world, not children. This image visualizes the fictional sample professional Lin Xi's evidence-based portrait: a product designer who enjoys connecting scattered information into a clear structure, drawing problem maps, making different collaborators understand one another, and protecting calm focus time. Show ONE clearly adult main character with understated, non-specific appearance, rust cardigan and neutral trousers, seated in a beautiful open garden studio at a wood desk, drawing a problem map on large paper, an open sketchbook and pencils nearby. A short distance to the right, two adult collaborators sit together at a smaller shared worktable exchanging blank sketch papers. Plants, gentle blue-green trees, a small open timber studio shelter, soft rolling distant hills and a winding path connect the scenes into one continuous watercolor landscape. The main person and desk are in the lower-middle, secondary collaboration is in the lower-right; rich coherent scenery across the lower half, broad warm paper sky on upper half and upper-left for HTML headline overlay. Adults must be naturally proportioned, identifiable as adults, small-medium in a wide environment, no caricature heads. Depict capabilities through the activity and objects, no trait labels. No readable text, no typography, no UI, no frames, no charts, no diagram labels, no corporate stock photo gestures, no suits or stage, no logos. Keep desk/person fully inside image, preserve comfortable safe margins, especially lower-middle/right. This is a poetic fictional scene, not a factual photograph or prediction. Match the reference painterly hand-drawn tenderness and sophisticated calm. Render one finished high quality full scene, wide landscape about 1920 by 1080.

## 个人主图

新人物报保存文字后，请求 `/api/work/portrait`：至少四个不同回答，引用须有效；由工作角色、报告画像线索和相关原话组装场景，使用既有方舟生图服务。完整运行时提示词见 `shared/workplace.mjs` 的 `workPortraitPrompt`。

图片与线索说明保存在档案的 `portrait` 字段，随本机与加密文件保存。旧报告可补画，绘制失败保留文字并允许重试。旧版无主图的档案仍可导入。
