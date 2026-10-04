# هيام — الطقم الأسود · نسخة Google Flow

نفس الفيديو اللي في `HAYAM-PROMPT-PACK.md` بالظبط (6 لقطات، 15.6 ثانية، 9:16)، بس الشغل كله على **Google Flow**:

| | الأصل (Higgsfield) | دلوقتي (Flow) |
|---|---|---|
| الكي-فريمات | Nano Banana 2 | **Nano Banana 2** جوه Flow |
| الفيديو | Seedance 2.5 · 5 ثواني | **Omni Flash** · **6 ثواني** (Flow بيدّي 4/6/8/10 بس) |
| الريفرانس | Image 1 / Image 2 | **@mentions** جوه برومبت Flow |
| الأتمتة | يدوي | **google-flow-mcp** + `flow-run.mjs` |

## الملفات

| الملف | وظيفته |
|---|---|
| `prompts.json` | البرومبتات الـ10 (5 كي-فريم + 5 كليب) متظبطة على Flow/Omni، كل برومبت سطر واحد (Flow بيبعت لو فيه Enter) |
| `flow-run.mjs` | بيسوق Chrome بتاعك عن طريق الـMCP: يكتب البرومبت، يختار الموديل والمقاس والمدة، يحط الريفرانسات بـ@، ويدوس Generate بعد ما توافق |
| `assemble.ps1` | بيقص الخمس كليبات على إيقاع الريفرانس ويطلّع الماستر 9:16 + 4:5 + 1:1 |
| `claude-mcp.json` | إعداد الـMCP لو عايز Claude Desktop / Claude Code على جهازك يشغّله بنفسه |

ده اللي اتغير في البرومبتات عن الحزمة الأصلية:
- التوقيتات جوه كل كليب اتوزعت على **6 ثواني** بدل 5 (نفس الحركات، نفس الـEnd states).
- `Image 1 / Image 2` بقت "the tracksuit reference" و "the KEY-01 frame"، والريفرانسات نفسها بتتحط كـ @mentions في آخر البرومبت.
- Omni بيطلّع صوت، فالـ `<sound>` بقت سطر `[Sound]` صريح: خشخشة نايلون وسوستة من غير مزيكا ولا كلام.
- سطر `Avoid:` فضل جوه البرومبت لأن Flow مفيهوش خانة Negative.

---

## التجهيز (مرة واحدة · Windows)

```powershell
# 1) الـMCP
cd C:\tools
git clone https://github.com/shaig-mahmudov/google-flow-mcp.git
cd google-flow-mcp
npm install
copy config\flow.config.example.json config\flow.config.json
```
افتح `config\flow.config.json` وعدّل:
```json
"expectedAccount": "vodkaboy97@gmail.com",
"chromeProfile": "Profile 1",
"chromeUserDataDir": "C:/Users/<اسمك>/AppData/Local/Google/Chrome/User Data"
```
> يفضّل تعمل بروفايل Chrome مخصوص (مثلًا FlowBot) وتسجّل فيه بالجيميل مرة واحدة، وتقفل أي نافذة Chrome تانية على نفس البروفايل.

```powershell
# 2) شغّل Chrome بالـCDP وسيبه مفتوح
npm run start-browser
```

```powershell
# 3) حط فولدر الشغل ده جنب الرندرات
#    D:\ai vedio creat\هيام\hayam-flow\   ← الملفات دي
#    D:\ai vedio creat\هيام\renders\      ← هنا هتنزل s1..s5
```

ومحتاج **ffmpeg** على الـPATH عشان `assemble.ps1` (`winget install Gyan.FFmpeg`).

---

## التشغيل

### 0 — جهّز البروجكت في Flow
في نافذة Chrome اللي اتفتحت: افتح Flow ← **New project** باسم `HAYAM - Black Tracksuit` ← ارفع صورة
`Tracksuit_on_white_studio_backgr…_4K.jpg` جوه البروجكت (ممكن تسمّيها `Tracksuit` عشان الـ@ يلاقيها بسهولة).

### أ — الكي-فريمات (Nano Banana 2)
```powershell
cd "D:\ai vedio creat\هيام\hayam-flow"
node flow-run.mjs --mcp "C:\tools\google-flow-mcp" --step keys
```
السكريبت هيعمل كده لكل كي-فريم:
1. يسألك "Generate now?" ← `y`
2. يكتب البرومبت، يختار Nano Banana 2 و9:16 وصورتين، ويحط `@Tracksuit` (و`@KEY-01` من KEY-02 لحد KEY-05)
3. يدوس Generate ويستنى الصور
4. يسألك عن اسم الصورة اللي اخترتها ← **سمّيها في Flow `KEY-01`… `KEY-05`** واضغط Enter

> **اعتمد KEY-01 الأول.** هو مرجع الحيطة والرخام والإضاءة للأربعة الباقيين. لو مش عاجبك: `--only KEY-01` وعيده لوحده.
> **قبل ما تكمل:** حط الخمسة جنب بعض: نفس الحيطة، نفس الرخام، نفس اتجاه الضوء، نفس درجة السواد، والساعة على نفس الإيد.

### ب — الكليبات (Omni Flash)
```powershell
node flow-run.mjs --mcp "C:\tools\google-flow-mcp" --step clips
```
لكل كليب: يختار Omni Flash و9:16 و6s وتيكين، يحط `@KEY-0N`، ويوريك الشاشة. تكتب `y` فيدوس Generate.
لما يخلص اختار أحسن تيك ← **Download** ← احفظه في `renders\s1.mp4` … `s5.mp4` ← Enter.

**لو كليب طلع إيده مكسورة:** عيده لوحده:
```powershell
node flow-run.mjs --mcp "C:\tools\google-flow-mcp" --step clips --only s3
```

> **لو Flow عارضلك "Start frame / Frames to video" مع Omni**: حط الكي-فريم هناك كفريم أول بدل الـ@. ده بيقفل اللقطة أكتر. السكريبت بيستخدم الـ@ لأنه الطريقة اللي الـMCP بيدعمها.

### ج — المونتاج
```powershell
.\assemble.ps1              # فيديو بس (المزيكا في CapCut)
.\assemble.ps1 -KeepAudio   # يسيب صوت النايلون والسوستة اللي Omni طلّعه
```
| # | من | in | المدة | في الماستر |
|---|---|---|---|---|
| 1 | s1 | 0.4 | 2.8 | 0.0 – 2.8 |
| 2 | s2 | 0.3 | 2.8 | 2.8 – 5.6 |
| 3 | s3 | 0.4 | 2.8 | 5.6 – 8.4 |
| 4 | s4 | 0.3 | 2.8 | 8.4 – 11.2 |
| 5 | s5 | 0.4 | 2.8 | 11.2 – 14.0 |
| 6 | s1 (الديل) | 4.4 | 1.6 | 14.0 – 15.6 |

بيطلّع `HAYAM_master_9x16.mp4` (1080×1920، 30fps) + `HAYAM_4x5.mp4` + `HAYAM_1x1.mp4` في `renders\`.
نقط القص دي مبدئية. بعد ما تشوف التيكات عدّل الـin في أول `assemble.ps1` عشان القطع ييجي **جوه الحركة** زي الريفرانس.

---

## بديل: Claude على جهازك يشغّل الـMCP بنفسه

حط محتوى `claude-mcp.json` في `claude_desktop_config.json` (أو `.mcp.json` لو Claude Code)، بعد ما تعدّل المسار. وبعدين قوله:

> استخدم Google-Flow. اعمل flow_connect وبعده flow_account_check. افتح بروجكت HAYAM. اقرا `hayam-flow\prompts.json`، وولّد الـkeys بـflow_generate_image (Nano Banana 2، 9:16، auto_confirm=true، ingredients = refs). استنى موافقتي على KEY-01 قبل الباقي. بعد كده جهّز كل clip بـflow_generate_video (Omni Flash، 9:16، duration "6s"، ingredients = [KEY-0N]).

**ملاحظة:** أداة الفيديو في الـMCP بتوقف قبل زرار Generate عمدًا (عشان الكريديت)، فهتدوسه إنت. `flow-run.mjs` بيدوسه بعد ما تكتب `y`.

## حدود لازم تعرفها
- الـMCP **مش بيرفع صور** للصور والفيديو (`reference_images` موجودة في الـschema بس مش متنفذة). عشان كده صورة الطقم بترفعها إنت مرة واحدة في البروجكت، وكل حاجة بعد كده بتتشاور عليها بـ@.
- الـMCP بيشتغل على أسماء العناصر في واجهة Flow، فلو جوجل غيّر الواجهة ممكن خطوة تقف. ساعتها كمّل الخطوة دي يدوي بنفس البرومبت من `prompts.json` والسكريبت يكمل بعدها.
