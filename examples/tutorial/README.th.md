# ตัวอย่าง: วิดีโอสอนการใช้งาน code-motion

[English](README.md) | [ไทย](README.th.md)

วิดีโอสอนการใช้งานความยาว 34 วินาที (ภาษาไทย) เกี่ยวกับสกิล `/code-motion` สร้างขึ้นด้วยตัวสกิลเองในสไตล์ [Manga Page](https://www.futurepedia.io/resources/ai-style-atlas/view) โดยมี 2 ขนาด:

| รหัส Composition      | ขนาด      | ผลลัพธ์                      |
| ------------------- | --------- | ---------------------------- |
| `tutorial`          | 1280×720  | `out/tutorial.mp4`           |
| `tutorial-vertical` | 1080×1920 | `out/tutorial-vertical.mp4`  |

## วิธีการเรนเดอร์

ไฟล์สไตล์ Manga Page เป็นลิขสิทธิ์ของ Futurepedia จึงไม่ได้รวมอยู่ใน Repository นี้ คุณต้องนำไฟล์ออกมาจากพรอมต์ก่อน:

1. เปิด [AI Style Atlas](https://www.futurepedia.io/resources/ai-style-atlas/view) เลือก **Manga Page** จากนั้นคัดลอกพรอมต์และบันทึกไว้ที่ `prompts/manga-page.md`
2. ติดตั้ง Dependencies และสกัดไฟล์สไตล์:

   ```bash
   bun install
   bun run setup-style prompts/manga-page.md   # จะเขียนไฟล์ src/lib/harness.js, src/lib/sound.js, src/style/manga.js
   ```

3. พรีวิวหรือสั่งเรนเดอร์:

   ```bash
   bun run render tutorial --audio   # สร้างไฟล์เสียงสำหรับ Remotion Studio
   bun run studio                    # เปิดที่ http://localhost:3000
   bun run render tutorial           # out/tutorial.mp4
   bun run render tutorial-vertical  # out/tutorial-vertical.mp4
   ```

`prompts/`, `src/lib/` และ `src/style/` ถูกระบุไว้ใน `.gitignore` ดังนั้นไฟล์สไตล์จะไม่ถูก Commit ลงใน Git

## โครงสร้างและการทำงาน

| เส้นทาง (Path)                        | รายละเอียด (What)                                                     |
| ------------------------------------ | -------------------------------------------------------------------- |
| `src/videos/tutorial/timing.js`      | เวลาเริ่มของแต่ละหน้าและการเปิดหน้า ใช้ร่วมกันทั้งภาพและเสียง |
| `src/videos/tutorial/visuals.js`     | หน้ามังงะ 5 หน้า, เอฟเฟกต์เปิดหน้า, และการจัดวางช่องสำหรับขนาด 9:16       |
| `src/videos/tutorial/score.js`       | เสียงเอฟเฟกต์ทั้งหมด สอดคล้องกับจังหวะเวลาของภาพพอดี                   |
| `src/videos/tutorial/vertical.js`    | ลงทะเบียน `tutorial-vertical` ด้วย Canvas ขนาด 1080×1920              |
| `scripts/render.ts`                  | เรนเดอร์ WAV ตามด้วย MP4 (หากใส่ออปชัน `--audio` จะสร้างเฉพาะ WAV)     |
| `scripts/stills.ts`                  | บันทึกภาพนิ่ง PNG ตามเวลาที่กำหนด สำหรับสตอรี่บอร์ดและการตรวจสอบ       |
| `scripts/voiceover.ts`               | สร้างเสียงบรรยายทีละจังหวะจาก `narration.json` เป็น `public/<id>-voice.mp3` |
| `scripts/setup-style.ts`             | สกัดไฟล์สไตล์ของบุคคลที่สามออกจากไฟล์พรอมต์                          |
| `public/fonts/`                      | ฟอนต์ในตัว (Self-hosted) และสัญญาอนุญาต OFL                           |

ฟอนต์ดั้งเดิมของสไตล์นี้ไม่มีตัวอักษรภาษาไทย ดังนั้นข้อความภาษาไทยจึงใช้ฟอนต์ Mali (สำหรับลายมือ) และ Kanit (สำหรับตัวหนา/พาดหัว)

## เสียงบรรยาย (ไม่บังคับ)

วิดีโอสอนใช้งานนี้ไม่มีเสียงบรรยาย แต่โครงสร้างรองรับแล้ว วิธีเพิ่มเสียงบรรยายให้วิดีโอ:

1. เขียน `src/videos/<id>/narration.json` หนึ่งรายการต่อหนึ่งจังหวะ แต่ละรายการเริ่มหลังตัดฉากเล็กน้อย:

   ```json
   {
     "voice": "th-TH-PremwadeeNeural",
     "duration": 34,
     "beats": [
       { "start": 0.5, "text": "..." },
       { "start": 7.5, "text": "..." }
     ],
     "elevenlabs": { "voice": "<voice-id>", "model": "eleven_v3" }
   }
   ```

2. สร้างเสียง Edge TTS ใช้ฟรีไม่ต้องมีคีย์ หากตั้งค่า `ELEVENLABS_API_KEY` จะใช้ ElevenLabs แทน (ภาษาไทยต้องใช้ `eleven_v3` เพราะ `eleven_multilingual_v2` ไม่รองรับภาษาไทย) ต้องมี `ffmpeg`

   ```bash
   bun run voiceover <id>
   ELEVENLABS_API_KEY=your_key bun run voiceover <id>
   ```

   สคริปต์จะหยุดพร้อมแจ้งข้อผิดพลาด หากบทบรรยายของจังหวะใดยาวเกินเข้าไปในจังหวะถัดไป

3. เพิ่ม `voice: "<id>-voice.mp3"` ในการลงทะเบียนวิดีโอใน `visuals.js` แล้วเรนเดอร์

แต่ละวิดีโอยังกำหนด `fps: 60` เพื่อการเคลื่อนไหวที่ลื่นกว่าได้ (ค่าเริ่มต้น 30) ตัวอย่างพรอมต์สำหรับสั่ง Agent ให้ทำวิดีโอพร้อมเสียงบรรยายอยู่ที่ [prompts/voiceover-video-prompts.md](../../prompts/voiceover-video-prompts.md)
